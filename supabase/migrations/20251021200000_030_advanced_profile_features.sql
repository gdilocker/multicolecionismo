/*
  # Advanced Profile Features - Better than Linktree

  1. New Tables
    - `profile_themes` - Customizable themes for profiles
    - `profile_analytics` - Track profile views and link clicks
    - `social_buttons` - Large social media buttons (separate from links)
    - `content_blocks` - Rich content blocks (YouTube, Spotify, images, text)
    - `profile_settings` - SEO and advanced settings

  2. Changes
    - Add theme customization options
    - Add analytics tracking
    - Add verified badge support
    - Add SEO meta fields

  3. Security
    - Enable RLS on all new tables
    - Users can only manage their own data
    - Public can view public profiles
*/

-- Profile Themes Table
CREATE TABLE IF NOT EXISTS profile_themes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- Theme Selection
  preset_theme text DEFAULT 'default', -- default, dark, gradient, neon, minimal, professional

  -- Colors
  background_type text DEFAULT 'solid', -- solid, gradient, image
  background_color text DEFAULT '#0F172A',
  background_gradient_start text,
  background_gradient_end text,
  background_image_url text,

  -- Button/Link Styling
  button_style text DEFAULT 'rounded', -- rounded, square, pill
  button_color text DEFAULT '#3B82F6',
  button_text_color text DEFAULT '#FFFFFF',
  button_hover_color text DEFAULT '#2563EB',

  -- Typography
  font_family text DEFAULT 'inter', -- inter, poppins, roboto, playfair, monospace
  text_color text DEFAULT '#FFFFFF',
  bio_color text DEFAULT '#94A3B8',

  -- Advanced
  custom_css text,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(profile_id)
);

-- Profile Analytics Table
CREATE TABLE IF NOT EXISTS profile_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- Event tracking
  event_type text NOT NULL, -- 'view', 'link_click', 'social_click'
  link_id uuid, -- References profile_links or social_buttons

  -- Metadata
  visitor_country text,
  visitor_city text,
  visitor_device text, -- mobile, desktop, tablet
  visitor_browser text,
  referrer_url text,

  created_at timestamptz DEFAULT now()
);

-- Create index for faster analytics queries
CREATE INDEX IF NOT EXISTS idx_profile_analytics_profile_id ON profile_analytics(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_analytics_event_type ON profile_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_profile_analytics_created_at ON profile_analytics(created_at DESC);

-- Social Buttons Table (larger icons, separate from links)
CREATE TABLE IF NOT EXISTS social_buttons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  platform text NOT NULL, -- instagram, twitter, tiktok, youtube, linkedin, etc
  url text NOT NULL,
  username text, -- Display @username
  position integer DEFAULT 0,
  is_visible boolean DEFAULT true,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Content Blocks Table (rich media)
CREATE TABLE IF NOT EXISTS content_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  block_type text NOT NULL, -- youtube, spotify, image_gallery, text, contact_form
  title text,

  -- Content
  content jsonb NOT NULL, -- Flexible structure for different block types

  position integer DEFAULT 0,
  is_visible boolean DEFAULT true,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Profile Settings Table (SEO & Advanced)
CREATE TABLE IF NOT EXISTS profile_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- SEO
  meta_title text,
  meta_description text,
  meta_keywords text[],
  og_image_url text,

  -- Branding
  favicon_url text,
  show_branding boolean DEFAULT true, -- Show "Powered by .com.rich"

  -- Features
  verified_badge boolean DEFAULT false,
  show_analytics boolean DEFAULT true,

  -- Integrations
  google_analytics_id text,
  facebook_pixel_id text,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(profile_id)
);

-- Add new fields to user_profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'theme_id'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN theme_id uuid REFERENCES profile_themes(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'total_views'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN total_views integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'verified'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN verified boolean DEFAULT false;
  END IF;
END $$;

-- Add click tracking to profile_links
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profile_links' AND column_name = 'click_count'
  ) THEN
    ALTER TABLE profile_links ADD COLUMN click_count integer DEFAULT 0;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE profile_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_buttons ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profile_themes
CREATE POLICY "Users can view own theme"
  ON profile_themes FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own theme"
  ON profile_themes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own theme"
  ON profile_themes FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own theme"
  ON profile_themes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for social_buttons
CREATE POLICY "Users can manage own social buttons"
  ON social_buttons FOR ALL
  TO authenticated
  USING (profile_id IN (
    SELECT id FROM user_profiles WHERE user_id = auth.uid()
  ))
  WITH CHECK (profile_id IN (
    SELECT id FROM user_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Public can view visible social buttons"
  ON social_buttons FOR SELECT
  TO public
  USING (
    is_visible = true AND
    profile_id IN (SELECT id FROM user_profiles WHERE is_public = true)
  );

-- RLS Policies for content_blocks
CREATE POLICY "Users can manage own content blocks"
  ON content_blocks FOR ALL
  TO authenticated
  USING (profile_id IN (
    SELECT id FROM user_profiles WHERE user_id = auth.uid()
  ))
  WITH CHECK (profile_id IN (
    SELECT id FROM user_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Public can view visible content blocks"
  ON content_blocks FOR SELECT
  TO public
  USING (
    is_visible = true AND
    profile_id IN (SELECT id FROM user_profiles WHERE is_public = true)
  );

-- RLS Policies for profile_settings
CREATE POLICY "Users can manage own settings"
  ON profile_settings FOR ALL
  TO authenticated
  USING (profile_id IN (
    SELECT id FROM user_profiles WHERE user_id = auth.uid()
  ))
  WITH CHECK (profile_id IN (
    SELECT id FROM user_profiles WHERE user_id = auth.uid()
  ));

-- RLS Policies for analytics (write-only for tracking, read for owner)
CREATE POLICY "Anyone can insert analytics"
  ON profile_analytics FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can view own analytics"
  ON profile_analytics FOR SELECT
  TO authenticated
  USING (profile_id IN (
    SELECT id FROM user_profiles WHERE user_id = auth.uid()
  ));

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_profile_views(profile_uuid uuid)
RETURNS void AS $$
BEGIN
  UPDATE user_profiles
  SET total_views = total_views + 1
  WHERE id = profile_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment link clicks
CREATE OR REPLACE FUNCTION increment_link_clicks(link_uuid uuid)
RETURNS void AS $$
BEGIN
  UPDATE profile_links
  SET click_count = click_count + 1
  WHERE id = link_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
