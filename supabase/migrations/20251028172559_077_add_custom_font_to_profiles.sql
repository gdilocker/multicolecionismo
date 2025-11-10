/*
  # Add Custom Font Support to User Profiles
  
  1. Changes
    - Add `custom_font` column to `user_profiles` table
    - Default font is 'Inter'
  
  2. Notes
    - This allows users to choose from Google Fonts
    - The font name will be used to load from Google Fonts CDN
*/

-- Add custom_font column to user_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'custom_font'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN custom_font text DEFAULT 'Inter';
  END IF;
END $$;
