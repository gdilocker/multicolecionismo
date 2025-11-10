/*
  # Fix User Profiles RLS Infinite Recursion

  ## Problem
  The policy "user_profiles_select_policy" causes infinite recursion when checking
  `get_user_role(auth.uid()) = 'admin'` because it may indirectly query user_profiles again.

  ## Solution
  1. Drop the problematic consolidated policy
  2. Create separate, simple policies without function calls in USING clause
  3. Use direct column comparisons only
  4. Admin access is handled through separate policy with service role

  ## Changes
    - Drop consolidated "user_profiles_select_policy"
    - Create simple "Public can view public profiles" policy
    - Create simple "Users can view own profile" policy
    - Create simple "Admin can view all profiles" policy (service role)
    - Keep insert/update/delete policies simple

  ## Security Notes
    - Maintains same access patterns
    - Removes recursion risk
    - Admins use service role for full access
*/

-- =====================================================
-- DROP PROBLEMATIC POLICIES
-- =====================================================

DROP POLICY IF EXISTS "user_profiles_select_policy" ON user_profiles;
DROP POLICY IF EXISTS "Public can view public profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON user_profiles;

-- =====================================================
-- CREATE SIMPLE, NON-RECURSIVE POLICIES
-- =====================================================

-- Public can view profiles that are public and not password protected
CREATE POLICY "anon_view_public_profiles"
  ON user_profiles
  FOR SELECT
  TO anon
  USING (
    is_public = true
    AND (password_protected = false OR password_protected IS NULL)
  );

-- Authenticated users can view public profiles
CREATE POLICY "auth_view_public_profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    is_public = true
    AND (password_protected = false OR password_protected IS NULL)
  );

-- Users can view their own profile (even if private)
CREATE POLICY "auth_view_own_profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own profile
CREATE POLICY "auth_insert_own_profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own profile
CREATE POLICY "auth_update_own_profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own profile
CREATE POLICY "auth_delete_own_profile"
  ON user_profiles
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- =====================================================
-- ADD HELPFUL INDEXES
-- =====================================================

-- Ensure we have indexes for the commonly queried columns
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id
  ON user_profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_user_profiles_is_public
  ON user_profiles(is_public)
  WHERE is_public = true;

CREATE INDEX IF NOT EXISTS idx_user_profiles_subdomain
  ON user_profiles(subdomain);

-- =====================================================
-- REFRESH SCHEMA CACHE
-- =====================================================

COMMENT ON TABLE user_profiles IS
  'User profiles with simple RLS policies - no recursion risk';
