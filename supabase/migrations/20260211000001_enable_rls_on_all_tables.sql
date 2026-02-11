-- Migration: Enable RLS on all tables that are missing it
-- Purpose: Ensure all tables have Row Level Security enabled for data protection
-- Date: 2026-02-11

-- Enable RLS on tables that don't have it yet
ALTER TABLE IF EXISTS public.api_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create default policies for tables without existing policies
-- These are restrictive by default (deny all) - add specific policies as needed

-- api_logs: Admins only
DROP POLICY IF EXISTS "Admins can manage api_logs" ON public.api_logs;
CREATE POLICY "Admins can manage api_logs"
ON public.api_logs
FOR ALL
USING (public.get_user_role() = 'admin')
WITH CHECK (public.get_user_role() = 'admin');

-- applications: Admins only
DROP POLICY IF EXISTS "Admins can manage applications" ON public.applications;
CREATE POLICY "Admins can manage applications"
ON public.applications
FOR ALL
USING (public.get_user_role() = 'admin')
WITH CHECK (public.get_user_role() = 'admin');

-- audit_logs: Admins only
DROP POLICY IF EXISTS "Admins can manage audit_logs" ON public.audit_logs;
CREATE POLICY "Admins can manage audit_logs"
ON public.audit_logs
FOR ALL
USING (public.get_user_role() = 'admin')
WITH CHECK (public.get_user_role() = 'admin');

-- comments: Public read, authenticated write
DROP POLICY IF EXISTS "Anyone can view comments" ON public.comments;
CREATE POLICY "Anyone can view comments"
ON public.comments
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.comments;
CREATE POLICY "Authenticated users can create comments"
ON public.comments
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update own comments or admins can update any" ON public.comments;
CREATE POLICY "Users can update own comments or admins can update any"
ON public.comments
FOR UPDATE
USING (auth.uid() IS NOT NULL AND (user_id = auth.uid() OR public.get_user_role() = 'admin'))
WITH CHECK (auth.uid() IS NOT NULL AND (user_id = auth.uid() OR public.get_user_role() = 'admin'));

DROP POLICY IF EXISTS "Users can delete own comments or admins can delete any" ON public.comments;
CREATE POLICY "Users can delete own comments or admins can delete any"
ON public.comments
FOR DELETE
USING (auth.uid() IS NOT NULL AND (user_id = auth.uid() OR public.get_user_role() = 'admin'));

-- documents: Admins only
DROP POLICY IF EXISTS "Admins can manage documents" ON public.documents;
CREATE POLICY "Admins can manage documents"
ON public.documents
FOR ALL
USING (public.get_user_role() = 'admin')
WITH CHECK (public.get_user_role() = 'admin');

-- notifications: Users can view their own
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (user_id = auth.uid() OR public.get_user_role() = 'admin');

DROP POLICY IF EXISTS "Service can create notifications" ON public.notifications;
CREATE POLICY "Service can create notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- settings: Admins only
DROP POLICY IF EXISTS "Admins can manage settings" ON public.settings;
CREATE POLICY "Admins can manage settings"
ON public.settings
FOR ALL
USING (public.get_user_role() = 'admin')
WITH CHECK (public.get_user_role() = 'admin');

-- user_profiles: Users can view own, admins can view all
DROP POLICY IF EXISTS "Users can view own profile and admins can view all" ON public.user_profiles;
CREATE POLICY "Users can view own profile and admins can view all"
ON public.user_profiles
FOR SELECT
USING (email = auth.jwt() ->> 'email' OR public.get_user_role() = 'admin');

DROP POLICY IF EXISTS "Users can update own profile and admins can update all" ON public.user_profiles;
CREATE POLICY "Users can update own profile and admins can update all"
ON public.user_profiles
FOR UPDATE
USING (email = auth.jwt() ->> 'email' OR public.get_user_role() = 'admin')
WITH CHECK (email = auth.jwt() ->> 'email' OR public.get_user_role() = 'admin');

