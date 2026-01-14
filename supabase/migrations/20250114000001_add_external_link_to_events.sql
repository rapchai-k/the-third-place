-- Add external_link column to events table
-- This allows event organizers to specify an external booking/registration link
-- that will be shown to confirmed registrants

ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS external_link TEXT;

-- Add a comment to document the column purpose
COMMENT ON COLUMN public.events.external_link IS 'External booking URL shown to confirmed registrants';

