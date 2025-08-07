import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Get Cashfree credentials from environment
    const cashfreeAppId = Deno.env.get("CASHFREE_APP_ID");
    const cashfreeSecretKey = Deno.env.get("CASHFREE_SECRET_KEY");
    const cashfreeBaseUrl = Deno.env.get("CASHFREE_BASE_URL") || "https://sandbox.cashfree.com"; // Default to sandbox

    if (!cashfreeAppId || !cashfreeSecretKey) {
      throw new Error("Cashfree credentials not configured. Please add CASHFREE_APP_ID and CASHFREE_SECRET_KEY to edge function secrets.");
    }

    // Initialize Supabase client with service role key
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

    logStep("User authenticated", { userId: user.id });

    // Parse request body
    const { eventId } = await req.json();
    if (!eventId) throw new Error("Event ID is required");

    // Get event details
    const { data: event, error: eventError } = await supabaseClient
      .from("events")
      .select("id, title, price, currency")
      .eq("id", eventId)
      .single();

    if (eventError) throw new Error(`Event not found: ${eventError.message}`);
    if (!event.price || event.price <= 0) throw new Error("This event is free - no payment required");

    logStep("Event found", { eventId: event.id, price: event.price, currency: event.currency });

    // Check if user is already registered
    const { data: existingRegistration } = await supabaseClient
      .from("event_registrations")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .single();

    if (existingRegistration) {
      throw new Error("User is already registered for this event");
    }

    // Create payment session in database
    const { data: paymentSession, error: sessionError } = await supabaseClient
      .from("payment_sessions")
      .insert({
        user_id: user.id,
        event_id: eventId,
        amount: event.price,
        currency: event.currency,
        status: "pending"
      })
      .select()
      .single();

    if (sessionError) throw new Error(`Failed to create payment session: ${sessionError.message}`);

    logStep("Payment session created", { sessionId: paymentSession.id });

    // Generate unique order ID
    const orderId = `EVENT_${eventId}_${paymentSession.id}`.replace(/-/g, '').slice(0, 20);

    // Create Cashfree order
    const cashfreeOrder = {
      order_id: orderId,
      order_amount: event.price,
      order_currency: event.currency,
      customer_details: {
        customer_id: user.id,
        customer_email: user.email,
        customer_phone: "9999999999" // Placeholder - should be from user profile
      },
      order_meta: {
        return_url: `${req.headers.get("origin")}/payment-success?session_id=${paymentSession.id}`,
        notify_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/payment-callback`
      }
    };

    logStep("Creating Cashfree order", { orderId });

    // Make request to Cashfree API
    const cashfreeResponse = await fetch(`${cashfreeBaseUrl}/pg/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": cashfreeAppId,
        "x-client-secret": cashfreeSecretKey,
        "x-api-version": "2023-08-01"
      },
      body: JSON.stringify(cashfreeOrder)
    });

    if (!cashfreeResponse.ok) {
      const errorData = await cashfreeResponse.text();
      logStep("Cashfree API error", { status: cashfreeResponse.status, error: errorData });
      throw new Error(`Cashfree API error: ${cashfreeResponse.status} - ${errorData}`);
    }

    const cashfreeData = await cashfreeResponse.json();
    logStep("Cashfree order created", { cashfreeOrderId: cashfreeData.order_id });

    // Update payment session with Cashfree details
    const { error: updateError } = await supabaseClient
      .from("payment_sessions")
      .update({
        cashfree_order_id: cashfreeData.order_id,
        payment_url: cashfreeData.payment_link
      })
      .eq("id", paymentSession.id);

    if (updateError) {
      logStep("Failed to update payment session", { error: updateError.message });
    }

    // Log payment creation
    await supabaseClient
      .from("payment_logs")
      .insert({
        payment_session_id: paymentSession.id,
        event_type: "payment_created",
        event_data: { cashfree_order: cashfreeData }
      });

    logStep("Payment creation completed", { paymentUrl: cashfreeData.payment_link });

    return new Response(JSON.stringify({
      success: true,
      payment_session_id: paymentSession.id,
      payment_url: cashfreeData.payment_link,
      order_id: cashfreeData.order_id
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-payment", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});