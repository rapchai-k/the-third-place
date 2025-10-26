import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, getSecureHeaders } from "../shared/security-headers.ts";

interface CreateTemplateRequest {
  name: string;
  display_name: string;
  event_type: string;
  subject: string;
  html_content: string;
  variables: string[];
  is_active?: boolean;
}

interface UpdateTemplateRequest extends Partial<CreateTemplateRequest> {
  id: string;
}

// Validate template variables in HTML content
function validateTemplateVariables(html_content: string, subject: string, variables: string[]): string[] {
  const errors: string[] = [];
  const variableRegex = /\{\{(\w+)\}\}/g;
  
  // Find all variables used in content
  const usedVariables = new Set<string>();
  let match;
  
  while ((match = variableRegex.exec(html_content)) !== null) {
    usedVariables.add(match[1]);
  }
  
  while ((match = variableRegex.exec(subject)) !== null) {
    usedVariables.add(match[1]);
  }
  
  // Check if all used variables are declared
  for (const usedVar of usedVariables) {
    if (!variables.includes(usedVar)) {
      errors.push(`Variable '${usedVar}' is used but not declared in variables array`);
    }
  }
  
  return errors;
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

    if (req.method === 'POST') {
      // Create new template
      const body: CreateTemplateRequest = await req.json();
      
      // Validate required fields
      if (!body.name || !body.display_name || !body.event_type || !body.subject || !body.html_content) {
        throw new Error("Missing required fields: name, display_name, event_type, subject, html_content");
      }

      // Validate template variables
      const validationErrors = validateTemplateVariables(body.html_content, body.subject, body.variables || []);
      if (validationErrors.length > 0) {
        return new Response(JSON.stringify({
          success: false,
          error: "Template validation failed",
          validation_errors: validationErrors
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }

      const { data: template, error } = await supabase
        .from('email_templates')
        .insert({
          name: body.name,
          display_name: body.display_name,
          event_type: body.event_type,
          subject: body.subject,
          html_content: body.html_content,
          variables: JSON.stringify(body.variables || []),
          is_active: body.is_active !== undefined ? body.is_active : true
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          throw new Error(`Template with name '${body.name}' already exists`);
        }
        throw new Error(`Failed to create template: ${error.message}`);
      }

      return new Response(JSON.stringify({ 
        success: true, 
        template 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201,
      });
    }

    if (req.method === 'PUT') {
      // Update existing template
      const body: UpdateTemplateRequest = await req.json();
      
      if (!body.id) {
        throw new Error("Template ID is required for updates");
      }

      // Validate template variables if content is being updated
      if ((body.html_content || body.subject) && body.variables) {
        const validationErrors = validateTemplateVariables(
          body.html_content || "", 
          body.subject || "", 
          body.variables
        );
        if (validationErrors.length > 0) {
          return new Response(JSON.stringify({
            success: false,
            error: "Template validation failed",
            validation_errors: validationErrors
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          });
        }
      }

      // Prepare update data
      const updateData: any = {};
      if (body.display_name) updateData.display_name = body.display_name;
      if (body.event_type) updateData.event_type = body.event_type;
      if (body.subject) updateData.subject = body.subject;
      if (body.html_content) updateData.html_content = body.html_content;
      if (body.variables) updateData.variables = JSON.stringify(body.variables);
      if (body.is_active !== undefined) updateData.is_active = body.is_active;

      const { data: template, error } = await supabase
        .from('email_templates')
        .update(updateData)
        .eq('id', body.id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error("Template not found");
        }
        throw new Error(`Failed to update template: ${error.message}`);
      }

      return new Response(JSON.stringify({ 
        success: true, 
        template 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    if (req.method === 'DELETE') {
      // Delete template
      const url = new URL(req.url);
      const templateId = url.searchParams.get('id');
      
      if (!templateId) {
        throw new Error("Template ID is required");
      }

      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', templateId);

      if (error) {
        throw new Error(`Failed to delete template: ${error.message}`);
      }

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Template deleted successfully' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Method not allowed' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405,
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