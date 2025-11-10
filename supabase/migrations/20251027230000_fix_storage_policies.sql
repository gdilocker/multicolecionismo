/*
  # Fix Storage Bucket Policies

  ## Problem
  Storage policies were not bucket-specific, causing conflicts between
  profile-images and social-media buckets.

  ## Solution
  1. Drop all existing storage policies
  2. Recreate with proper bucket-specific naming
  3. Ensure policies are scoped correctly

  ## Security
  - profile-images: Users can upload/update/delete own files
  - social-media: Service role uploads, public reads
*/

-- =====================================================
-- DROP ALL EXISTING STORAGE POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Users can upload to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view profile images" ON storage.objects;

-- =====================================================
-- PROFILE IMAGES BUCKET POLICIES
-- =====================================================

-- Allow authenticated users to upload profile images
CREATE POLICY "profile_images_upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own profile images
CREATE POLICY "profile_images_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own profile images
CREATE POLICY "profile_images_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow anyone to view profile images
CREATE POLICY "profile_images_select"
ON storage.objects
FOR SELECT
USING (bucket_id = 'profile-images');

-- =====================================================
-- SOCIAL MEDIA BUCKET POLICIES
-- =====================================================

-- Allow service role to upload (Edge Function uses service role)
CREATE POLICY "social_media_service_upload"
ON storage.objects
FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'social-media');

-- Allow authenticated users to upload to own folder
CREATE POLICY "social_media_user_upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'social-media' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own files
CREATE POLICY "social_media_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'social-media' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow anyone to view social media files (public bucket)
CREATE POLICY "social_media_select"
ON storage.objects
FOR SELECT
USING (bucket_id = 'social-media');
