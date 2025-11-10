/*
  # Add Store Icon Settings

  1. Changes
    - Add `show_store_icon_on_posts` column to `user_profiles` table
      - Controls whether the store icon appears on user's social posts
      - Defaults to false (opt-in feature)

  2. Security
    - Only the profile owner can update this setting
    - RLS policies already in place handle authorization
*/

-- Add store icon visibility setting
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS show_store_icon_on_posts boolean DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN user_profiles.show_store_icon_on_posts IS
  'When true, displays a store icon on all user posts linking to their store';
