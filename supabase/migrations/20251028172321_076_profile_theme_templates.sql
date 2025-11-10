/*
  # Profile Theme Templates System
  
  1. New Tables
    - `profile_theme_templates`
      - `id` (uuid, primary key)
      - `name` (text) - Template name
      - `description` (text) - Template description
      - `preview_image` (text) - URL to preview image
      - `category` (text) - Template category (professional, creative, minimal, etc)
      - `is_premium` (boolean) - Requires Elite/Supreme plan
      - `background_type` (text) - color, gradient, image
      - `background_value` (jsonb) - Background configuration
      - `button_style` (text) - Style preset for buttons
      - `font_family` (text) - Google Font name
      - `link_color` (text) - Default link color
      - `link_opacity` (numeric) - Default opacity
      - `button_text_color` (text) - Button text color
      - `custom_css` (text) - Optional custom CSS
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `profile_applied_templates`
      - `id` (uuid, primary key)
      - `profile_id` (uuid, foreign key)
      - `template_id` (uuid, foreign key)
      - `applied_at` (timestamptz)
      - `customizations` (jsonb) - User modifications to template
  
  2. Security
    - Enable RLS on all tables
    - Public can view templates
    - Only authenticated users can apply templates to their profiles
    - Only admins can create/edit templates
*/

-- Create profile_theme_templates table
CREATE TABLE IF NOT EXISTS profile_theme_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  preview_image text,
  category text NOT NULL DEFAULT 'general',
  is_premium boolean DEFAULT false,
  background_type text NOT NULL DEFAULT 'color',
  background_value jsonb NOT NULL DEFAULT '{"value": "#ffffff"}'::jsonb,
  button_style text DEFAULT 'rounded',
  font_family text DEFAULT 'Inter',
  link_color text DEFAULT '#000000',
  link_opacity numeric DEFAULT 1.0,
  button_text_color text DEFAULT '#ffffff',
  custom_css text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create profile_applied_templates table
CREATE TABLE IF NOT EXISTS profile_applied_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES profile_theme_templates(id) ON DELETE CASCADE,
  applied_at timestamptz DEFAULT now(),
  customizations jsonb DEFAULT '{}'::jsonb,
  UNIQUE(profile_id, template_id)
);

-- Enable RLS
ALTER TABLE profile_theme_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_applied_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profile_theme_templates

-- Public can view active templates
CREATE POLICY "Anyone can view active templates"
  ON profile_theme_templates FOR SELECT
  USING (is_active = true);

-- Admins can manage templates
CREATE POLICY "Admins can insert templates"
  ON profile_theme_templates FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers 
      WHERE customers.user_id = auth.uid() 
      AND customers.role = 'admin'
    )
  );

CREATE POLICY "Admins can update templates"
  ON profile_theme_templates FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers 
      WHERE customers.user_id = auth.uid() 
      AND customers.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete templates"
  ON profile_theme_templates FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers 
      WHERE customers.user_id = auth.uid() 
      AND customers.role = 'admin'
    )
  );

-- RLS Policies for profile_applied_templates

-- Users can view their applied templates
CREATE POLICY "Users can view own applied templates"
  ON profile_applied_templates FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = profile_applied_templates.profile_id
      AND user_profiles.user_id = auth.uid()
    )
  );

-- Users can apply templates to their profiles
CREATE POLICY "Users can apply templates to own profiles"
  ON profile_applied_templates FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = profile_applied_templates.profile_id
      AND user_profiles.user_id = auth.uid()
    )
  );

-- Users can update their applied templates
CREATE POLICY "Users can update own applied templates"
  ON profile_applied_templates FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = profile_applied_templates.profile_id
      AND user_profiles.user_id = auth.uid()
    )
  );

-- Users can remove applied templates
CREATE POLICY "Users can delete own applied templates"
  ON profile_applied_templates FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = profile_applied_templates.profile_id
      AND user_profiles.user_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_theme_templates_category ON profile_theme_templates(category);
CREATE INDEX IF NOT EXISTS idx_theme_templates_premium ON profile_theme_templates(is_premium);
CREATE INDEX IF NOT EXISTS idx_applied_templates_profile ON profile_applied_templates(profile_id);
CREATE INDEX IF NOT EXISTS idx_applied_templates_template ON profile_applied_templates(template_id);

-- Insert default templates
INSERT INTO profile_theme_templates (name, description, category, is_premium, background_type, background_value, button_style, font_family, link_color, button_text_color) VALUES
('Minimal White', 'Clean and minimal white theme', 'minimal', false, 'color', '{"value": "#ffffff"}', 'rounded', 'Inter', '#000000', '#ffffff'),
('Dark Professional', 'Sleek dark theme for professionals', 'professional', false, 'color', '{"value": "#1a1a1a"}', 'rounded', 'Roboto', '#ffffff', '#000000'),
('Ocean Gradient', 'Beautiful ocean-inspired gradient', 'creative', true, 'gradient', '{"from": "#4facfe", "to": "#00f2fe", "direction": "to bottom right"}', 'pill', 'Poppins', '#ffffff', '#ffffff'),
('Sunset Vibes', 'Warm sunset gradient theme', 'creative', true, 'gradient', '{"from": "#fa709a", "to": "#fee140", "direction": "to bottom right"}', 'pill', 'Montserrat', '#ffffff', '#ffffff'),
('Forest Green', 'Natural green theme', 'creative', false, 'color', '{"value": "#2d5016"}', 'rounded', 'Lato', '#ffffff', '#ffffff'),
('Corporate Blue', 'Professional blue for business', 'professional', false, 'gradient', '{"from": "#0f2027", "to": "#2c5364", "direction": "to bottom"}', 'square', 'Open Sans', '#ffffff', '#ffffff'),
('Creative Purple', 'Bold purple for creatives', 'creative', true, 'gradient', '{"from": "#667eea", "to": "#764ba2", "direction": "to bottom right"}', 'pill', 'Nunito', '#ffffff', '#ffffff'),
('Elegant Gold', 'Luxury gold and black theme', 'professional', true, 'gradient', '{"from": "#000000", "to": "#434343", "direction": "to bottom"}', 'rounded', 'Playfair Display', '#d4af37', '#000000');
