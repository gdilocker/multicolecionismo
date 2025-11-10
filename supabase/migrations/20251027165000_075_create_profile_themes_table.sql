/*
  # Create Profile Themes Table

  1. New Table
    - `profile_themes` - Store custom theme configurations for user profiles
      - `id` (uuid, primary key)
      - `profile_id` (uuid, foreign key to user_profiles)
      - `preset_theme` (text) - Theme preset name
      - `button_color` (text) - Button background color
      - `button_text_color` (text) - Button text color
      - `button_style` (text) - Button border radius style
      - `font_family` (text) - Font family
      - `text_color` (text) - Profile name text color
      - `bio_color` (text) - Bio text color
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Policies for users to manage their own profile themes
*/

-- Create profile_themes table
CREATE TABLE IF NOT EXISTS public.profile_themes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  preset_theme text NOT NULL DEFAULT 'default',
  button_color text NOT NULL DEFAULT '#3B82F6',
  button_text_color text NOT NULL DEFAULT '#FFFFFF',
  button_style text NOT NULL DEFAULT 'rounded',
  font_family text NOT NULL DEFAULT 'inter',
  text_color text NOT NULL DEFAULT '#FFFFFF',
  bio_color text NOT NULL DEFAULT '#94A3B8',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(profile_id)
);

-- Create index on profile_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_profile_themes_profile_id ON public.profile_themes(profile_id);

-- Enable RLS
ALTER TABLE public.profile_themes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile themes
CREATE POLICY "Users can view own profile themes"
  ON public.profile_themes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = profile_themes.profile_id
      AND user_profiles.user_id = (select auth.uid())
    )
  );

-- Policy: Anyone can view public profile themes
CREATE POLICY "Anyone can view public profile themes"
  ON public.profile_themes FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = profile_themes.profile_id
      AND user_profiles.is_public = true
    )
  );

-- Policy: Users can insert their own profile themes
CREATE POLICY "Users can insert own profile themes"
  ON public.profile_themes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = profile_themes.profile_id
      AND user_profiles.user_id = (select auth.uid())
    )
  );

-- Policy: Users can update their own profile themes
CREATE POLICY "Users can update own profile themes"
  ON public.profile_themes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = profile_themes.profile_id
      AND user_profiles.user_id = (select auth.uid())
    )
  );

-- Policy: Users can delete their own profile themes
CREATE POLICY "Users can delete own profile themes"
  ON public.profile_themes FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = profile_themes.profile_id
      AND user_profiles.user_id = (select auth.uid())
    )
  );

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_profile_themes_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profile_themes_updated_at
  BEFORE UPDATE ON public.profile_themes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profile_themes_updated_at();
