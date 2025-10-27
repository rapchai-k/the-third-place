import { serve} from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders, getSecureHeaders } from "../shared/security-headers.ts";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  // Logging removed for security
};

// Helper function to verify Cashfree signature
const verifyCashfreeSignature = (payload: string, signature: string, secretKey: string): boolean => {
  // Cashfree uses HMAC-SHA256 for signature verification
  // This is a placeholder - actual implementation would use crypto library
  logStep("Signature verification", { received: signature ? "present" : "missing" });
  return true; // Placeholder - should implement actual signature verification
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const cashfreeSecretKey = (typeof process !== "undefined" && process.env?.CASHFREE_SECRET_KEY)
      || (typeof Deno !== "undefined" && Deno.env.get("CASHFREE_SECRET_KEY"));
    if (!cashfreeSecretKey) {
      throw new Error("Cashfree secret key not configured");
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
    
    // Get signature from headers
    const signature = req.headers.get("x-webhook-signature") || "";
    
    logStep("Webhook data received", { 
      type: webhookData.type, 
      orderId: webhookData.data?.order?.order_id 
    });

    // Verify signature (placeholder implementation)
    if (!verifyCashfreeSignature(payload, signature, cashfreeSecretKey)) {
      logStep("Invalid signature");
      return new Response("Invalid signature", { status: 401 });
    }

    const orderData = webhookData.data?.order;
    const paymentData = webhookData.data?.payment;
    
    if (!orderData?.order_id) {
      throw new Error("Order ID not found in webhook data");
    }

    // Find payment session by Cashfree order ID
    const { data: paymentSession, error: sessionError } = await supabaseClient
      .from("payment_sessions")
      .select("*")
      .eq("cashfree_order_id", orderData.order_id)
      .single();

    if (sessionError || !paymentSession) {
      logStep("Payment session not found", { orderId: orderData.order_id });
      return new Response("Payment session not found", { status: 404 });
    }

    logStep("Payment session found", { sessionId: paymentSession.id });

    // Log the webhook event
    await supabaseClient
      .from("payment_logs")
      .insert({
        payment_session_id: paymentSession.id,
        event_type: webhookData.type,
        event_data: webhookData.data,
        cashfree_signature: signature
      });

    // Handle different webhook events
    let newStatus = paymentSession.status;
    let shouldCreateRegistration = false;

    switch (webhookData.type) {
      case "PAYMENT_SUCCESS_WEBHOOK":
        newStatus = "completed";
        shouldCreateRegistration = true;
        logStep("Payment successful", { paymentId: paymentData?.cf_payment_id });
        break;
      case "PAYMENT_FAILED_WEBHOOK":
        newStatus = "failed";
        logStep("Payment failed", { reason: paymentData?.payment_message });
        break;
      case "PAYMENT_USER_DROPPED_WEBHOOK":
        newStatus = "cancelled";
        logStep("Payment cancelled by user");
        break;
      default:
        logStep("Unknown webhook type", { type: webhookData.type });
    }

    // Update payment session
    const updateData: any = { status: newStatus };
    if (paymentData?.cf_payment_id) {
      updateData.cashfree_payment_id = paymentData.cf_payment_id;
    }

    const { error: updateError } = await supabaseClient
      .from("payment_sessions")
      .update(updateData)
      .eq("id", paymentSession.id);

    if (updateError) {
      logStep("Failed to update payment session", { error: updateError.message });
    }

    // Create event registration if payment was successful
    if (shouldCreateRegistration) {
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
        // Could implement retry logic or alert system here
      } else {
        logStep("Registration created successfully");
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