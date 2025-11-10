/*
  # Stories and Highlights System
  
  1. New Tables
    - `profile_stories`
      - Stories that expire after 24 hours
      - Support for image and video content
      - View count tracking
    
    - `profile_highlights`
      - Permanent collections of stories
      - Organized by categories/topics
    
    - `highlight_stories`
      - Junction table linking highlights to stories
  
  2. Security
    - Enable RLS on all tables
    - Users can only manage their own stories/highlights
    - Public can view public profiles' stories/highlights
*/

-- Create profile_stories table
CREATE TABLE IF NOT EXISTS profile_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  media_type text NOT NULL CHECK (media_type IN ('image', 'video')),
  media_url text NOT NULL,
  caption text,
  view_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '24 hours')
);

-- Create profile_highlights table
CREATE TABLE IF NOT EXISTS profile_highlights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  cover_image_url text,
  position integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create highlight_stories junction table
CREATE TABLE IF NOT EXISTS highlight_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  highlight_id uuid NOT NULL REFERENCES profile_highlights(id) ON DELETE CASCADE,
  story_id uuid NOT NULL REFERENCES profile_stories(id) ON DELETE CASCADE,
  position integer DEFAULT 0,
  added_at timestamptz DEFAULT now(),
  UNIQUE(highlight_id, story_id)
);

-- Enable RLS
ALTER TABLE profile_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE highlight_stories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profile_stories

-- Users can view stories from public profiles or their own stories
CREATE POLICY "Users can view own stories or public profile stories"
  ON profile_stories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = profile_stories.profile_id
      AND (user_profiles.is_public = true OR user_profiles.user_id = auth.uid())
    )
  );

-- Users can create stories for their own profiles
CREATE POLICY "Users can create own stories"
  ON profile_stories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = profile_stories.profile_id
      AND user_profiles.user_id = auth.uid()
    )
  );

-- Users can update their own stories
CREATE POLICY "Users can update own stories"
  ON profile_stories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = profile_stories.profile_id
      AND user_profiles.user_id = auth.uid()
    )
  );

-- Users can delete their own stories
CREATE POLICY "Users can delete own stories"
  ON profile_stories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = profile_stories.profile_id
      AND user_profiles.user_id = auth.uid()
    )
  );

-- RLS Policies for profile_highlights

-- Users can view highlights from public profiles or their own
CREATE POLICY "Users can view own highlights or public profile highlights"
  ON profile_highlights FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = profile_highlights.profile_id
      AND (user_profiles.is_public = true OR user_profiles.user_id = auth.uid())
    )
  );

-- Users can create highlights for their own profiles
CREATE POLICY "Users can create own highlights"
  ON profile_highlights FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = profile_highlights.profile_id
      AND user_profiles.user_id = auth.uid()
    )
  );

-- Users can update their own highlights
CREATE POLICY "Users can update own highlights"
  ON profile_highlights FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = profile_highlights.profile_id
      AND user_profiles.user_id = auth.uid()
    )
  );

-- Users can delete their own highlights
CREATE POLICY "Users can delete own highlights"
  ON profile_highlights FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = profile_highlights.profile_id
      AND user_profiles.user_id = auth.uid()
    )
  );

-- RLS Policies for highlight_stories

-- Anyone can view highlight_stories if they can view the highlight
CREATE POLICY "Users can view highlight_stories"
  ON highlight_stories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profile_highlights
      JOIN user_profiles ON user_profiles.id = profile_highlights.profile_id
      WHERE profile_highlights.id = highlight_stories.highlight_id
      AND (user_profiles.is_public = true OR user_profiles.user_id = auth.uid())
    )
  );

-- Users can manage highlight_stories for their own highlights
CREATE POLICY "Users can manage own highlight_stories"
  ON highlight_stories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profile_highlights
      JOIN user_profiles ON user_profiles.id = profile_highlights.profile_id
      WHERE profile_highlights.id = highlight_stories.highlight_id
      AND user_profiles.user_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_stories_profile_expires ON profile_stories(profile_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_highlights_profile ON profile_highlights(profile_id);
CREATE INDEX IF NOT EXISTS idx_highlight_stories_highlight ON highlight_stories(highlight_id);

-- Function to cleanup expired stories
CREATE OR REPLACE FUNCTION cleanup_expired_stories()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM profile_stories
  WHERE expires_at < now();
END;
$$;
