import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateWelcomeEmailTemplate } from "../shared/email-templates.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-correlation-id",
};

interface WelcomeEmailRequest {
  userId: string;
  userEmail: string;
  userName: string;
}

interface WelcomeEmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  alreadySent?: boolean;
}

// ---- utilities ---------------------------------------------------------------

function nowISO() {
  return new Date().toISOString();
}

function maskEmail(email?: string) {
  if (!email) return email;
  const [u, d] = email.split("@");
  if (!d) return email;
  return `${u.slice(0, 2)}***@${d}`;
}

function toPlain(obj: unknown) {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch {
    return String(obj);
  }
}

function mkLogger(correlationId: string) {
  return function log(step: string, data?: Record<string, unknown>, level: "log" | "warn" | "error" = "log") {
    const line = {
      ts: nowISO(),
      lvl: level,
      mod: "welcome-email-trigger",
      step,
      correlationId,
      data: toPlain(data),
    };
    // single-line JSON (friendlier for log aggregators)
    console[level](JSON.stringify(line));
  };
}

// Safe JSON body read with diagnostics
async function readJson<T>(req: Request, log: ReturnType<typeof mkLogger>): Promise<T> {
  try {
    const txt = await req.text();
    log("request.raw", { bodyPreview: txt.slice(0, 500) }); // preview only
    return txt ? JSON.parse(txt) as T : ({} as T);
  } catch (e) {
    log("request.json.parse_error", { error: String(e) }, "error");
    throw new Error("Invalid JSON body");
  }
}

// ---- function ---------------------------------------------------------------

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Correlation ID (propagate & log)
  const correlationId = crypto.randomUUID();
  const log = mkLogger(correlationId);

  try {
    log("start", {
      method: req.method,
      url: req.url,
      region: Deno.env.get("FLY_REGION") ?? Deno.env.get("SUPABASE_REGION") ?? "unknown",
      runtime: "supabase-edge-runtime",
    });

    // Env guards
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!SUPABASE_URL) throw new Error("Missing SUPABASE_URL");
    if (!SERVICE_ROLE_KEY) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

    // Init supabase client
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

    // Parse & validate request
    const body = await readJson<WelcomeEmailRequest>(req, log);
    log("request.parsed", {
      userId: body?.userId,
      userEmail: maskEmail(body?.userEmail),
      userName: body?.userName,
    });

    if (!body?.userId || !body?.userEmail || !body?.userName) {
      throw new Error("Missing required fields: userId, userEmail, userName");
    }

    // Check idempotency flag
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("welcome_email_sent_at")
      .eq("id", body.userId)
      .single();

    if (userError) {
      log("db.user.fetch_error", { error: userError.message }, "error");
      throw new Error(`Failed to fetch user: ${userError.message}`);
    }

    if (user?.welcome_email_sent_at) {
      log("idempotent.skip", { sentAt: user.welcome_email_sent_at });
      return new Response(JSON.stringify({ success: true, alreadySent: true, correlationId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json", "x-correlation-id": correlationId },
        status: 200,
      });
    }

    // Compose email (keep minimal if debugging HTML issues)
    const emailHtml = generateWelcomeEmailTemplate({
      userName: body.userName,
      userEmail: body.userEmail,
    });

    const emailPayload = {
      to: body.userEmail,
      subject: "Welcome to The Third Place - Your Community Awaits!",
      html: emailHtml,
      // add tags that will show up in Resend Activity (forwarded by downstream)
      tags: ["welcome", "onboarding", `cid:${correlationId}`],
    };

    log("send-email.call.begin", {
      url: `${SUPABASE_URL}/functions/v1/send-email`,
      payloadPreview: {
        to: maskEmail(emailPayload.to),
        subject: emailPayload.subject,
        tags: emailPayload.tags,
      },
    });

    const emailRes = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        "x-correlation-id": correlationId,
        // optional: tell downstream to emit verbose logs
        "x-debug": "true",
      },
      body: JSON.stringify(emailPayload),
    });

    const emailRaw = await emailRes.text();
    let emailJson: any = null;
    try { emailJson = JSON.parse(emailRaw); } catch { /* keep raw */ }

    log("send-email.call.end", {
      status: emailRes.status,
      ok: emailRes.ok,
      headers: Object.fromEntries(emailRes.headers),
      bodyPreview: emailRaw.slice(0, 1000),
    }, emailRes.ok ? "log" : "error");

    if (!emailRes.ok || !emailJson?.success) {
      // surface exact downstream error
      const reason = emailJson?.error ?? emailRaw || `HTTP ${emailRes.status}`;
      throw new Error(`Failed to send welcome email: ${reason}`);
    }

    const messageId = emailJson.messageId;
    log("send-email.success", { messageId });

    // Mark as sent (best-effort)
    const { error: updateError } = await supabase
      .from("users")
      .update({ welcome_email_sent_at: nowISO() })
      .eq("id", body.userId);

    if (updateError) {
      log("db.user.update_error", { error: updateError.message }, "warn");
      // non-fatal
    } else {
      log("db.user.update_ok", { userId: body.userId });
    }

    // Fire webhook (best-effort)
    try {
      const webhookRes = await fetch(`${SUPABASE_URL}/functions/v1/webhook-dispatcher`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
          "x-correlation-id": correlationId,
        },
        body: JSON.stringify({
          event_type: "user.welcome_email_sent",
          data: {
            user_id: body.userId,
            email: body.userEmail,
            message_id: messageId,
            sent_at: nowISO(),
            correlation_id: correlationId,
          },
        }),
      });
      const whTxt = await webhookRes.text();
      log("webhook.dispatch.done", {
        status: webhookRes.status,
        ok: webhookRes.ok,
        bodyPreview: whTxt.slice(0, 500),
      }, webhookRes.ok ? "log" : "warn");
    } catch (webhookError) {
      log("webhook.dispatch.error", { error: String(webhookError) }, "warn");
    }

    const out: WelcomeEmailResponse = { success: true, messageId };
    return new Response(JSON.stringify({ ...out, correlationId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json", "x-correlation-id": correlationId },
      status: 200,
    });

  } catch (err: any) {
    // include stack if available
    const message = String(err?.message ?? err);
    const stack = String(err?.stack ?? "");
    log("error", { message, stack }, "error");

    const errorResponse: WelcomeEmailResponse = { success: false, error: message };
    return new Response(JSON.stringify({ ...errorResponse, correlationId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json", "x-correlation-id": correlationId },
      status: 500,
    });
  }
});
