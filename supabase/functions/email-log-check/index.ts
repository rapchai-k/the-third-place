import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
<<<<<<< HEAD
import { corsHeaders, getSecureHeaders } from "../shared/security-headers.ts";

function log(step: string, data?: unknown) {
  // Logging removed for security
=======

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function log(step: string, data?: unknown) {
  console.log(`[email-log-check] ${step}`, data ? JSON.stringify(data) : "");
>>>>>>> 193db8a94be7a7b5ace78e2adf90eaea66f0146c
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    }

    const sb = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

    // Create a unique test row
    const now = new Date();
    const recipient = `test-email-log-check+${now.getTime()}@example.com`;
    const subject = "TEST LOG CHECK";
    const messageId = `msg_${crypto.randomUUID()}`;

    log("Inserting test email_log row", { recipient, messageId });

    const { error: insertErr } = await sb.from("email_logs").insert({
      recipient,
      subject,
      message_id: messageId,
      status: "sent",
      provider: "resend",
      sent_at: now.toISOString(),
    });

    if (insertErr) throw new Error(`Insert failed: ${insertErr.message}`);

    // Read it back
    const { data: found, error: selectErr } = await sb
      .from("email_logs")
      .select("id, recipient, subject, message_id, status, provider, sent_at, created_at")
      .eq("message_id", messageId)
      .single();

    if (selectErr) throw new Error(`Select failed: ${selectErr.message}`);

    log("Found email_log row", found);

    // Clean up (best-effort)
    const { error: deleteErr } = await sb.from("email_logs").delete().eq("message_id", messageId);
    if (deleteErr) {
      // Do not fail if cleanup fails
      log("Cleanup delete failed", { error: deleteErr.message });
    }

    return new Response(
      JSON.stringify({ ok: true, verified: true, inserted: { recipient, messageId }, selected: found }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (e: any) {
    log("Error", { message: e?.message });
    return new Response(JSON.stringify({ ok: false, error: e?.message || String(e) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
