/*
  # Add show_whatsapp_on_posts column to user_profiles

  1. Changes
    - Add `show_whatsapp_on_posts` boolean column to `user_profiles` table
    - Default value: false
    - Purpose: Controls whether WhatsApp contact button appears on social posts

  2. Security
    - Column accessible through existing RLS policies
    - Only profile owners can modify this setting
*/

-- Add show_whatsapp_on_posts column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'show_whatsapp_on_posts'
  ) THEN
    ALTER TABLE user_profiles 
    ADD COLUMN show_whatsapp_on_posts boolean DEFAULT false;
    
    COMMENT ON COLUMN user_profiles.show_whatsapp_on_posts IS 
    'Display WhatsApp contact button on social posts';
  END IF;
END $$;
