/*
  # Add Link Color and Opacity Customization

  Simple color customization system for profile links.
  
  1. New Columns
    - `button_color` (text) - Hex color for button background (e.g., '#3B82F6')
    - `button_opacity` (integer, 0-100) - Opacity percentage for the button
  
  2. Defaults
    - button_color defaults to '#3B82F6' (blue)
    - button_opacity defaults to 100 (fully opaque)
*/

-- Add color and opacity columns to profile_links
ALTER TABLE profile_links
  ADD COLUMN IF NOT EXISTS button_color TEXT DEFAULT '#3B82F6',
  ADD COLUMN IF NOT EXISTS button_opacity INTEGER DEFAULT 100 CHECK (button_opacity >= 0 AND button_opacity <= 100);

-- Update existing links to have default values
UPDATE profile_links 
SET 
  button_color = '#3B82F6',
  button_opacity = 100
WHERE button_color IS NULL OR button_opacity IS NULL;