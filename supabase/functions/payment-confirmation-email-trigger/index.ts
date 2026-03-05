import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { TemplateProcessor, TemplateRenderContext } from "../shared/email-templates.ts";
import { corsHeaders } from "../shared/security-headers.ts";

interface PaymentConfirmationEmailRequest {
  paymentSessionId: string;
  userId: string;
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
      mod: "payment-confirmation-email-trigger",
      step,
      correlationId,
      data: toPlain(data),
    };
    console[level](JSON.stringify(line));
  };
}

async function readJson<T>(req: Request, log: ReturnType<typeof mkLogger>): Promise<T> {
  try {
    const txt = await req.text();
    log("request.raw", { bodyPreview: txt.slice(0, 500) });
    return txt ? JSON.parse(txt) as T : ({} as T);
  } catch (e) {
    log("request.json.parse_error", { error: String(e) }, "error");
    throw new Error("Invalid JSON body");
  }
}

// ---- function ---------------------------------------------------------------

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const correlationId = crypto.randomUUID();
  const log = mkLogger(correlationId);

  try {
    log("start", {
      method: req.method,
      url: req.url,
      region: Deno.env.get("FLY_REGION") ?? Deno.env.get("SUPABASE_REGION") ?? "unknown",
    });

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!SUPABASE_URL) throw new Error("Missing SUPABASE_URL");
    if (!SERVICE_ROLE_KEY) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

    const body = await readJson<PaymentConfirmationEmailRequest>(req, log);
    log("request.parsed", { paymentSessionId: body?.paymentSessionId, userId: body?.userId });

    if (!body?.paymentSessionId || !body?.userId) {
      throw new Error("Missing required fields: paymentSessionId, userId");
    }

    // Fetch payment session with idempotency check
    const { data: paymentSession, error: sessionError } = await supabase
      .from("payment_sessions")
      .select("id, user_id, event_id, amount, currency, payment_status, razorpay_payment_id, payment_confirmation_email_sent_at")
      .eq("id", body.paymentSessionId)
      .eq("user_id", body.userId)
      .single();

    if (sessionError || !paymentSession) {
      log("db.session.fetch_error", { error: sessionError?.message }, "error");
      throw new Error(`Payment session not found: ${sessionError?.message || "not found"}`);
    }

    if (paymentSession.payment_status !== "paid") {
      log("skip.not_paid", { status: paymentSession.payment_status });
      return new Response(JSON.stringify({ success: false, error: "Payment not completed", correlationId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Idempotency: already sent
    if (paymentSession.payment_confirmation_email_sent_at) {
      log("idempotent.skip", { sentAt: paymentSession.payment_confirmation_email_sent_at });
      return new Response(JSON.stringify({ success: true, alreadySent: true, correlationId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Fetch user email from auth
    const { data: authData, error: authError } = await supabase.auth.admin.getUserById(body.userId);
    if (authError || !authData?.user?.email) {
      log("db.auth.fetch_error", { error: authError?.message }, "error");
      throw new Error(`Failed to fetch user email: ${authError?.message || "no email"}`);
    }
    const userEmail = authData.user.email;

    // Fetch user profile for name
    const { data: userProfile } = await supabase
      .from("users")
      .select("name")
      .eq("id", body.userId)
      .single();
    const userName = userProfile?.name || authData.user.user_metadata?.name || "User";

    // Fetch event details
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("title, date_time, venue, short_code")
      .eq("id", paymentSession.event_id)
      .single();

    if (eventError || !event) {
      log("db.event.fetch_error", { error: eventError?.message }, "error");
      throw new Error(`Failed to fetch event: ${eventError?.message || "not found"}`);
    }

    log("data.fetched", {
      userEmail: maskEmail(userEmail),
      userName,
      eventTitle: event.title,
      amount: paymentSession.amount,
    });

    const eventUrl = event.short_code
      ? `https://mythirdplace.rapchai.com/e/${event.short_code}`
      : "https://mythirdplace.rapchai.com/events";

    // Render template
    const templateProcessor = new TemplateProcessor(supabase, correlationId);
    const templateContext: TemplateRenderContext = {
      templateName: 'payment_confirmation',
      eventType: 'payment_completed',
      variables: {
        userName,
        userEmail,
        eventTitle: event.title,
        eventDateTime: event.date_time,
        eventVenue: event.venue,
        amount: paymentSession.amount,
        currency: paymentSession.currency,
        paymentId: paymentSession.razorpay_payment_id,
        paymentSessionId: paymentSession.id,
        eventUrl,
      },
      userId: body.userId,
      correlationId,
    };

    log("template.render.begin", { templateName: templateContext.templateName });
    const templateResult = await templateProcessor.processTemplate(templateContext);
    log("template.render.success", {
      subjectPreview: templateResult.subject.slice(0, 50),
      hasHtml: !!templateResult.html,
    });

    // Build email tags
    const emailTags = [
      "payment_confirmation",
      "transactional",
      `cid:${correlationId}`,
      { name: "template_name", value: templateContext.templateName },
      { name: "event_type", value: templateContext.eventType },
      { name: "user_id", value: body.userId },
      { name: "payment_session_id", value: paymentSession.id },
    ];
    if (templateResult.templateId) {
      emailTags.push({ name: "template_id", value: templateResult.templateId });
    }

    const emailPayload = {
      from: "onboarding@rapchai.com",
      to: userEmail,
      subject: templateResult.subject,
      html: templateResult.html,
      tags: emailTags,
    };

    log("send-email.call.begin", {
      url: `${SUPABASE_URL}/functions/v1/send-email`,
      payloadPreview: {
        to: maskEmail(emailPayload.to),
        subject: emailPayload.subject,
      },
    });

    const emailRes = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        "x-correlation-id": correlationId,
      },
      body: JSON.stringify(emailPayload),
    });

    const emailRaw = await emailRes.text();
    let emailJson: Record<string, unknown> | null = null;
    try { emailJson = JSON.parse(emailRaw); } catch { /* keep raw */ }

    log("send-email.call.end", {
      status: emailRes.status,
      ok: emailRes.ok,
      bodyPreview: emailRaw.slice(0, 1000),
    }, emailRes.ok ? "log" : "error");

    if (!emailRes.ok || !emailJson?.success) {
      const reason = emailJson?.error ?? (emailRaw || `HTTP ${emailRes.status}`);
      throw new Error(`Failed to send payment confirmation email: ${reason}`);
    }

    const messageId = emailJson.messageId;
    log("send-email.success", { messageId });

    // Mark as sent (idempotency flag)
    const { error: updateError } = await supabase
      .from("payment_sessions")
      .update({ payment_confirmation_email_sent_at: nowISO() })
      .eq("id", paymentSession.id);

    if (updateError) {
      log("db.session.update_error", { error: updateError.message }, "warn");
    } else {
      log("db.session.update_ok", { paymentSessionId: paymentSession.id });
    }

    return new Response(JSON.stringify({ success: true, messageId, correlationId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json", "x-correlation-id": correlationId },
      status: 200,
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? (err.stack ?? "") : "";
    log("error", { message, stack }, "error");

    return new Response(JSON.stringify({ success: false, error: message, correlationId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json", "x-correlation-id": correlationId },
      status: 500,
    });
  }
});

