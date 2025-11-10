/*
  # Create Public Assets Storage Bucket

  1. Storage
    - Create 'public-assets' bucket for storing images
    - Set as public bucket for direct access
    - Configure storage policies

  2. Security
    - Public read access (anonymous users can view)
    - Authenticated write access (only authenticated users can upload)
*/

-- Create the public-assets bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'public-assets',
  'public-assets',
  true,
  10485760, -- 10MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public Access to Assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete assets" ON storage.objects;

-- Allow public read access to all files
CREATE POLICY "Public Access to Assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'public-assets');

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'public-assets');

-- Allow authenticated users to update their uploads
CREATE POLICY "Authenticated users can update assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'public-assets');

-- Allow authenticated users to delete files
CREATE POLICY "Authenticated users can delete assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'public-assets');