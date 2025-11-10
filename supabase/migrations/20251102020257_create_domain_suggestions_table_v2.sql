/*
  # Create Domain Suggestions Table

  1. New Tables
    - `domain_suggestions`
      - `id` (uuid, primary key)
      - `domain_name` (text, unique)
      - `category` (text)
      - `price_override` (numeric, nullable)
      - `status` (text) - 'available', 'sold', 'reserved'
      - `is_premium` (boolean)
      - `popularity_score` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Public can read available suggestions
    - Only admins can create, update, delete suggestions
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
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE domain_suggestions ENABLE ROW LEVEL SECURITY;

-- Public can read available suggestions, authenticated users can read all
CREATE POLICY "Anyone can view domain suggestions"
  ON domain_suggestions
  FOR SELECT
  USING (
    status = 'available' 
    OR auth.uid() IS NOT NULL
  );

-- Only admins can insert suggestions
CREATE POLICY "Admins can create domain suggestions"
  ON domain_suggestions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Only admins can update suggestions
CREATE POLICY "Admins can update domain suggestions"
  ON domain_suggestions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Only admins can delete suggestions
CREATE POLICY "Admins can delete domain suggestions"
  ON domain_suggestions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE user_id = auth.uid()
      AND role = 'admin'
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER domain_suggestions_updated_at
  BEFORE UPDATE ON domain_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION update_domain_suggestions_updated_at();
