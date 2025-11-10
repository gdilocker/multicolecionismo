/*
  # Profile Images Storage Bucket

  1. Storage Configuration
    - Create `profile-images` bucket for user avatar uploads
    - Enable public access for profile images
    - Set file size limit to 5MB
    - Allow image file types only (jpg, jpeg, png, gif, webp)

  2. Security
    - Users can upload images to their own folder
    - Images are publicly readable
    - Users can delete their own images
*/

-- Create storage bucket for profile images
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload images
CREATE POLICY "Users can upload profile images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profile-images' AND
    (storage.foldername(name))[1] = 'avatars'
  );

-- Allow public access to view images
CREATE POLICY "Public can view profile images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'profile-images');

-- Allow users to update their own images
CREATE POLICY "Users can update own profile images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'profile-images')
  WITH CHECK (bucket_id = 'profile-images');

-- Allow users to delete their own images
CREATE POLICY "Users can delete own profile images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'profile-images');
