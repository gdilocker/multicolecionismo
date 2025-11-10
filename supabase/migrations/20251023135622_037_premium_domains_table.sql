/*
  # Create Premium Domains Table

  1. New Tables
    - `premium_domains`
      - `fqdn` (text, primary key) - Fully qualified domain name (e.g., 'lux.com.rich')
      - `created_at` (timestamp) - When the premium domain was added
  
  2. Security
    - Enable RLS on `premium_domains` table
    - Add policy for public read access (anyone can check if a domain is premium)
    - Add policy for admin insert/update/delete
  
  3. Initial Data
    - Add sample premium domains for testing
*/

-- Create premium_domains table
CREATE TABLE IF NOT EXISTS premium_domains (
  fqdn TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE premium_domains ENABLE ROW LEVEL SECURITY;

-- Public can read premium domains list
CREATE POLICY "Anyone can view premium domains"
  ON premium_domains
  FOR SELECT
  TO public
  USING (true);

-- Only admins can manage premium domains
CREATE POLICY "Admins can insert premium domains"
  ON premium_domains
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = auth.uid()
      AND customers.role = 'admin'
    )
  );

CREATE POLICY "Admins can update premium domains"
  ON premium_domains
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = auth.uid()
      AND customers.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = auth.uid()
      AND customers.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete premium domains"
  ON premium_domains
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = auth.uid()
      AND customers.role = 'admin'
    )
  );

-- Insert sample premium domains
INSERT INTO premium_domains (fqdn) VALUES
  ('lux.com.rich'),
  ('vip.com.rich'),
  ('elite.com.rich'),
  ('premium.com.rich'),
  ('gold.com.rich'),
  ('platinum.com.rich'),
  ('diamond.com.rich'),
  ('luxury.com.rich'),
  ('exclusive.com.rich'),
  ('royal.com.rich')
ON CONFLICT (fqdn) DO NOTHING;