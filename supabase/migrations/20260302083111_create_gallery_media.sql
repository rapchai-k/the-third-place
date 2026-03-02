-- Create gallery_media table
CREATE TABLE IF NOT EXISTS public.gallery_media (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    mimetype TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Constraint: Must belong to exactly one of event or community
    CONSTRAINT gallery_media_parent_check CHECK (
        num_nonnulls(event_id, community_id) = 1
    )
);

-- Add index for efficient querying
CREATE INDEX IF NOT EXISTS idx_gallery_media_event_id ON public.gallery_media(event_id);
CREATE INDEX IF NOT EXISTS idx_gallery_media_community_id ON public.gallery_media(community_id);
CREATE INDEX IF NOT EXISTS idx_gallery_media_sort_order ON public.gallery_media(sort_order);

-- Enable RLS
ALTER TABLE public.gallery_media ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Everyone can read gallery media
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'gallery_media' AND policyname = 'Public Read Access'
    ) THEN
        CREATE POLICY "Public Read Access"
            ON public.gallery_media
            FOR SELECT
            USING (true);
    END IF;
END
$$;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_gallery_media_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_gallery_media_updated_at') THEN
        CREATE TRIGGER update_gallery_media_updated_at
            BEFORE UPDATE ON public.gallery_media
            FOR EACH ROW
            EXECUTE FUNCTION update_gallery_media_updated_at_column();
    END IF;
END
$$;

-- Create galleries storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('galleries', 'galleries', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for storage bucket
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Public Read Access on Galleries' AND schemaname = 'storage'
    ) THEN
        CREATE POLICY "Public Read Access on Galleries"
            ON storage.objects FOR SELECT
            USING (bucket_id = 'galleries');
    END IF;
END
$$;
