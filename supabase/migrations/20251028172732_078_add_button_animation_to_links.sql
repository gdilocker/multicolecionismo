/*
  # Add Button Animation Support to Profile Links
  
  1. Changes
    - Add `button_animation` column to `profile_links` table
    - Default animation is 'none'
    - Supported animations: none, pulse, bounce, shake, glow, slide
  
  2. Notes
    - This allows users to add subtle animations to their buttons
    - Animations are applied on hover or as continuous effects
*/

-- Add button_animation column to profile_links
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profile_links' AND column_name = 'button_animation'
  ) THEN
    ALTER TABLE profile_links ADD COLUMN button_animation text DEFAULT 'none';
  END IF;
END $$;

-- Add check constraint for valid animation types
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'profile_links' AND constraint_name = 'profile_links_button_animation_check'
  ) THEN
    ALTER TABLE profile_links
    ADD CONSTRAINT profile_links_button_animation_check
    CHECK (button_animation IN ('none', 'pulse', 'bounce', 'shake', 'glow', 'slide', 'grow'));
  END IF;
END $$;
