/*
  # Add Custom CSS Support to User Profiles
  
  1. Changes
    - Add `custom_css` column to `user_profiles` table
    - This allows advanced users to add custom styling
  
  2. Security Notes
    - CSS will be sanitized on the frontend to prevent XSS
    - Only valid CSS properties will be allowed
    - This is a premium feature for Elite/Supreme members
*/

-- Add custom_css column to user_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'custom_css'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN custom_css text;
  END IF;
END $$;
