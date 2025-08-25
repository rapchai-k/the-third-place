import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  tags?: (string | { name: string; value: string })[];
}

interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Logging utility
function logStep(step: string, data?: any) {
  console.log(`[send-email] ${step}`, data ? JSON.stringify(data, null, 2) : '');
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    logStep("Email service function started");

    // Validate environment variables
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY environment variable is not set");
    }

    // Initialize Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Parse request body
    const emailRequest: EmailRequest = await req.json();
    logStep("Email request received", { 
      to: emailRequest.to, 
      subject: emailRequest.subject,
      hasHtml: !!emailRequest.html 
    });

    // Validate required fields
    if (!emailRequest.to || !emailRequest.subject || !emailRequest.html) {
      throw new Error("Missing required fields: to, subject, html");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailRequest.to)) {
      throw new Error("Invalid email address format");
    }

    // Normalize tags into Resend's expected shape [{ name, value }] with unique, sanitized names
    const sanitize = (s: string) => String(s).replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 256);
    const seen = new Set<string>();
    const normalizedTags = (emailRequest.tags ?? [])
      .map((t: any, idx: number) => {
        const raw = typeof t === "string"
          ? { name: sanitize(t), value: "true" }
          : { name: sanitize(t?.name), value: sanitize(t?.value) };
        let base = raw.name || `tag_${idx + 1}`;
        let name = base;
        let n = 2;
        while (seen.has(name)) name = `${base}_${n++}`;
        seen.add(name);
        return { name, value: raw.value || "true" };
      });

    // Prepare email payload for Resend API
    const emailPayload: Record<string, unknown> = {
      from: emailRequest.from || "The Third Place <noreply@thethirdplace.community>",
      to: [emailRequest.to],
      subject: emailRequest.subject,
      html: emailRequest.html,
      ...(emailRequest.replyTo ? { reply_to: emailRequest.replyTo } : {}),
      ...(normalizedTags.length ? { tags: normalizedTags } : {}),
    };

    logStep("Sending email via Resend API");

    // Send email via Resend API
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailPayload),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      logStep("Resend API error", { 
        status: resendResponse.status, 
        error: resendData 
      });
      throw new Error(`Resend API error: ${resendData.message || 'Unknown error'}`);
    }

    logStep("Email sent successfully", { messageId: resendData.id });

    // Log email delivery to database for tracking
    try {
      const { error: logError } = await supabaseClient
        .from("email_logs")
        .insert({
          recipient: emailRequest.to,
          subject: emailRequest.subject,
          message_id: resendData.id,
          status: "sent",
          provider: "resend",
          sent_at: new Date().toISOString()
        });

      if (logError) {
        logStep("Failed to log email delivery", { error: logError.message });
        // Don't fail the request if logging fails
      }
    } catch (logErr) {
      logStep("Email logging error", { error: logErr });
      // Continue execution even if logging fails
    }

    const response: EmailResponse = {
      success: true,
      messageId: resendData.id
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    logStep("Email service error", { error: error.message });

    const errorResponse: EmailResponse = {
      success: false,
      error: error.message
    };

    return new Response(JSON.stringify(errorResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
