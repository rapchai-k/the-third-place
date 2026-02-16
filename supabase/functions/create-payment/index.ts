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

    // Get Razorpay credentials from environment (live keys take precedence over test keys)
    const razorpayKeyId = Deno.env.get("RZP_LIVE_KEY_ID") || Deno.env.get("RZP_TEST_KEY_ID");
    const razorpayKeySecret = Deno.env.get("RZP_LIVE_KEY_SECRET") || Deno.env.get("RZP_TEST_KEY_SECRET");
    const razorpayBaseUrl = Deno.env.get("RZP_BASE_URL") || "https://api.razorpay.com";

    if (!razorpayKeyId || !razorpayKeySecret) {
      throw new Error("Razorpay credentials not configured. Please add RZP_LIVE_KEY_ID/RZP_LIVE_KEY_SECRET or RZP_TEST_KEY_ID/RZP_TEST_KEY_SECRET to edge function secrets.");
    }

    // Initialize Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Check if payments are enabled via feature flag (hard gate)
    const { data: paymentsSettingData, error: settingsError } = await supabaseClient
      .from("app_settings")
      .select("value")
      .eq("key", "enable_payments")
      .maybeSingle();

    // Default to disabled if setting not found or error
    const paymentsEnabled = paymentsSettingData?.value === "true";

    if (!paymentsEnabled) {
      logStep("Payments disabled via feature flag");
      return new Response(JSON.stringify({
        error: "Payments are currently disabled. Please check back soon."
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 503, // Service Unavailable
      });
    }

    logStep("Payments enabled, proceeding with payment creation");

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
    const { data: existingRegistration, error: registrationError } = await supabaseClient
      .from("event_registrations")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .single();

    // PGRST116 means no rows found, which is expected when user is not registered
    if (registrationError && registrationError.code !== 'PGRST116') {
      throw new Error(`Error checking registration: ${registrationError.message}`);
    }

    if (existingRegistration) {
      throw new Error("User is already registered for this event");
    }

    // Reuse active payment session to make create-payment idempotent for repeated clicks/retries
    const { data: existingSession, error: existingSessionError } = await supabaseClient
      .from("payment_sessions")
      .select("id, payment_url, razorpay_payment_link_id, status, payment_status")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .in("status", ["pending", "completed"])
      .eq("payment_status", "yet_to_pay")
      .not("razorpay_payment_link_id", "is", null)
      .not("payment_url", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingSessionError) {
      throw new Error(`Failed to check existing payment session: ${existingSessionError.message}`);
    }

    if (existingSession) {
      logStep("Reusing existing active payment session", { sessionId: existingSession.id });
      return new Response(JSON.stringify({
        success: true,
        payment_session_id: existingSession.id,
        payment_url: existingSession.payment_url,
        payment_link_id: existingSession.razorpay_payment_link_id
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Create payment session in database with payment_status='yet_to_pay' and gateway='razorpay'
    const { data: paymentSession, error: sessionError } = await supabaseClient
      .from("payment_sessions")
      .insert({
        user_id: user.id,
        event_id: eventId,
        amount: event.price,
        currency: event.currency,
        status: "pending",
        payment_status: "yet_to_pay",
        gateway: "razorpay"
      })
      .select()
      .single();

    if (sessionError) throw new Error(`Failed to create payment session: ${sessionError.message}`);

    logStep("Payment session created", { sessionId: paymentSession.id });

    // Get user profile for customer details
    const { data: userProfile } = await supabaseClient
      .from("users")
      .select("name, whatsapp_number")
      .eq("id", user.id)
      .single();

    // Create Razorpay Payment Link
    const razorpayPaymentLink = {
      amount: Math.round(event.price * 100), // Convert to paise (smallest currency unit)
      currency: event.currency,
      description: `Registration for ${event.title}`,
      customer: {
        email: user.email,
        name: userProfile?.name || "User",
        contact: userProfile?.whatsapp_number || undefined
      },
      callback_url: `${req.headers.get("origin")}/payment-success?session_id=${paymentSession.id}`,
      callback_method: "get",
      reference_id: paymentSession.id,
      expire_by: Math.floor((Date.now() + 24 * 60 * 60 * 1000) / 1000), // 24 hours from now
      notify: {
        sms: false,
        email: true
      },
      notes: {
        event_id: eventId,
        user_id: user.id,
        payment_session_id: paymentSession.id
      }
    };

    logStep("Creating Razorpay Payment Link", { reference_id: paymentSession.id });

    let razorpayData: { id: string; short_url: string };
    try {
      // Make request to Razorpay API
      const razorpayResponse = await fetch(`${razorpayBaseUrl}/v1/payment_links`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}`
        },
        body: JSON.stringify(razorpayPaymentLink)
      });

      if (!razorpayResponse.ok) {
        const errorData = await razorpayResponse.text();
        logStep("Razorpay API error", { status: razorpayResponse.status, error: errorData });
        throw new Error(`Razorpay API error: ${razorpayResponse.status} - ${errorData}`);
      }

      razorpayData = await razorpayResponse.json();
    } catch (razorpayError) {
      const errorMessage = razorpayError instanceof Error ? razorpayError.message : String(razorpayError);
      logStep("Payment link creation failed, marking session failed", {
        sessionId: paymentSession.id,
        error: errorMessage
      });

      const { error: markFailedError } = await supabaseClient
        .from("payment_sessions")
        .update({ status: "failed" })
        .eq("id", paymentSession.id);

      if (markFailedError) {
        logStep("Failed to mark payment session as failed", { sessionId: paymentSession.id, error: markFailedError.message });
      }

      await supabaseClient
        .from("payment_logs")
        .insert({
          payment_session_id: paymentSession.id,
          event_type: "payment_link_creation_failed",
          event_data: { error: errorMessage }
        });

      throw new Error("Payment initialization failed. Please try again.");
    }

    logStep("Razorpay Payment Link created", { paymentLinkId: razorpayData.id });

    // Update payment session with Razorpay details
    const { error: updateError } = await supabaseClient
      .from("payment_sessions")
      .update({
        razorpay_payment_link_id: razorpayData.id,
        payment_url: razorpayData.short_url
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
        event_data: { razorpay_payment_link: razorpayData }
      });

    logStep("Payment creation completed", { paymentUrl: razorpayData.short_url });

    return new Response(JSON.stringify({
      success: true,
      payment_session_id: paymentSession.id,
      payment_url: razorpayData.short_url,
      payment_link_id: razorpayData.id
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
