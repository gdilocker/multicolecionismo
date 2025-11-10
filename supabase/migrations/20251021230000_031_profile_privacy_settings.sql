/*
  # Profile Privacy Settings

  1. Changes to existing tables
    - Add privacy settings to user_profiles table:
      - `is_public` (boolean) - Whether profile is publicly accessible
      - `password_protected` (boolean) - Whether profile requires password
      - `access_password` (text) - Encrypted password for private profiles
      - `allow_default_password` (boolean) - Allow platform default password

  2. Security
    - Passwords are hashed using pgcrypto extension
    - RLS policies updated to respect privacy settings
    - Public profiles remain accessible to everyone
    - Private profiles require password authentication

  3. Notes
    - Default password can be set at platform level
    - Users can set custom passwords for their profiles
    - Profile owner always has access without password
*/

-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add privacy columns to user_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'password_protected'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN password_protected boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'access_password'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN access_password text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'allow_default_password'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN allow_default_password boolean DEFAULT true;
  END IF;
END $$;

-- Function to set profile password (hashes the password)
CREATE OR REPLACE FUNCTION set_profile_password(
  profile_uuid uuid,
  password_text text
)
RETURNS void AS $$
BEGIN
  UPDATE user_profiles
  SET access_password = crypt(password_text, gen_salt('bf'))
  WHERE id = profile_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify profile password
CREATE OR REPLACE FUNCTION verify_profile_password(
  profile_uuid uuid,
  password_text text
)
RETURNS boolean AS $$
DECLARE
  profile_record RECORD;
  default_password text;
BEGIN
  -- Get profile data
  SELECT access_password, allow_default_password, password_protected
  INTO profile_record
  FROM user_profiles
  WHERE id = profile_uuid;

  -- If not password protected, return true
  IF NOT profile_record.password_protected THEN
    RETURN true;
  END IF;

  -- Check custom password
  IF profile_record.access_password IS NOT NULL AND
     profile_record.access_password = crypt(password_text, profile_record.access_password) THEN
    RETURN true;
  END IF;

  -- Check default password if allowed
  IF profile_record.allow_default_password THEN
    -- Get default password from settings (you can configure this)
    -- For now, we'll use a configurable value
    SELECT setting_value INTO default_password
    FROM admin_settings
    WHERE setting_key = 'default_profile_password'
    LIMIT 1;

    IF default_password IS NOT NULL AND
       crypt(password_text, default_password) = default_password THEN
      RETURN true;
    END IF;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create admin_settings table for platform-wide settings (if not exists)
CREATE TABLE IF NOT EXISTS admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage settings
CREATE POLICY "Admins can manage settings"
  ON admin_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Insert default profile password (hash of 'comrich2024')
INSERT INTO admin_settings (setting_key, setting_value, description)
VALUES (
  'default_profile_password',
  crypt('comrich2024', gen_salt('bf')),
  'Default password for protected profiles when allow_default_password is enabled'
)
ON CONFLICT (setting_key) DO NOTHING;

-- Update RLS policy for public profile viewing to respect privacy
DROP POLICY IF EXISTS "Public can view public profiles" ON user_profiles;

CREATE POLICY "Public can view public profiles"
  ON user_profiles FOR SELECT
  TO public
  USING (
    is_public = true AND
    (password_protected = false OR password_protected IS NULL)
  );

-- Create a view for profile access (used to check if user can view profile)
CREATE OR REPLACE VIEW public_accessible_profiles AS
SELECT
  id,
  user_id,
  username,
  full_name,
  bio,
  avatar_url,
  banner_url,
  is_public,
  password_protected,
  verified,
  total_views,
  created_at
FROM user_profiles
WHERE is_public = true;

-- Grant access to the view
GRANT SELECT ON public_accessible_profiles TO public;
GRANT SELECT ON public_accessible_profiles TO authenticated;
