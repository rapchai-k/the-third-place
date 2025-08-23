import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateWelcomeEmailTemplate } from "../shared/email-templates.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

// Logging utility
function logStep(step: string, data?: any) {
  console.log(`[welcome-email-trigger] ${step}`, data ? JSON.stringify(data, null, 2) : '');
}



serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    logStep("Welcome email trigger function started");

    // Initialize Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Parse request body
    const request: WelcomeEmailRequest = await req.json();
    logStep("Welcome email request received", { 
      userId: request.userId, 
      userEmail: request.userEmail,
      userName: request.userName 
    });

    // Validate required fields
    if (!request.userId || !request.userEmail || !request.userName) {
      throw new Error("Missing required fields: userId, userEmail, userName");
    }

    // Check if welcome email has already been sent
    const { data: user, error: userError } = await supabaseClient
      .from("users")
      .select("welcome_email_sent_at")
      .eq("id", request.userId)
      .single();

    if (userError) {
      logStep("Error fetching user", { error: userError.message });
      throw new Error(`Failed to fetch user: ${userError.message}`);
    }

    if (user.welcome_email_sent_at) {
      logStep("Welcome email already sent", { sentAt: user.welcome_email_sent_at });
      return new Response(JSON.stringify({
        success: true,
        alreadySent: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Generate welcome email HTML
    const emailHtml = generateWelcomeEmailTemplate({
      userName: request.userName,
      userEmail: request.userEmail
    });

    // Call the send-email function
    const emailPayload = {
      to: request.userEmail,
      subject: "Welcome to The Third Place - Your Community Awaits!",
      html: emailHtml,
      tags: ["welcome", "onboarding"]
    };

    logStep("Calling send-email function");

    const emailResponse = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-email`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailPayload),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok || !emailResult.success) {
      logStep("Failed to send welcome email", { error: emailResult.error });
      throw new Error(`Failed to send welcome email: ${emailResult.error}`);
    }

    logStep("Welcome email sent successfully", { messageId: emailResult.messageId });

    // Update user record to mark welcome email as sent
    const { error: updateError } = await supabaseClient
      .from("users")
      .update({ welcome_email_sent_at: new Date().toISOString() })
      .eq("id", request.userId);

    if (updateError) {
      logStep("Failed to update user welcome email status", { error: updateError.message });
      // Don't fail the request if the update fails, email was sent successfully
    }

    // Dispatch webhook event for email analytics
    try {
      await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/webhook-dispatcher`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event_type: "user.welcome_email_sent",
          data: {
            user_id: request.userId,
            email: request.userEmail,
            message_id: emailResult.messageId,
            sent_at: new Date().toISOString()
          }
        }),
      });
    } catch (webhookError) {
      logStep("Failed to dispatch webhook", { error: webhookError });
      // Don't fail the request if webhook fails
    }

    const response: WelcomeEmailResponse = {
      success: true,
      messageId: emailResult.messageId
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    logStep("Welcome email trigger error", { error: error.message });

    const errorResponse: WelcomeEmailResponse = {
      success: false,
      error: error.message
    };

    return new Response(JSON.stringify(errorResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
