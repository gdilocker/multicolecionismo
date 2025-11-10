/*
  # Fix Stories Public Access
  
  1. Changes
    - Add public access policy for viewing stories from public profiles
    - Simplify RLS policies for better performance
  
  2. Security
    - Still maintains security - only public profile stories are viewable by everyone
    - Own stories always viewable by owner
*/

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Users can view own stories or public profile stories" ON profile_stories;

-- Create new simplified policies for viewing stories
CREATE POLICY "Anyone can view stories from public profiles"
  ON profile_stories FOR SELECT
  TO authenticated, anon
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = profile_stories.profile_id
      AND user_profiles.is_public = true
    )
  );

CREATE POLICY "Users can view their own stories"
  ON profile_stories FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = profile_stories.profile_id
      AND user_profiles.user_id = auth.uid()
    )
  );
