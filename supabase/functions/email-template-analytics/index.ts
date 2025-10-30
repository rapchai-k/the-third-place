import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, getSecureHeaders } from "../shared/security-headers.ts";

interface AnalyticsQuery {
  templateId?: string;
  templateName?: string;
  eventType?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
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

    if (req.method === 'GET') {
      // Get analytics overview
      const url = new URL(req.url);
      const templateId = url.searchParams.get('templateId');
      const templateName = url.searchParams.get('templateName');
      const eventType = url.searchParams.get('eventType');
      const startDate = url.searchParams.get('startDate');
      const endDate = url.searchParams.get('endDate');
      const limit = parseInt(url.searchParams.get('limit') || '100');

      // Build base query
      let query = supabase
        .from('email_logs')
        .select(`
          id,
          recipient,
          subject,
          status,
          template_id,
          template_name,
          event_type,
          user_id,
          variables_used,
          created_at,
          sent_at
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      // Add filters
      if (templateId) {
        query = query.eq('template_id', templateId);
      }
      if (templateName) {
        query = query.eq('template_name', templateName);
      }
      if (eventType) {
        query = query.eq('event_type', eventType);
      }
      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data: logs, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch email logs: ${error.message}`);
      }

      // Calculate analytics
      const analytics = {
        total_emails: logs?.length || 0,
        successful_sends: logs?.filter(log => log.status === 'sent').length || 0,
        failed_sends: logs?.filter(log => log.status === 'failed').length || 0,
        pending_sends: logs?.filter(log => log.status === 'pending').length || 0,
        unique_recipients: new Set(logs?.map(log => log.recipient) || []).size,
        templates_used: new Set(logs?.map(log => log.template_name || log.template_id) || []).size,
        event_types: logs?.reduce((acc: Record<string, number>, log) => {
          if (log.event_type) {
            acc[log.event_type] = (acc[log.event_type] || 0) + 1;
          }
          return acc;
        }, {}) || {},
        daily_volume: logs?.reduce((acc: Record<string, number>, log) => {
          if (log.sent_at) {
            const date = new Date(log.sent_at).toISOString().split('T')[0];
            acc[date] = (acc[date] || 0) + 1;
          }
          return acc;
        }, {}) || {}
      };

      return new Response(JSON.stringify({
        success: true,
        analytics,
        logs: logs || [],
        total_count: logs?.length || 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    if (req.method === 'POST') {
      // Get detailed analytics for specific criteria
      const body: AnalyticsQuery = await req.json();

      // Get template performance metrics
      let templateQuery = supabase
        .from('email_logs')
        .select('template_id, template_name, status, created_at')
        .not('template_id', 'is', null);

      if (body.startDate) {
        templateQuery = templateQuery.gte('created_at', body.startDate);
      }
      if (body.endDate) {
        templateQuery = templateQuery.lte('created_at', body.endDate);
      }

      const { data: templateLogs, error: templateError } = await templateQuery;

      if (templateError) {
        throw new Error(`Failed to fetch template logs: ${templateError.message}`);
      }

      // Group by template and calculate metrics
      const templateMetrics = templateLogs?.reduce((acc: Record<string, any>, log) => {
        const key = log.template_id || log.template_name;
        if (!acc[key]) {
          acc[key] = {
            template_id: log.template_id,
            template_name: log.template_name,
            total_sends: 0,
            successful_sends: 0,
            failed_sends: 0,
            success_rate: 0,
            last_used: null
          };
        }
        
        acc[key].total_sends += 1;
        if (log.status === 'sent') acc[key].successful_sends += 1;
        if (log.status === 'failed') acc[key].failed_sends += 1;
        
        if (!acc[key].last_used || new Date(log.created_at) > new Date(acc[key].last_used)) {
          acc[key].last_used = log.created_at;
        }
        
        return acc;
      }, {}) || {};

      // Calculate success rates
      Object.values(templateMetrics).forEach((metric: any) => {
        metric.success_rate = metric.total_sends > 0 
          ? (metric.successful_sends / metric.total_sends * 100).toFixed(2)
          : 0;
      });

      return new Response(JSON.stringify({
        success: true,
        template_metrics: Object.values(templateMetrics),
        summary: {
          total_templates: Object.keys(templateMetrics).length,
          total_sends: Object.values(templateMetrics).reduce((sum: number, m: any) => sum + m.total_sends, 0),
          overall_success_rate: templateLogs?.length ? 
            (templateLogs.filter(log => log.status === 'sent').length / templateLogs.length * 100).toFixed(2) : 0
        }
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