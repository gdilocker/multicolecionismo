/*
  # Deprecate Profile Themes Table
  
  1. Changes
    - Drop profile_themes table as themes are now per-link
    - Drop related policies and function
  
  2. Cleanup
    - Remove check_profile_ownership function (no longer needed)
    - Remove all profile_themes policies
    - Drop the table
*/

-- Drop policies
DROP POLICY IF EXISTS "Users can view own profile themes" ON profile_themes;
DROP POLICY IF EXISTS "Anyone can view public profile themes" ON profile_themes;
DROP POLICY IF EXISTS "Users can insert own profile themes" ON profile_themes;
DROP POLICY IF EXISTS "Users can update own profile themes" ON profile_themes;
DROP POLICY IF EXISTS "Users can delete own profile themes" ON profile_themes;

-- Drop function
DROP FUNCTION IF EXISTS check_profile_ownership(uuid);

-- Drop table
DROP TABLE IF EXISTS profile_themes CASCADE;
