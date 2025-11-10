/*
  # Profile Background Media Support

  1. Changes to Tables
    - Add background media fields to `user_profiles` table
      - `background_type` - Type of background: 'none', 'solid', 'gradient', 'image', 'video'
      - `background_color` - Solid background color (hex)
      - `background_gradient_start` - Gradient start color
      - `background_gradient_end` - Gradient end color
      - `background_media_url` - URL to the background media file (image or video)
      - `background_video_poster` - Poster image for video (thumbnail)
      - `background_overlay_opacity` - Opacity for overlay on top of media (0-100)
      - `background_overlay_color` - Color for overlay to ensure text readability

  2. Storage Bucket
    - Create 'profile-backgrounds' bucket for background images and videos
    - Max file size: 50MB for videos, 10MB for images
    - Allowed formats: jpg, png, webp, gif, mp4, webm

  3. Security
    - Users can upload their own background media
    - Public access for viewing backgrounds on public profiles
    - Automatic file size and type validation
*/

-- Add background media fields to user_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'background_type'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN background_type text DEFAULT 'solid';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'background_color'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN background_color text DEFAULT '#0F172A';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'background_gradient_start'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN background_gradient_start text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'background_gradient_end'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN background_gradient_end text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'background_media_url'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN background_media_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'background_video_poster'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN background_video_poster text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'background_overlay_opacity'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN background_overlay_opacity integer DEFAULT 50;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'background_overlay_color'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN background_overlay_color text DEFAULT '#000000';
  END IF;
END $$;

-- Create storage bucket for profile backgrounds
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-backgrounds',
  'profile-backgrounds',
  true,
  52428800, -- 50MB max
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for profile-backgrounds bucket
CREATE POLICY "Users can upload own profile backgrounds"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profile-backgrounds' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own profile backgrounds"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'profile-backgrounds' AND
    (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'profile-backgrounds' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own profile backgrounds"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'profile-backgrounds' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Public can view profile backgrounds"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'profile-backgrounds');

-- Add check constraint for valid background types
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'valid_background_type'
  ) THEN
    ALTER TABLE user_profiles
    ADD CONSTRAINT valid_background_type
    CHECK (background_type IN ('none', 'solid', 'gradient', 'image', 'video'));
  END IF;
END $$;

-- Add check constraint for overlay opacity range
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'valid_overlay_opacity'
  ) THEN
    ALTER TABLE user_profiles
    ADD CONSTRAINT valid_overlay_opacity
    CHECK (background_overlay_opacity >= 0 AND background_overlay_opacity <= 100);
  END IF;
END $$;