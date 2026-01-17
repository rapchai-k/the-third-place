-- Grant necessary permissions to anon and authenticated roles
-- This fixes 401 "permission denied" errors when accessing data
--
-- Background: The migration 20260115201244_sync_remote_schema.sql revoked all permissions
-- from anon and authenticated roles. This migration grants back the necessary SELECT permissions.
--
-- Note: RLS policies will still control what data is actually visible.
-- These grants just allow the roles to attempt queries.

-- Core public tables (should be readable by anyone, controlled by RLS)
GRANT SELECT ON public.communities TO anon, authenticated;
GRANT SELECT ON public.community_members TO anon, authenticated;
GRANT SELECT ON public.events TO anon, authenticated;
GRANT SELECT ON public.event_tags TO anon, authenticated;
GRANT SELECT ON public.event_registrations TO anon, authenticated;
GRANT SELECT ON public.tags TO anon, authenticated;
GRANT SELECT ON public.discussions TO anon, authenticated;
GRANT SELECT ON public.discussion_comments TO anon, authenticated;

-- User-related tables (RLS will restrict to own data)
GRANT SELECT ON public.users TO anon, authenticated;
GRANT SELECT ON public.user_badges TO anon, authenticated;
GRANT SELECT ON public.user_activity_log TO anon, authenticated;
GRANT SELECT ON public.notification_preferences TO anon, authenticated;

-- Payment tables (RLS will restrict to own data)
GRANT SELECT ON public.payment_sessions TO anon, authenticated;
GRANT SELECT ON public.payment_logs TO anon, authenticated;

-- Other tables (RLS will control access)
GRANT SELECT ON public.referrals TO anon, authenticated;
GRANT SELECT ON public.flags TO anon, authenticated;
GRANT SELECT ON public.email_logs TO anon, authenticated;
GRANT SELECT ON public.email_templates TO anon, authenticated;
GRANT SELECT ON public.webhook_configurations TO anon, authenticated;
GRANT SELECT ON public.webhook_deliveries TO anon, authenticated;

-- Grant INSERT permissions where needed (RLS will control what can be inserted)
GRANT INSERT ON public.community_members TO authenticated;
GRANT INSERT ON public.event_registrations TO authenticated;
GRANT INSERT ON public.discussion_comments TO authenticated;
GRANT INSERT ON public.flags TO authenticated;
GRANT INSERT ON public.payment_sessions TO authenticated;

-- Grant UPDATE permissions where needed (RLS will control what can be updated)
GRANT UPDATE ON public.users TO authenticated;
GRANT UPDATE ON public.notification_preferences TO authenticated;
GRANT UPDATE ON public.discussion_comments TO authenticated;

-- Grant DELETE permissions where needed (RLS will control what can be deleted)
GRANT DELETE ON public.community_members TO authenticated;
GRANT DELETE ON public.event_registrations TO authenticated;
GRANT DELETE ON public.discussion_comments TO authenticated;

-- Grant USAGE on sequences (needed for INSERT operations)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

