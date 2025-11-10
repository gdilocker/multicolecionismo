/*
  # Domain Suggestions System

  1. New Tables
    - `domain_suggestions`
      - `id` (uuid, primary key)
      - `domain_name` (text, unique) - domain without .email extension
      - `category` (text) - category like 'names', 'business', 'professional', etc
      - `price_override` (numeric, nullable) - optional custom price, otherwise uses default
      - `status` (text) - 'available', 'sold', 'reserved'
      - `is_premium` (boolean) - whether this is a premium domain
      - `popularity_score` (integer) - for sorting/ranking
      - `last_availability_check` (timestamptz) - last time we checked if available
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `created_by` (uuid, foreign key to auth.users)

  2. Security
    - Enable RLS on `domain_suggestions` table
    - Public can read available suggestions
    - Only admins can create, update, delete suggestions

  3. Indexes
    - Index on category for filtering
    - Index on status for quick queries
    - Index on domain_name for search
*/

-- Create domain_suggestions table
CREATE TABLE IF NOT EXISTS domain_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_name text UNIQUE NOT NULL,
  category text NOT NULL DEFAULT 'general',
  price_override numeric(10,2),
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'sold', 'reserved')),
  is_premium boolean DEFAULT false,
  popularity_score integer DEFAULT 0,
  last_availability_check timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE domain_suggestions ENABLE ROW LEVEL SECURITY;

-- Public can read available suggestions
CREATE POLICY "Anyone can view available domain suggestions"
  ON domain_suggestions
  FOR SELECT
  USING (status = 'available' OR auth.role() = 'authenticated');

-- Only admins can insert suggestions
CREATE POLICY "Only admins can create domain suggestions"
  ON domain_suggestions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Only admins can update suggestions
CREATE POLICY "Only admins can update domain suggestions"
  ON domain_suggestions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Only admins can delete suggestions
CREATE POLICY "Only admins can delete domain suggestions"
  ON domain_suggestions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_domain_suggestions_category ON domain_suggestions(category);
CREATE INDEX IF NOT EXISTS idx_domain_suggestions_status ON domain_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_domain_suggestions_domain_name ON domain_suggestions(domain_name);
CREATE INDEX IF NOT EXISTS idx_domain_suggestions_popularity ON domain_suggestions(popularity_score DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_domain_suggestions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER domain_suggestions_updated_at
  BEFORE UPDATE ON domain_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION update_domain_suggestions_updated_at();
