/*
  # Create Installation Proofs Storage Bucket

  1. Storage Setup
    - Create `installation-proofs` bucket for vendor proof images
    - Set file size limit to 5MB
    - Allow image file types only
    - Enable public access for proof verification

  2. Security Policies
    - Vendors can upload proof images for their installations
    - Vendors can view their own installation proofs
    - Admins can view all installation proofs
    - Public read access for verification
*/

-- Create the storage bucket for installation proof images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'installation-proofs',
  'installation-proofs',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Allow vendors to upload proof images
CREATE POLICY "Vendors can upload installation proofs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'installation-proofs' AND
  auth.uid() IN (
    SELECT id FROM users WHERE role = 'vendor' AND is_active = true
  )
);

-- Policy: Allow vendors to view their own installation proofs
CREATE POLICY "Vendors can view own installation proofs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'installation-proofs' AND
  (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'vendor' AND is_active = true
    ) OR
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('super_admin', 'admin') AND is_active = true
    )
  )
);

-- Policy: Allow public read access for proof verification
CREATE POLICY "Public can view installation proofs"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'installation-proofs');

-- Policy: Allow vendors to update their installation proofs
CREATE POLICY "Vendors can update installation proofs"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'installation-proofs' AND
  auth.uid() IN (
    SELECT id FROM users WHERE role = 'vendor' AND is_active = true
  )
);

-- Policy: Allow vendors to delete their installation proofs
CREATE POLICY "Vendors can delete installation proofs"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'installation-proofs' AND
  auth.uid() IN (
    SELECT id FROM users WHERE role = 'vendor' AND is_active = true
  )
);