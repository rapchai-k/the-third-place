-- Add SEO override columns to communities and discussions tables
-- These columns allow custom SEO metadata that differs from the entity's display content
-- All columns are nullable - when null, the application falls back to derived values

-- ============================================================================
-- COMMUNITIES SEO COLUMNS
-- ============================================================================

ALTER TABLE public.communities
ADD COLUMN IF NOT EXISTS seo_title TEXT,
ADD COLUMN IF NOT EXISTS seo_description TEXT,
ADD COLUMN IF NOT EXISTS seo_image_url TEXT,
ADD COLUMN IF NOT EXISTS seo_keywords TEXT[];

-- Add comments for documentation
COMMENT ON COLUMN public.communities.seo_title IS 'Custom SEO title. Falls back to name if null.';
COMMENT ON COLUMN public.communities.seo_description IS 'Custom meta description. Falls back to description if null.';
COMMENT ON COLUMN public.communities.seo_image_url IS 'Custom OG/social image URL (recommended 1200x630). Falls back to image_url if null.';
COMMENT ON COLUMN public.communities.seo_keywords IS 'Custom SEO keywords array. Falls back to derived keywords from name and city if null.';

-- ============================================================================
-- DISCUSSIONS SEO COLUMNS
-- ============================================================================

ALTER TABLE public.discussions
ADD COLUMN IF NOT EXISTS seo_title TEXT,
ADD COLUMN IF NOT EXISTS seo_description TEXT,
ADD COLUMN IF NOT EXISTS seo_image_url TEXT,
ADD COLUMN IF NOT EXISTS seo_keywords TEXT[];

-- Add comments for documentation
COMMENT ON COLUMN public.discussions.seo_title IS 'Custom SEO title. Falls back to title if null.';
COMMENT ON COLUMN public.discussions.seo_description IS 'Custom meta description. Falls back to prompt if null.';
COMMENT ON COLUMN public.discussions.seo_image_url IS 'Custom OG/social image URL (recommended 1200x630). Falls back to community image if null.';
COMMENT ON COLUMN public.discussions.seo_keywords IS 'Custom SEO keywords array. Falls back to derived keywords from title and community if null.';

