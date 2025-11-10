/*
  # Add Profile Display Mode System

  1. Changes
    - Add `display_mode` column to user_profiles table
      - Options: 'social' (feed posts), 'links' (linktree style), 'both' (combined)
      - Default: 'both' for maximum flexibility

  2. Purpose
    - Allow users to choose how their public profile appears
    - Enable dual functionality: social network + link-in-bio
    - Provide flexibility without breaking existing profiles
*/

-- Add display_mode column to user_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'display_mode'
  ) THEN
    ALTER TABLE user_profiles
    ADD COLUMN display_mode text DEFAULT 'both' CHECK (display_mode IN ('social', 'links', 'both'));
  END IF;
END $$;

-- Add comment for clarity
COMMENT ON COLUMN user_profiles.display_mode IS 'How the public profile is displayed: social (posts feed), links (linktree), or both';