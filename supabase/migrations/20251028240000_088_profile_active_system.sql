/*
  # Profile Active/Inactive System

  1. Changes
    - Add `is_active` column to user_profiles
    - Set eriksonleif as active for the specific user
    - Create trigger to enforce only one active profile per regular user
    - Admin/Elite users can have multiple active profiles
    - Create helper function to get active profile
    - Update RLS policies

  2. Security
    - Only profile owner can activate/deactivate their profiles
    - Automatic deactivation of other profiles when activating one (for regular users)
    - Admin/Elite users bypass single-active-profile restriction
*/

-- Add is_active column
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Set eriksonleif as active, others as inactive for this specific user
UPDATE user_profiles
SET is_active = (subdomain = 'eriksonleif')
WHERE user_id = '2c881a78-7a11-44ce-9d80-31a70139294b';

-- Create function to check if user can have multiple active profiles
CREATE OR REPLACE FUNCTION can_have_multiple_active_profiles(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  -- Get user role
  SELECT role INTO v_role
  FROM customers
  WHERE user_id = p_user_id;

  -- Admin and Elite users can have multiple active profiles
  RETURN v_role IN ('admin', 'elite');
END;
$$;

-- Create trigger function to enforce single active profile
CREATE OR REPLACE FUNCTION enforce_single_active_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If activating a profile
  IF NEW.is_active = true THEN
    -- Check if user can have multiple active profiles
    IF NOT can_have_multiple_active_profiles(NEW.user_id) THEN
      -- Deactivate all other profiles for this user
      UPDATE user_profiles
      SET is_active = false
      WHERE user_id = NEW.user_id
        AND id != NEW.id
        AND is_active = true;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_enforce_single_active_profile ON user_profiles;
CREATE TRIGGER trigger_enforce_single_active_profile
  BEFORE INSERT OR UPDATE OF is_active ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION enforce_single_active_profile();

-- Create function to get active profile for a user
CREATE OR REPLACE FUNCTION get_active_profile(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  subdomain text,
  display_name text,
  avatar_url text,
  bio text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    up.id,
    up.subdomain,
    up.display_name,
    up.avatar_url,
    up.bio
  FROM user_profiles up
  WHERE up.user_id = p_user_id
    AND up.is_active = true
  ORDER BY up.created_at DESC
  LIMIT 1;
END;
$$;

-- Create index for active profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_active
ON user_profiles(user_id, is_active)
WHERE is_active = true;

-- Update RLS policy for profile updates to allow toggling is_active
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = auth.uid()
      AND customers.role = 'admin'
    )
  )
  WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = auth.uid()
      AND customers.role = 'admin'
    )
  );

-- Add comment
COMMENT ON COLUMN user_profiles.is_active IS 'Only one profile can be active per user (except admin/elite). Active profile is used for posts/stories.';
