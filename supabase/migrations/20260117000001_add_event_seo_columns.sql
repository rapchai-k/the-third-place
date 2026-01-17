-- Add SEO override columns to events table
-- These columns allow custom SEO metadata that differs from the event's display content
-- All columns are nullable - when null, the application falls back to derived values

ALTER TABLE public.events
ADD COLUMN seo_title TEXT,
ADD COLUMN seo_description TEXT,
ADD COLUMN seo_image_url TEXT,
ADD COLUMN seo_keywords TEXT[];

-- Add comments for documentation
COMMENT ON COLUMN public.events.seo_title IS 'Custom SEO title. Falls back to title if null.';
COMMENT ON COLUMN public.events.seo_description IS 'Custom meta description. Falls back to description if null.';
COMMENT ON COLUMN public.events.seo_image_url IS 'Custom OG/social image URL (recommended 1200x630). Falls back to image_url if null.';
COMMENT ON COLUMN public.events.seo_keywords IS 'Custom SEO keywords array. Falls back to derived keywords from title, community, and tags if null.';

