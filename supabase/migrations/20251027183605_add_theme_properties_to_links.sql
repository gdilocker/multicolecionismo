/*
  # Add Theme Properties to Profile Links
  
  1. Changes
    - Add theme/styling columns to profile_links table
    - Each link can now have its own visual customization
    - Remove dependency on global themes
  
  2. New Columns
    - button_style: Style of the button (flat, rounded, outlined, etc)
    - button_color: Color of the button (hex or rgba)
    - button_text_color: Color of the text
    - font_family: Font family for this link
    - button_opacity: Opacity level (0-100)
  
  3. Notes
    - All columns are optional (nullable)
    - If not set, will use sensible defaults
*/

-- Add theme columns to profile_links
ALTER TABLE profile_links
ADD COLUMN IF NOT EXISTS button_style text DEFAULT 'rounded',
ADD COLUMN IF NOT EXISTS button_color text DEFAULT '#3b82f6',
ADD COLUMN IF NOT EXISTS button_text_color text DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS font_family text DEFAULT 'Inter',
ADD COLUMN IF NOT EXISTS button_opacity integer DEFAULT 100;

-- Add check constraints
ALTER TABLE profile_links
ADD CONSTRAINT check_button_opacity 
  CHECK (button_opacity >= 0 AND button_opacity <= 100);

ALTER TABLE profile_links
ADD CONSTRAINT check_button_style 
  CHECK (button_style IN ('flat', 'rounded', 'outlined', 'gradient', 'glassmorphism', 'neumorphism'));

-- Add comment
COMMENT ON COLUMN profile_links.button_style IS 'Visual style of the button';
COMMENT ON COLUMN profile_links.button_color IS 'Button background color (hex or rgba)';
COMMENT ON COLUMN profile_links.button_text_color IS 'Button text color';
COMMENT ON COLUMN profile_links.font_family IS 'Font family for this link';
COMMENT ON COLUMN profile_links.button_opacity IS 'Button opacity (0-100)';
