/*
  # Allow Public Access to Social Engagement Data

  1. Changes
    - Allow anonymous users to view likes, comments, and shares on public posts
    - Allow anonymous users to view public user profiles

  2. Security
    - Read-only access for anonymous users
    - Only data related to public posts is visible
*/

-- Drop existing policy if exists
DROP POLICY IF EXISTS "Anyone can view likes on public posts" ON social_likes;
DROP POLICY IF EXISTS "Anyone can view comments on public posts" ON social_comments;
DROP POLICY IF EXISTS "Anyone can view shares on public posts" ON social_shares;
DROP POLICY IF EXISTS "Anyone can view public profiles" ON user_profiles;

-- Allow everyone to view likes on public posts
CREATE POLICY "Anyone can view likes on public posts"
  ON social_likes
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM social_posts
      WHERE social_posts.id = social_likes.post_id
      AND social_posts.privacy = 'public'
      AND social_posts.is_active = true
    )
  );

-- Allow everyone to view comments on public posts
CREATE POLICY "Anyone can view comments on public posts"
  ON social_comments
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM social_posts
      WHERE social_posts.id = social_comments.post_id
      AND social_posts.privacy = 'public'
      AND social_posts.is_active = true
    )
  );

-- Allow everyone to view shares on public posts
CREATE POLICY "Anyone can view shares on public posts"
  ON social_shares
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM social_posts
      WHERE social_posts.id = social_shares.post_id
      AND social_posts.privacy = 'public'
      AND social_posts.is_active = true
    )
  );

-- Allow everyone to view public user profiles (using is_public column)
CREATE POLICY "Anyone can view public profiles"
  ON user_profiles
  FOR SELECT
  TO public
  USING (is_public = true);
