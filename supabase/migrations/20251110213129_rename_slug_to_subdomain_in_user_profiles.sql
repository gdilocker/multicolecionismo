/*
  # Rename slug to subdomain in user_profiles

  1. Changes
    - Rename column `slug` to `subdomain` in `user_profiles` table
    - This aligns with the code that expects `subdomain` field
  
  2. Notes
    - The code consistently uses `subdomain` but the database has `slug`
    - This migration fixes the mismatch
*/

-- Rename slug to subdomain
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'slug'
  ) THEN
    ALTER TABLE user_profiles RENAME COLUMN slug TO subdomain;
  END IF;
END $$;
