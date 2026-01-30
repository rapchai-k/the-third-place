-- Run this SQL in Supabase Dashboard SQL Editor to repair migration history and add SEO columns
-- URL: https://supabase.com/dashboard/project/ggochdssgkfnvcrrmtlp/sql/new

-- Step 1: Insert migration history records for already-applied migrations
INSERT INTO supabase_migrations.schema_migrations (version)
VALUES 
  ('20250805130146'),
  ('20250806091345'),
  ('20250806091954'),
  ('20250806094303'),
  ('20250807125309'),
  ('20250807145041'),
  ('20250807145114'),
  ('20250808133640'),
  ('20250823000001'),
  ('20250823000002'),
  ('20250823125000'),
  ('20250823131000'),
  ('20250825233753'),
  ('20250908000001'),
  ('20250910000001'),
  ('20260113201018'),
  ('20260115201244')
ON CONFLICT (version) DO NOTHING;

-- Step 2: Add SEO columns to events table
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS seo_title TEXT,
ADD COLUMN IF NOT EXISTS seo_description TEXT,
ADD COLUMN IF NOT EXISTS seo_image_url TEXT,
ADD COLUMN IF NOT EXISTS seo_keywords TEXT[];

COMMENT ON COLUMN public.events.seo_title IS 'Custom SEO title. Falls back to title if null.';
COMMENT ON COLUMN public.events.seo_description IS 'Custom meta description. Falls back to description if null.';
COMMENT ON COLUMN public.events.seo_image_url IS 'Custom OG/social image URL (recommended 1200x630). Falls back to image_url if null.';
COMMENT ON COLUMN public.events.seo_keywords IS 'Custom SEO keywords array. Falls back to derived keywords from title, community, and tags if null.';

-- Step 3: Mark the SEO migration as applied
INSERT INTO supabase_migrations.schema_migrations (version)
VALUES ('20260117000001')
ON CONFLICT (version) DO NOTHING;

-- Step 4: Grant permissions (from 20260117120000)
GRANT SELECT ON public.communities TO anon, authenticated;
GRANT SELECT ON public.community_members TO anon, authenticated;
GRANT SELECT ON public.events TO anon, authenticated;
GRANT SELECT ON public.event_tags TO anon, authenticated;
GRANT SELECT ON public.event_registrations TO anon, authenticated;
GRANT SELECT ON public.tags TO anon, authenticated;
GRANT SELECT ON public.discussions TO anon, authenticated;
GRANT SELECT ON public.discussion_comments TO anon, authenticated;
GRANT SELECT ON public.users TO anon, authenticated;
GRANT SELECT ON public.user_badges TO anon, authenticated;
GRANT SELECT ON public.user_activity_log TO anon, authenticated;
GRANT SELECT ON public.notification_preferences TO anon, authenticated;
GRANT SELECT ON public.payment_sessions TO anon, authenticated;
GRANT SELECT ON public.payment_logs TO anon, authenticated;
GRANT SELECT ON public.referrals TO anon, authenticated;
GRANT SELECT ON public.flags TO anon, authenticated;
GRANT SELECT ON public.email_logs TO anon, authenticated;
GRANT SELECT ON public.email_templates TO anon, authenticated;
GRANT SELECT ON public.webhook_configurations TO anon, authenticated;
GRANT SELECT ON public.webhook_deliveries TO anon, authenticated;

GRANT INSERT ON public.community_members TO authenticated;
GRANT INSERT ON public.event_registrations TO authenticated;
GRANT INSERT ON public.discussion_comments TO authenticated;
GRANT INSERT ON public.flags TO authenticated;
GRANT INSERT ON public.payment_sessions TO authenticated;

GRANT UPDATE ON public.users TO authenticated;
GRANT UPDATE ON public.notification_preferences TO authenticated;
GRANT UPDATE ON public.discussion_comments TO authenticated;

GRANT DELETE ON public.community_members TO authenticated;
GRANT DELETE ON public.event_registrations TO authenticated;
GRANT DELETE ON public.discussion_comments TO authenticated;

GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Step 5: Mark the permissions migration as applied
INSERT INTO supabase_migrations.schema_migrations (version)
VALUES ('20260117120000')
ON CONFLICT (version) DO NOTHING;

-- Verify: Check migration history
SELECT version FROM supabase_migrations.schema_migrations ORDER BY version DESC LIMIT 5;

