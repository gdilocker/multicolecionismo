/*
  # Add missing columns to user_profiles

  1. Changes
    - Add password_protected, access_password, allow_default_password
    - Add background_type, background_color, background_gradient_start, background_gradient_end
    - Add background_media_url, background_overlay_opacity, background_overlay_color
    - Add custom_font, custom_css
    - Add store_enabled, social_enabled, store_allowed_by_admin, social_allowed_by_admin
    - Add whatsapp
  
  2. Notes
    - These columns are needed by ProfileManager and other components
*/

-- Add missing profile columns
DO $$
BEGIN
  -- Password protection fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'password_protected') THEN
    ALTER TABLE user_profiles ADD COLUMN password_protected boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'access_password') THEN
    ALTER TABLE user_profiles ADD COLUMN access_password text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'allow_default_password') THEN
    ALTER TABLE user_profiles ADD COLUMN allow_default_password boolean DEFAULT false;
  END IF;

  -- Background customization fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'background_type') THEN
    ALTER TABLE user_profiles ADD COLUMN background_type text DEFAULT 'color';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'background_color') THEN
    ALTER TABLE user_profiles ADD COLUMN background_color text DEFAULT '#ffffff';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'background_gradient_start') THEN
    ALTER TABLE user_profiles ADD COLUMN background_gradient_start text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'background_gradient_end') THEN
    ALTER TABLE user_profiles ADD COLUMN background_gradient_end text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'background_media_url') THEN
    ALTER TABLE user_profiles ADD COLUMN background_media_url text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'background_overlay_opacity') THEN
    ALTER TABLE user_profiles ADD COLUMN background_overlay_opacity numeric DEFAULT 0.5;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'background_overlay_color') THEN
    ALTER TABLE user_profiles ADD COLUMN background_overlay_color text DEFAULT '#000000';
  END IF;

  -- Customization fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'custom_font') THEN
    ALTER TABLE user_profiles ADD COLUMN custom_font text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'custom_css') THEN
    ALTER TABLE user_profiles ADD COLUMN custom_css text;
  END IF;

  -- Feature toggles
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'store_enabled') THEN
    ALTER TABLE user_profiles ADD COLUMN store_enabled boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'social_enabled') THEN
    ALTER TABLE user_profiles ADD COLUMN social_enabled boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'store_allowed_by_admin') THEN
    ALTER TABLE user_profiles ADD COLUMN store_allowed_by_admin boolean DEFAULT true;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'social_allowed_by_admin') THEN
    ALTER TABLE user_profiles ADD COLUMN social_allowed_by_admin boolean DEFAULT true;
  END IF;

  -- Contact fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'whatsapp') THEN
    ALTER TABLE user_profiles ADD COLUMN whatsapp text;
  END IF;
END $$;
