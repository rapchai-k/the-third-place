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

    // Get Razorpay credentials (production keys take precedence over test keys)
    const razorpayKeyId = Deno.env.get("RZP_KEY_ID") || Deno.env.get("RZP_TEST_KEY_ID");
    const razorpayKeySecret = Deno.env.get("RZP_KEY_SECRET") || Deno.env.get("RZP_TEST_KEY_SECRET");
    const razorpayBaseUrl = Deno.env.get("RZP_BASE_URL") || "https://api.razorpay.com";

    // Get Cashfree credentials (for grace period - handling legacy payments)
    const cashfreeAppId = Deno.env.get("CASHFREE_APP_ID");
    const cashfreeSecretKey = Deno.env.get("CASHFREE_SECRET_KEY");
    const cashfreeBaseUrl = Deno.env.get("CASHFREE_BASE_URL") || "https://sandbox.cashfree.com";

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

    // Determine gateway type (default to cashfree for legacy payments)
    const gateway = paymentSession.gateway || 'cashfree';
    logStep("Payment session found", { gateway, sessionId: paymentSession.id });

    let newStatus = paymentSession.status;
    let newPaymentStatus = paymentSession.payment_status || 'yet_to_pay';
    let orderStatusResponse: string = 'unknown';

    // Handle Razorpay verification
    if (gateway === 'razorpay') {
      if (!razorpayKeyId || !razorpayKeySecret) {
        throw new Error("Razorpay credentials not configured");
      }

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

      // Map Razorpay statuses to internal statuses
      switch (linkStatus.status) {
        case "paid":
          newStatus = "completed";
          newPaymentStatus = "paid";
          break;
        case "expired":
        case "cancelled":
          newStatus = "failed";
          // Payment status remains 'yet_to_pay' for failed payments
          break;
        case "created":
        case "partially_paid":
          newStatus = "pending";
          // Payment status remains 'yet_to_pay' for pending payments
          break;
      }
    }
    // Handle Cashfree verification (legacy - for grace period)
    else if (gateway === 'cashfree') {
      if (!cashfreeAppId || !cashfreeSecretKey) {
        throw new Error("Cashfree credentials not configured");
      }

      if (!paymentSession.cashfree_order_id) {
        throw new Error("Cashfree order ID not found");
      }

      logStep("Verifying Cashfree payment", { orderId: paymentSession.cashfree_order_id });

      const cashfreeResponse = await fetch(
        `${cashfreeBaseUrl}/pg/orders/${paymentSession.cashfree_order_id}`,
        {
          method: "GET",
          headers: {
            "x-client-id": cashfreeAppId,
            "x-client-secret": cashfreeSecretKey,
            "x-api-version": "2023-08-01"
          }
        }
      );

      if (!cashfreeResponse.ok) {
        const errorData = await cashfreeResponse.text();
        throw new Error(`Cashfree API error: ${cashfreeResponse.status} - ${errorData}`);
      }

      const orderStatus = await cashfreeResponse.json();
      logStep("Cashfree order status", { status: orderStatus.order_status });
      orderStatusResponse = orderStatus.order_status;

      // Map Cashfree statuses to internal statuses
      switch (orderStatus.order_status) {
        case "PAID":
          newStatus = "completed";
          newPaymentStatus = "paid";
          break;
        case "EXPIRED":
        case "TERMINATED":
          newStatus = "failed";
          break;
        case "ACTIVE":
          newStatus = "pending";
          break;
      }
    } else {
      throw new Error(`Unknown payment gateway: ${gateway}`);
    }

    // Update payment session if status or payment_status changed
    if (newStatus !== paymentSession.status || newPaymentStatus !== paymentSession.payment_status) {
      const { error: updateError } = await supabaseClient
        .from("payment_sessions")
        .update({
          status: newStatus,
          payment_status: newPaymentStatus
        })
        .eq("id", paymentSession.id);

      if (updateError) {
        logStep("Failed to update payment session", { error: updateError.message });
      } else {
        logStep("Payment session updated successfully", {
          status: newStatus,
          payment_status: newPaymentStatus
        });
      }
    }

    // Create registration if payment succeeded but registration doesn't exist yet
    // This is a fallback in case the webhook failed to create registration
    if (newPaymentStatus === "paid") {
      const { data: existingRegistration, error: regCheckError } = await supabaseClient
        .from("event_registrations")
        .select("id")
        .eq("event_id", paymentSession.event_id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (regCheckError) {
        logStep("Error checking existing registration", { error: regCheckError.message });
      } else if (!existingRegistration) {
        // Create new registration for successful payment
        const { error: regError } = await supabaseClient
          .from("event_registrations")
          .insert({
            event_id: paymentSession.event_id,
            user_id: user.id,
            status: "registered",
            payment_session_id: paymentSession.id
          });

        if (regError) {
          logStep("Failed to create registration", { error: regError.message });
        } else {
          logStep("Registration created via verify-payment fallback");
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