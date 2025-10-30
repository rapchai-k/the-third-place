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

    // Initialize Supabase client with service role key to bypass RLS
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get user from auth header (optional for some events like page views)
    const authHeader = req.headers.get("Authorization");
    let userId = null;

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
      if (!userError && userData.user) {
        userId = userData.user.id;
        logStep("User authenticated", { userId });
      }
    }

    // Parse request body
    const { action_type, target_type, target_id, metadata } = await req.json();

    if (!action_type || !target_type) {
      throw new Error("action_type and target_type are required");
    }

    // For anonymous actions, use a placeholder user ID or skip if user is required
    const finalUserId = userId || (metadata?.anonymous ? "00000000-0000-0000-0000-000000000000" : null);

    if (!finalUserId) {
      throw new Error("User authentication required for this activity");
    }

    logStep("Logging activity", { action_type, target_type, target_id, userId: finalUserId });

    // Insert activity log
    const { data, error } = await supabaseClient
      .from("user_activity_log")
      .insert({
        user_id: finalUserId,
        action_type,
        target_type,
        target_id,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
          user_agent: req.headers.get("User-Agent"),
          ip_address: req.headers.get("CF-Connecting-IP") || req.headers.get("X-Forwarded-For"),
        }
      })
      .select()
      .single();

    if (error) throw error;

    logStep("Activity logged successfully", { activityId: data.id });

    return new Response(JSON.stringify({
      success: true,
      activity_id: data.id
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in log-activity", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});