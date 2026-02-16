import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders, getSecureHeaders } from "../shared/security-headers.ts";
import { crypto } from "https://deno.land/std@0.190.0/crypto/mod.ts";
import { encodeHex } from "https://deno.land/std@0.190.0/encoding/hex.ts";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  // Logging removed for security
};

// Helper function to verify Razorpay webhook signature
const verifyRazorpaySignature = async (payload: string, signature: string, secret: string): Promise<boolean> => {
  if (!signature || !secret) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payload)
  );

  const expectedSignature = encodeHex(new Uint8Array(signatureBuffer));
  return signature === expectedSignature;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    // Get Razorpay webhook secret (live webhook secret takes precedence)
    const razorpayWebhookSecret = Deno.env.get("RZP_LIVE_WEBHOOK_SECRET") || Deno.env.get("RZP_WEBHOOK_SECRET");
    if (!razorpayWebhookSecret) {
      throw new Error("Razorpay webhook secret not configured");
    }

    // Initialize Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get webhook payload
    const payload = await req.text();
    const webhookData = JSON.parse(payload);

    // Get Razorpay signature from headers
    const razorpaySignature = req.headers.get("x-razorpay-signature") || "";

    logStep("Webhook data received", { eventType: webhookData.event });

    // Verify Razorpay signature
    const isValidSignature = await verifyRazorpaySignature(payload, razorpaySignature, razorpayWebhookSecret);
    if (!isValidSignature) {
      logStep("Invalid Razorpay signature");
      return new Response("Invalid signature", { status: 401 });
    }

    const paymentLinkEntity = webhookData.payload?.payment_link?.entity;
    const paymentEntity = webhookData.payload?.payment?.entity;

    // Get payment link ID from the webhook
    const paymentLinkId = paymentLinkEntity?.id || paymentEntity?.notes?.payment_link_id;
    const referenceId = paymentLinkEntity?.reference_id;

    logStep("Razorpay webhook details", {
      event: webhookData.event,
      paymentLinkId,
      referenceId
    });

    // Find payment session by Razorpay payment link ID or reference_id (which is our session ID)
    let paymentSession: any = null;
    if (referenceId) {
      const { data, error } = await supabaseClient
        .from("payment_sessions")
        .select("*")
        .eq("id", referenceId)
        .single();
      paymentSession = data;
    } else if (paymentLinkId) {
      const { data, error } = await supabaseClient
        .from("payment_sessions")
        .select("*")
        .eq("razorpay_payment_link_id", paymentLinkId)
        .single();
      paymentSession = data;
    }

    if (!paymentSession) {
      logStep("Payment session not found", { paymentLinkId, referenceId });
      return new Response("Payment session not found", { status: 404 });
    }

    logStep("Payment session found", { sessionId: paymentSession.id });

    // Log the webhook event
    await supabaseClient
      .from("payment_logs")
      .insert({
        payment_session_id: paymentSession.id,
        event_type: webhookData.event,
        event_data: webhookData.payload
      });

    // Handle different Razorpay webhook events
    let newStatus = paymentSession.status;
    let newPaymentStatus = paymentSession.payment_status || 'yet_to_pay';
    const updateData: any = {};

    switch (webhookData.event) {
      case "payment_link.paid":
        newStatus = "completed";
        newPaymentStatus = "paid";
        logStep("Razorpay payment successful");
        break;
      case "payment.captured":
        newStatus = "completed";
        newPaymentStatus = "paid";
        logStep("Razorpay payment captured", { paymentId: paymentEntity?.id });
        break;
      case "payment.failed":
        newStatus = "failed";
        newPaymentStatus = "failed";
        logStep("Razorpay payment failed", { reason: paymentEntity?.error_description });
        break;
      case "payment_link.cancelled":
        newStatus = "cancelled";
        newPaymentStatus = "cancelled";
        logStep("Razorpay payment link cancelled");
        break;
      case "payment_link.expired":
        newStatus = "expired";
        newPaymentStatus = "expired";
        logStep("Razorpay payment link expired");
        break;
      default:
        logStep("Unknown Razorpay webhook event", { event: webhookData.event });
    }

    // Set update data
    updateData.status = newStatus;
    updateData.payment_status = newPaymentStatus;
    if (paymentEntity?.id) {
      updateData.razorpay_payment_id = paymentEntity.id;
    }

    // Update payment session with new status and payment_status
    const { error: updateError } = await supabaseClient
      .from("payment_sessions")
      .update(updateData)
      .eq("id", paymentSession.id);

    if (updateError) {
      logStep("Failed to update payment session", { error: updateError.message });
    } else {
      logStep("Payment session updated successfully", {
        status: newStatus,
        payment_status: newPaymentStatus
      });
    }

    // Create registration if payment was successful
    // Use upsert with onConflict to handle race condition between webhook and polling
    if (newPaymentStatus === "paid") {
      // Auto-join community: ensure the user is a member of the event's community
      const { data: eventData } = await supabaseClient
        .from("events")
        .select("community_id")
        .eq("id", paymentSession.event_id)
        .single();

      if (eventData?.community_id) {
        const { data: existingMembership } = await supabaseClient
          .from("community_members")
          .select("user_id")
          .eq("community_id", eventData.community_id)
          .eq("user_id", paymentSession.user_id)
          .maybeSingle();

        if (!existingMembership) {
          const { error: joinError } = await supabaseClient
            .from("community_members")
            .insert({
              community_id: eventData.community_id,
              user_id: paymentSession.user_id
            });

          if (joinError) {
            logStep("Failed to auto-join community", { error: joinError.message });
          } else {
            logStep("User auto-joined community via payment webhook");
          }
        }
      }

      const { error: regError } = await supabaseClient
        .from("event_registrations")
        .upsert({
          event_id: paymentSession.event_id,
          user_id: paymentSession.user_id,
          status: "registered",
          payment_session_id: paymentSession.id,
          payment_id: paymentEntity?.id || null
        }, {
          onConflict: 'user_id,event_id',
          ignoreDuplicates: true
        });

      if (regError) {
        logStep("Failed to create/update registration", { error: regError.message });
      } else {
        logStep("Registration upserted successfully for paid event", { payment_id: paymentEntity?.id });
      }
    }

    return new Response("OK", {
      headers: corsHeaders,
      status: 200
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in payment-callback", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});