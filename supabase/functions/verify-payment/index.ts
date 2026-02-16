import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders, getSecureHeaders } from "../shared/security-headers.ts";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  // Logging removed for security
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Get Razorpay credentials (live keys take precedence over test keys)
    const razorpayKeyId = Deno.env.get("RZP_LIVE_KEY_ID") || Deno.env.get("RZP_TEST_KEY_ID");
    const razorpayKeySecret = Deno.env.get("RZP_LIVE_KEY_SECRET") || Deno.env.get("RZP_TEST_KEY_SECRET");
    const razorpayBaseUrl = Deno.env.get("RZP_BASE_URL") || "https://api.razorpay.com";

    if (!razorpayKeyId || !razorpayKeySecret) {
      throw new Error("Razorpay credentials not configured");
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.id) throw new Error("User not authenticated");

    // Parse request body
    const { paymentSessionId } = await req.json();
    if (!paymentSessionId) throw new Error("Payment session ID is required");

    logStep("Verifying payment", { sessionId: paymentSessionId, userId: user.id });

    // Get payment session
    const { data: paymentSession, error: sessionError } = await supabaseClient
      .from("payment_sessions")
      .select("*")
      .eq("id", paymentSessionId)
      .eq("user_id", user.id) // Ensure user can only verify their own payments
      .single();

    if (sessionError || !paymentSession) {
      throw new Error("Payment session not found");
    }

    const isCancelledByUser = Boolean(paymentSession.cancelled_by_user_at);

    // Only Razorpay is supported
    const gateway = paymentSession.gateway || 'razorpay';
    if (gateway !== 'razorpay') {
      throw new Error(`Unsupported payment gateway: ${gateway}`);
    }

    logStep("Payment session found", { gateway, sessionId: paymentSession.id });

    let newStatus = paymentSession.status;
    let newPaymentStatus = paymentSession.payment_status || 'yet_to_pay';
    let orderStatusResponse: string = 'unknown';

    if (!paymentSession.razorpay_payment_link_id) {
      throw new Error("Razorpay payment link ID not found");
    }

    logStep("Verifying Razorpay payment", { paymentLinkId: paymentSession.razorpay_payment_link_id });

    const razorpayResponse = await fetch(
      `${razorpayBaseUrl}/v1/payment_links/${paymentSession.razorpay_payment_link_id}`,
      {
        method: "GET",
        headers: {
          "Authorization": `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}`
        }
      }
    );

    if (!razorpayResponse.ok) {
      const errorData = await razorpayResponse.text();
      throw new Error(`Razorpay API error: ${razorpayResponse.status} - ${errorData}`);
    }

    const linkStatus = await razorpayResponse.json();
    logStep("Razorpay payment link status", { status: linkStatus.status });
    orderStatusResponse = linkStatus.status;

    // Extract razorpay_payment_id from the payments array if available
    let razorpayPaymentId: string | null = null;
    if (linkStatus.payments && Array.isArray(linkStatus.payments) && linkStatus.payments.length > 0) {
      // Get the most recent successful payment
      const successfulPayment = linkStatus.payments.find(
        (p: { status: string }) => p.status === 'captured' || p.status === 'authorized'
      ) || linkStatus.payments[0];
      razorpayPaymentId = successfulPayment?.payment_id || null;
      logStep("Extracted razorpay_payment_id", { razorpayPaymentId });
    }

    // Map Razorpay statuses to internal statuses
    switch (linkStatus.status) {
      case "paid":
        newStatus = "completed";
        newPaymentStatus = "paid";
        break;
      case "expired":
        newStatus = "expired";
        newPaymentStatus = "expired";
        break;
      case "cancelled":
        newStatus = "cancelled";
        newPaymentStatus = "cancelled";
        break;
      case "created":
      case "partially_paid":
        newStatus = "pending";
        // Payment status remains 'yet_to_pay' for pending payments
        break;
    }

    // Update payment session if status, payment_status, or payment_id changed
    const needsUpdate = newStatus !== paymentSession.status ||
                        newPaymentStatus !== paymentSession.payment_status ||
                        (razorpayPaymentId && !paymentSession.razorpay_payment_id);

    if (needsUpdate) {
      const updateData: { status: string; payment_status: string; razorpay_payment_id?: string } = {
        status: newStatus,
        payment_status: newPaymentStatus
      };

      // Only update razorpay_payment_id if we have a new one and it's not already set
      if (razorpayPaymentId && !paymentSession.razorpay_payment_id) {
        updateData.razorpay_payment_id = razorpayPaymentId;
      }

      const { error: updateError } = await supabaseClient
        .from("payment_sessions")
        .update(updateData)
        .eq("id", paymentSession.id);

      if (updateError) {
        logStep("Failed to update payment session", { error: updateError.message });
      } else {
        logStep("Payment session updated successfully", {
          status: newStatus,
          payment_status: newPaymentStatus,
          razorpay_payment_id: razorpayPaymentId
        });
      }
    }

    // Create registration if payment succeeded but registration doesn't exist yet
    // This is a fallback in case the webhook failed to create registration
    // Use upsert with onConflict to handle race condition between webhook and polling
    if (newPaymentStatus === "paid") {
      if (isCancelledByUser) {
        logStep("Skipping registration create: user cancelled before paid status", {
          sessionId: paymentSession.id,
          cancelled_by_user_at: paymentSession.cancelled_by_user_at
        });

        if (paymentSession.payment_status !== "paid") {
          await supabaseClient
            .from("payment_logs")
            .insert({
              payment_session_id: paymentSession.id,
              event_type: "payment_paid_after_user_cancel",
              event_data: {
                source: "verify-payment",
                cancelled_by_user_at: paymentSession.cancelled_by_user_at
              }
            });
        }
      } else {
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
            .eq("user_id", user.id)
            .maybeSingle();

          if (!existingMembership) {
            const { error: joinError } = await supabaseClient
              .from("community_members")
              .insert({
                community_id: eventData.community_id,
                user_id: user.id
              });

            if (joinError) {
              logStep("Failed to auto-join community", { error: joinError.message });
            } else {
              logStep("User auto-joined community via verify-payment");
            }
          }
        }

        // Use the extracted razorpayPaymentId or the one from payment session
        const paymentId = razorpayPaymentId || paymentSession.razorpay_payment_id || null;

        const { error: regError } = await supabaseClient
          .from("event_registrations")
          .upsert({
            event_id: paymentSession.event_id,
            user_id: user.id,
            status: "registered",
            payment_session_id: paymentSession.id,
            payment_id: paymentId
          }, {
            onConflict: 'user_id,event_id',
            ignoreDuplicates: true
          });

        if (regError) {
          logStep("Failed to create/update registration", { error: regError.message });
        } else {
          logStep("Registration upserted via verify-payment fallback", { payment_id: paymentId });
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      payment_status: newPaymentStatus,
      order_status: orderStatusResponse,
      gateway: gateway,
      payment_session: {
        id: paymentSession.id,
        status: newStatus,
        payment_status: newPaymentStatus,
        amount: paymentSession.amount,
        currency: paymentSession.currency,
        event_id: paymentSession.event_id
      }
    }), {
      headers: getSecureHeaders({ "Content-Type": "application/json" }),
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in verify-payment", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: getSecureHeaders({ "Content-Type": "application/json" }),
      status: 500,
    });
  }
});
