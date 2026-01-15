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

// Helper function to verify Cashfree signature (legacy - for grace period)
const verifyCashfreeSignature = (payload: string, signature: string, secretKey: string): boolean => {
  // Cashfree uses HMAC-SHA256 for signature verification
  // This is a placeholder - actual implementation would use crypto library
  logStep("Cashfree signature verification", { received: signature ? "present" : "missing" });
  return true; // Placeholder - should implement actual signature verification
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    // Get credentials for both gateways
    const razorpayWebhookSecret = Deno.env.get("RZP_WEBHOOK_SECRET");
    const cashfreeSecretKey = Deno.env.get("CASHFREE_SECRET_KEY");

    // Initialize Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get webhook payload
    const payload = await req.text();
    const webhookData = JSON.parse(payload);

    // Get signature from headers (check both Razorpay and Cashfree headers)
    const razorpaySignature = req.headers.get("x-razorpay-signature") || "";
    const cashfreeSignature = req.headers.get("x-webhook-signature") || "";

    // Determine if this is a Razorpay or Cashfree webhook
    const isRazorpayWebhook = webhookData.event !== undefined || razorpaySignature;

    logStep("Webhook data received", {
      isRazorpay: isRazorpayWebhook,
      eventType: isRazorpayWebhook ? webhookData.event : webhookData.type
    });

    let paymentSession: any = null;
    let newStatus: string;
    let newPaymentStatus: string;
    let updateData: any = {};

    if (isRazorpayWebhook) {
      // Handle Razorpay webhook
      if (!razorpayWebhookSecret) {
        throw new Error("Razorpay webhook secret not configured");
      }

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
        logStep("Payment session not found for Razorpay webhook", { paymentLinkId, referenceId });
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
      newStatus = paymentSession.status;
      newPaymentStatus = paymentSession.payment_status || 'yet_to_pay';

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
          logStep("Razorpay payment failed", { reason: paymentEntity?.error_description });
          break;
        case "payment_link.cancelled":
        case "payment_link.expired":
          newStatus = "failed";
          logStep("Razorpay payment link cancelled/expired");
          break;
        default:
          logStep("Unknown Razorpay webhook event", { event: webhookData.event });
      }

      // Set update data for Razorpay
      updateData = {
        status: newStatus,
        payment_status: newPaymentStatus
      };
      if (paymentEntity?.id) {
        updateData.razorpay_payment_id = paymentEntity.id;
      }
    } else {
      // Handle Cashfree webhook (legacy - for grace period)
      if (!cashfreeSecretKey) {
        throw new Error("Cashfree secret key not configured");
      }

      // Verify Cashfree signature (placeholder)
      if (!verifyCashfreeSignature(payload, cashfreeSignature, cashfreeSecretKey)) {
        logStep("Invalid Cashfree signature");
        return new Response("Invalid signature", { status: 401 });
      }

      const orderData = webhookData.data?.order;
      const paymentData = webhookData.data?.payment;

      if (!orderData?.order_id) {
        throw new Error("Order ID not found in Cashfree webhook data");
      }

      logStep("Cashfree webhook details", {
        type: webhookData.type,
        orderId: orderData.order_id
      });

      // Find payment session by Cashfree order ID
      const { data, error: sessionError } = await supabaseClient
        .from("payment_sessions")
        .select("*")
        .eq("cashfree_order_id", orderData.order_id)
        .single();

      if (sessionError || !data) {
        logStep("Payment session not found for Cashfree webhook", { orderId: orderData.order_id });
        return new Response("Payment session not found", { status: 404 });
      }

      paymentSession = data;
      logStep("Payment session found", { sessionId: paymentSession.id });

      // Log the webhook event
      await supabaseClient
        .from("payment_logs")
        .insert({
          payment_session_id: paymentSession.id,
          event_type: webhookData.type,
          event_data: webhookData.data,
          cashfree_signature: cashfreeSignature
        });

      // Handle different Cashfree webhook events
      newStatus = paymentSession.status;
      newPaymentStatus = paymentSession.payment_status || 'yet_to_pay';

      switch (webhookData.type) {
        case "PAYMENT_SUCCESS_WEBHOOK":
          newStatus = "completed";
          newPaymentStatus = "paid";
          logStep("Cashfree payment successful", { paymentId: paymentData?.cf_payment_id });
          break;
        case "PAYMENT_FAILED_WEBHOOK":
          newStatus = "failed";
          logStep("Cashfree payment failed", { reason: paymentData?.payment_message });
          break;
        case "PAYMENT_USER_DROPPED_WEBHOOK":
          newStatus = "cancelled";
          logStep("Cashfree payment cancelled by user");
          break;
        default:
          logStep("Unknown Cashfree webhook type", { type: webhookData.type });
      }

      // Set update data for Cashfree
      updateData = {
        status: newStatus,
        payment_status: newPaymentStatus
      };
      if (paymentData?.cf_payment_id) {
        updateData.cashfree_payment_id = paymentData.cf_payment_id;
      }
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
    if (newPaymentStatus === "paid") {
      // Check if registration already exists (use maybeSingle to handle 0 rows gracefully)
      const { data: existingRegistration, error: regCheckError } = await supabaseClient
        .from("event_registrations")
        .select("id")
        .eq("event_id", paymentSession.event_id)
        .eq("user_id", paymentSession.user_id)
        .maybeSingle();

      if (regCheckError) {
        logStep("Error checking existing registration", { error: regCheckError.message });
      } else if (!existingRegistration) {
        // Create new registration for successful payment
        const { error: regError } = await supabaseClient
          .from("event_registrations")
          .insert({
            event_id: paymentSession.event_id,
            user_id: paymentSession.user_id,
            status: "registered",
            payment_session_id: paymentSession.id
          });

        if (regError) {
          logStep("Failed to create registration", { error: regError.message });
        } else {
          logStep("Registration created successfully for paid event");
        }
      } else {
        logStep("Registration already exists, skipping creation");
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