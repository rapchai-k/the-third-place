import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GetTemplateRequest {
  templateName?: string;
  eventType?: string;
  templateId?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log("[get-email-template] Function started");

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    if (req.method === 'GET') {
      // Get all templates
      const { data: templates, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch templates: ${error.message}`);
      }

      return new Response(JSON.stringify({ 
        success: true, 
        templates: templates || [] 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    if (req.method === 'POST') {
      // Get specific template by criteria
      const body: GetTemplateRequest = await req.json();
      
      let query = supabase.from('email_templates').select('*');

      if (body.templateId) {
        query = query.eq('id', body.templateId);
      } else if (body.templateName && body.eventType) {
        query = query.eq('name', body.templateName).eq('event_type', body.eventType);
      } else {
        throw new Error("Either templateId or both templateName and eventType must be provided");
      }

      const { data: template, error } = await query.single();

      if (error) {
        if (error.code === 'PGRST116') {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Template not found' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 404,
          });
        }
        throw new Error(`Failed to fetch template: ${error.message}`);
      }

      return new Response(JSON.stringify({ 
        success: true, 
        template 
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
    console.error("[get-email-template] Error:", error);

    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});