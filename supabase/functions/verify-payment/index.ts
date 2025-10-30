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

    // Get Cashfree credentials
    const cashfreeAppId = Deno.env.get("CASHFREE_APP_ID");
    const cashfreeSecretKey = Deno.env.get("CASHFREE_SECRET_KEY");
    const cashfreeBaseUrl = Deno.env.get("CASHFREE_BASE_URL") || "https://sandbox.cashfree.com";

    if (!cashfreeAppId || !cashfreeSecretKey) {
      throw new Error("Cashfree credentials not configured");
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

    if (!paymentSession.cashfree_order_id) {
      throw new Error("Cashfree order ID not found");
    }

    logStep("Payment session found", { orderId: paymentSession.cashfree_order_id });

    // Query Cashfree API for order status
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

    // Update payment session based on Cashfree status
    let newStatus = paymentSession.status;
    let shouldCreateRegistration = false;

    switch (orderStatus.order_status) {
      case "PAID":
        newStatus = "completed";
        shouldCreateRegistration = true;
        break;
      case "EXPIRED":
      case "TERMINATED":
        newStatus = "failed";
        break;
      case "ACTIVE":
        newStatus = "pending";
        break;
    }

    // Update payment session if status changed
    if (newStatus !== paymentSession.status) {
      const { error: updateError } = await supabaseClient
        .from("payment_sessions")
        .update({ status: newStatus })
        .eq("id", paymentSession.id);

      if (updateError) {
        logStep("Failed to update payment session", { error: updateError.message });
      }
    }

    // Create registration if payment was successful
    if (shouldCreateRegistration && newStatus === "completed") {
      const { data: existingRegistration } = await supabaseClient
        .from("event_registrations")
        .select("id")
        .eq("payment_session_id", paymentSession.id)
        .single();

      if (!existingRegistration) {
        const { error: registrationError } = await supabaseClient
          .from("event_registrations")
          .insert({
            user_id: paymentSession.user_id,
            event_id: paymentSession.event_id,
            payment_session_id: paymentSession.id,
            status: "confirmed"
          });

        if (registrationError) {
          logStep("Failed to create registration", { error: registrationError.message });
        } else {
          logStep("Registration created successfully");
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      payment_status: newStatus,
      order_status: orderStatus.order_status,
      payment_session: {
        id: paymentSession.id,
        status: newStatus,
        amount: paymentSession.amount,
        currency: paymentSession.currency
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