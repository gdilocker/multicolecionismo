/*
  # Sistema de Links Personalizados

  1. Nova Tabela
    - `profile_links`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `profile_id` (uuid, foreign key to user_profiles)
      - `title` (text, 1-60 caracteres)
      - `url` (text, validação http/https/mailto/tel)
      - `icon` (text, opcional, nome do ícone)
      - `style` (jsonb, armazena bgColor, textColor, borderColor, radius, shadow, opacity)
      - `is_active` (boolean, default true)
      - `sort_order` (integer, para drag-and-drop)
      - `clicks` (integer, default 0, preparado para analytics futuros)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `profile_links` table
    - Add policies for users to manage their own links
    - Add policy for public read of active links

  3. Indexes
    - Index on profile_id for fast lookups
    - Index on sort_order for ordering
    - Index on is_active for filtering
*/

-- Create profile_links table
CREATE TABLE IF NOT EXISTS profile_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 60),
  url text NOT NULL CHECK (
    url ~* '^https?://.+' OR
    url ~* '^mailto:.+' OR
    url ~* '^tel:\+?[0-9\s\-\(\)]+$'
  ),
  icon text DEFAULT 'link',
  style jsonb NOT NULL DEFAULT '{
    "bgColor": "#3B82F6",
    "textColor": "#FFFFFF",
    "borderColor": null,
    "radius": 16,
    "shadow": true,
    "opacity": 1.0
  }'::jsonb,
  is_active boolean DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  clicks integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profile_links_profile_id ON profile_links(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_links_sort_order ON profile_links(profile_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_profile_links_active ON profile_links(profile_id, is_active);
CREATE INDEX IF NOT EXISTS idx_profile_links_user_id ON profile_links(user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_profile_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_update_profile_links_updated_at ON profile_links;
CREATE TRIGGER trigger_update_profile_links_updated_at
  BEFORE UPDATE ON profile_links
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_links_updated_at();

-- Enable Row Level Security
ALTER TABLE profile_links ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own links
CREATE POLICY "Users can view own links"
  ON profile_links
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own links (max 50 per profile)
CREATE POLICY "Users can insert own links"
  ON profile_links
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    (SELECT COUNT(*) FROM profile_links WHERE profile_id = profile_links.profile_id) < 50
  );

-- Policy: Users can update their own links
CREATE POLICY "Users can update own links"
  ON profile_links
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own links
CREATE POLICY "Users can delete own links"
  ON profile_links
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Public can view active links for public profiles
CREATE POLICY "Public can view active links"
  ON profile_links
  FOR SELECT
  TO public
  USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = profile_links.profile_id
      AND user_profiles.is_active = true
    )
  );

-- Function to increment click count (prepared for future analytics)
CREATE OR REPLACE FUNCTION increment_link_clicks(link_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE profile_links
  SET clicks = clicks + 1
  WHERE id = link_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION increment_link_clicks(uuid) TO public;