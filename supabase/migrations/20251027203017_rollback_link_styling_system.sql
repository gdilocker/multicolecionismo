/*
  # Rollback Complete Link Styling System

  This migration removes ALL link styling features that were added:
  
  1. Drops profile_themes table entirely
  2. Removes all style columns from profile_links table:
     - button_style
     - button_color
     - button_text_color
     - font_family
     - button_opacity
  
  This returns the system to the original simple link structure.
*/

-- Drop profile_themes table completely
DROP TABLE IF EXISTS profile_themes CASCADE;

-- Remove all styling columns from profile_links
ALTER TABLE profile_links
  DROP COLUMN IF EXISTS button_style,
  DROP COLUMN IF EXISTS button_color,
  DROP COLUMN IF EXISTS button_text_color,
  DROP COLUMN IF EXISTS font_family,
  DROP COLUMN IF EXISTS button_opacity;

-- Done! Links are back to basic: id, profile_id, title, url, icon, position, visible, created_at