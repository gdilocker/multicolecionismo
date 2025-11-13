/*
  # Force complete PostgREST schema cache reload
  
  This migration forces a complete reload of the PostgREST schema cache
  to ensure all columns are properly recognized.
  
  1. Changes
    - Drop and recreate the social_posts table with exact same structure
    - This forces PostgREST to completely refresh its cache
*/

-- Store existing data temporarily
CREATE TEMP TABLE social_posts_backup AS 
SELECT * FROM social_posts;

-- Drop the table (this will force cache invalidation)
DROP TABLE IF EXISTS social_posts CASCADE;

-- Recreate the table with exact structure
CREATE TABLE social_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  content text NOT NULL,
  media_url text,
  media_type text,
  is_public boolean NOT NULL DEFAULT true,
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true
);

-- Restore the data
INSERT INTO social_posts 
SELECT * FROM social_posts_backup;

-- Recreate indexes
CREATE INDEX idx_social_posts_user_id ON social_posts(user_id);
CREATE INDEX idx_social_posts_profile_id ON social_posts(profile_id);
CREATE INDEX idx_social_posts_created_at ON social_posts(created_at DESC);
CREATE INDEX idx_social_posts_public ON social_posts(is_public) WHERE is_public = true;

-- Enable RLS
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;

-- Recreate RLS policies
CREATE POLICY "Users can create their own posts"
  ON social_posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view public posts"
  ON social_posts FOR SELECT
  TO authenticated
  USING (is_public = true OR user_id = auth.uid());

CREATE POLICY "Users can update their own posts"
  ON social_posts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own posts"
  ON social_posts FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Anyone can view public posts"
  ON social_posts FOR SELECT
  TO anon
  USING (is_public = true AND is_active = true);

-- Force PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
