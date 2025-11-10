/*
  # Add WhatsApp Contact to User Profiles

  1. Changes
    - Add `whatsapp_number` column to `user_profiles` table
    - Add `show_whatsapp_on_posts` column to control visibility
    - Column stores phone number in international format (e.g., +5511999999999)
    - Users can optionally display WhatsApp contact button on their posts

  2. Security
    - No RLS changes needed (inherits existing user_profiles policies)
    - Phone number visibility controlled by user preference
*/

-- Add WhatsApp fields to user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS whatsapp_number text,
ADD COLUMN IF NOT EXISTS show_whatsapp_on_posts boolean DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN user_profiles.whatsapp_number IS 'User WhatsApp number in international format (e.g., +5511999999999)';
COMMENT ON COLUMN user_profiles.show_whatsapp_on_posts IS 'Whether to show WhatsApp contact button on user posts';
