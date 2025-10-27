import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { TemplateProcessor, TemplateRenderContext } from "../shared/email-templates.ts";
import { corsHeaders, getSecureHeaders } from "../shared/security-headers.ts";

interface TestTemplateRequest {
  templateId?: string;
  templateName?: string;
  eventType?: string;
  testEmail: string;
  sampleVariables: Record<string, any>;
  sendEmail?: boolean; // If true, actually send the email, otherwise just render
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Function started - logging removed for security

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Method not allowed' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405,
      });
    }

    const body: TestTemplateRequest = await req.json();
    
    if (!body.testEmail) {
      throw new Error("Test email address is required");
    }

    if (!body.templateId && !(body.templateName && body.eventType)) {
      throw new Error("Either templateId or both templateName and eventType must be provided");
    }

    // Create template processor
    const correlationId = crypto.randomUUID();
    const templateProcessor = new TemplateProcessor(supabase, correlationId);

    let template;

    if (body.templateId) {
      // Get template by ID
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('id', body.templateId)
        .single();

      if (error) {
        throw new Error(`Template not found: ${error.message}`);
      }
      template = data;
    } else {
      // Get template by name and event type
      template = await templateProcessor.getTemplate(body.templateName!, body.eventType!);
      if (!template) {
        throw new Error(`Template not found: ${body.templateName}/${body.eventType}`);
      }
    }

    // Prepare sample variables with defaults
    const sampleVariables = {
      userName: "John Doe",
      userEmail: body.testEmail,
      dashboardUrl: "https://thethirdplace.community/dashboard",
      eventName: "Sample Community Event",
      eventDate: "March 15, 2025 at 7:00 PM",
      eventLocation: "Community Center, Main Street",
      eventUrl: "https://thethirdplace.community/events/sample-event",
      ...body.sampleVariables
    };

    // Render the template
    const templateContext: TemplateRenderContext = {
      templateName: template.name,
      eventType: template.event_type,
      variables: sampleVariables,
      correlationId
    };

    const rendered = await templateProcessor.processTemplate(templateContext);

    // Template rendered successfully - logging removed for security

    // If sendEmail is true, actually send the test email
    if (body.sendEmail) {
      const emailPayload = {
        from: "test@thethirdplace.community",
        to: body.testEmail,
        subject: `[TEST] ${rendered.subject}`,
        html: rendered.html,
        tags: [
          "test-email",
          `template:${template.name}`,
          `cid:${correlationId}`,
          { name: 'template_id', value: template.id },
          { name: 'template_name', value: template.name },
          { name: 'event_type', value: template.event_type },
          { name: 'is_test', value: 'true' }
        ]
      };

      const emailRes = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-email`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          "Content-Type": "application/json",
          "x-correlation-id": correlationId,
        },
        body: JSON.stringify(emailPayload),
      });

      const emailResult = await emailRes.json();

      if (!emailRes.ok || !emailResult.success) {
        throw new Error(`Failed to send test email: ${emailResult.error || 'Unknown error'}`);
      }

      return new Response(JSON.stringify({ 
        success: true,
        message: "Test email sent successfully",
        template: {
          id: template.id,
          name: template.name,
          display_name: template.display_name
        },
        rendered: {
          subject: rendered.subject,
          html_preview: rendered.html.slice(0, 500) + "..."
        },
        email_sent: true,
        message_id: emailResult.messageId
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Just return the rendered template without sending
    return new Response(JSON.stringify({ 
      success: true,
      template: {
        id: template.id,
        name: template.name,
        display_name: template.display_name
      },
      rendered: {
        subject: rendered.subject,
        html: rendered.html
      },
      variables_used: Object.keys(sampleVariables),
      email_sent: false
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    // Error - logging removed for security

    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});