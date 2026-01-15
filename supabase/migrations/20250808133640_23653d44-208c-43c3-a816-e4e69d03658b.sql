-- Create landing-page-images bucket for dynamic content
INSERT INTO storage.buckets (id, name)
VALUES ('landing-page-images', 'landing-page-images')
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for landing page images bucket
CREATE POLICY "Landing page images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'landing-page-images');

-- Allow authenticated users to upload landing page images
CREATE POLICY "Authenticated users can upload landing page images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'landing-page-images' AND auth.role() = 'authenticated');

-- Allow authenticated users to update landing page images  
CREATE POLICY "Authenticated users can update landing page images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'landing-page-images' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete landing page images
CREATE POLICY "Authenticated users can delete landing page images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'landing-page-images' AND auth.role() = 'authenticated');