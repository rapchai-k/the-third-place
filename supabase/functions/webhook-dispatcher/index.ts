import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[WEBHOOK-DISPATCHER] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook dispatcher started");

    // Initialize Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get pending webhook deliveries
    const { data: pendingDeliveries, error: fetchError } = await supabaseClient
      .from("webhook_deliveries")
      .select(`
        id,
        webhook_config_id,
        event_type,
        payload,
        attempts,
        webhook_configurations!inner(url, secret_key, is_active)
      `)
      .eq("status", "pending")
      .eq("webhook_configurations.is_active", true)
      .lt("attempts", 3) // Max 3 attempts
      .order("created_at", { ascending: true })
      .limit(50);

    if (fetchError) {
      throw new Error(`Failed to fetch pending deliveries: ${fetchError.message}`);
    }

    if (!pendingDeliveries || pendingDeliveries.length === 0) {
      logStep("No pending deliveries found");
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("Processing deliveries", { count: pendingDeliveries.length });

    let processed = 0;
    let failed = 0;

    // Process each delivery
    for (const delivery of pendingDeliveries) {
      const config = delivery.webhook_configurations;
      
      try {
        logStep("Sending webhook", { 
          deliveryId: delivery.id, 
          url: config.url,
          eventType: delivery.event_type 
        });

        // Prepare headers
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          "User-Agent": "MyThirdPlace-Webhook/1.0"
        };

        // Add signature if secret key is provided
        if (config.secret_key) {
          const payloadString = JSON.stringify(delivery.payload);
          const signature = await generateSignature(payloadString, config.secret_key);
          headers["X-Webhook-Signature"] = signature;
        }

        // Send webhook
        const response = await fetch(config.url, {
          method: "POST",
          headers,
          body: JSON.stringify(delivery.payload),
        });

        const responseBody = await response.text();

        // Update delivery status
        if (response.ok) {
          logStep("Webhook delivered successfully", { deliveryId: delivery.id });
          
          await supabaseClient
            .from("webhook_deliveries")
            .update({
              status: "delivered",
              attempts: delivery.attempts + 1,
              last_attempt_at: new Date().toISOString(),
              response_status: response.status,
              response_body: responseBody.substring(0, 1000), // Limit response body size
            })
            .eq("id", delivery.id);

          processed++;
        } else {
          throw new Error(`HTTP ${response.status}: ${responseBody}`);
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logStep("Webhook delivery failed", { 
          deliveryId: delivery.id, 
          error: errorMessage,
          attempt: delivery.attempts + 1
        });

        const newAttempts = delivery.attempts + 1;
        const newStatus = newAttempts >= 3 ? "failed" : "pending";

        await supabaseClient
          .from("webhook_deliveries")
          .update({
            status: newStatus,
            attempts: newAttempts,
            last_attempt_at: new Date().toISOString(),
            error_message: errorMessage.substring(0, 500),
          })
          .eq("id", delivery.id);

        failed++;
      }
    }

    logStep("Webhook processing completed", { processed, failed });

    return new Response(JSON.stringify({ 
      processed, 
      failed,
      total: pendingDeliveries.length 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in webhook-dispatcher", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

// Helper function to generate HMAC signature
async function generateSignature(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(payload);
  
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
  const signatureArray = new Uint8Array(signature);
  const signatureHex = Array.from(signatureArray)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return `sha256=${signatureHex}`;
}