/*
  # Create Social Media Storage Bucket

  1. New Storage Bucket
    - `social-media` bucket for user-uploaded content (posts, images, videos)
    - Public access for viewing
    
  2. Security
    - Users can upload to their own folder only
    - Anyone can view (public bucket)
    - Users can delete their own content
*/

-- Create bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('social-media', 'social-media', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view files" ON storage.objects;

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'social-media' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own files
CREATE POLICY "Users can update own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'social-media' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'social-media' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow anyone to view files (public bucket)
CREATE POLICY "Anyone can view files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'social-media');
