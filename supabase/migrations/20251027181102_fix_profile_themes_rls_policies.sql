/*
  # Fix Profile Themes RLS Policies
  
  1. Changes
    - Drop existing policies that may cause recursion issues
    - Create simplified, efficient policies
    - Add WITH CHECK to UPDATE policy for security
    - Use direct auth.uid() checks instead of EXISTS subqueries where possible
  
  2. Security
    - Users can only manage their own profile themes
    - Public profiles remain viewable by anyone
    - Policies are optimized to prevent infinite loops
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view public profile themes" ON profile_themes;
DROP POLICY IF EXISTS "Users can view own profile themes" ON profile_themes;
DROP POLICY IF EXISTS "Users can insert own profile themes" ON profile_themes;
DROP POLICY IF EXISTS "Users can update own profile themes" ON profile_themes;
DROP POLICY IF EXISTS "Users can delete own profile themes" ON profile_themes;

-- Create optimized policies using a helper function to avoid recursion
CREATE OR REPLACE FUNCTION check_profile_ownership(profile_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = profile_uuid 
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- SELECT: Users can view their own profile themes
CREATE POLICY "Users can view own profile themes"
  ON profile_themes
  FOR SELECT
  TO authenticated
  USING (check_profile_ownership(profile_id));

-- SELECT: Anyone can view public profile themes
CREATE POLICY "Anyone can view public profile themes"
  ON profile_themes
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = profile_themes.profile_id 
      AND is_public = true
    )
  );

-- INSERT: Users can create themes for their own profiles
CREATE POLICY "Users can insert own profile themes"
  ON profile_themes
  FOR INSERT
  TO authenticated
  WITH CHECK (check_profile_ownership(profile_id));

-- UPDATE: Users can update themes for their own profiles
CREATE POLICY "Users can update own profile themes"
  ON profile_themes
  FOR UPDATE
  TO authenticated
  USING (check_profile_ownership(profile_id))
  WITH CHECK (check_profile_ownership(profile_id));

-- DELETE: Users can delete themes for their own profiles
CREATE POLICY "Users can delete own profile themes"
  ON profile_themes
  FOR DELETE
  TO authenticated
  USING (check_profile_ownership(profile_id));
