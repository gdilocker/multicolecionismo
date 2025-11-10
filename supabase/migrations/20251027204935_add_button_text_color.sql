/*
  # Add Button Text Color Column

  Adds text color customization for profile links.
  
  1. New Column
    - `button_text_color` (text) - Hex color for button text (e.g., '#FFFFFF')
  
  2. Default
    - Defaults to '#FFFFFF' (white)
*/

-- Add text color column to profile_links
ALTER TABLE profile_links
  ADD COLUMN IF NOT EXISTS button_text_color TEXT DEFAULT '#FFFFFF';

-- Update existing links to have default white text
UPDATE profile_links 
SET button_text_color = '#FFFFFF'
WHERE button_text_color IS NULL;