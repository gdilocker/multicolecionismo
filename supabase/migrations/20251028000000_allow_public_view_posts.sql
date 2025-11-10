/*
  # Allow Public Access to Social Posts

  1. Changes
    - Add policy to allow anonymous users to view public posts
    - Public posts are those with privacy='public' and is_active=true

  2. Security
    - Read-only access for anonymous users
    - Only active and public posts visible
*/

-- Allow everyone (including anonymous) to view public posts
CREATE POLICY "Anyone can view public posts"
  ON social_posts
  FOR SELECT
  TO public
  USING (privacy = 'public' AND is_active = true);
