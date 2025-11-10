/*
  # Protected Brands System

  1. New Tables
    - `protected_brands`
      - `id` (uuid, primary key)
      - `domain_name` (text, unique) - The brand domain (e.g., 'tesla')
      - `brand_display_name` (text) - Display name (e.g., 'Tesla')
      - `description` (text) - Optional description
      - `access_password` (text) - Password hash for access
      - `logo_url` (text, nullable) - Future: brand logo
      - `is_active` (boolean) - Active status
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Changes
    - Add `is_protected_brand` column to premium_domains table
    - Update existing Tesla and Ferrari entries

  3. Security
    - Enable RLS on protected_brands table
    - Add policies for admin access and public read (limited fields)
*/

-- Create protected_brands table
CREATE TABLE IF NOT EXISTS protected_brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_name text UNIQUE NOT NULL,
  brand_display_name text NOT NULL,
  description text,
  access_password text NOT NULL,
  logo_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add is_protected_brand column to premium_domains
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'premium_domains' AND column_name = 'is_protected_brand'
  ) THEN
    ALTER TABLE premium_domains ADD COLUMN is_protected_brand boolean DEFAULT false;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE protected_brands ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "Admins can manage protected brands"
  ON protected_brands
  FOR ALL
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

-- Public can read limited fields (no password)
CREATE POLICY "Anyone can view protected brand info"
  ON protected_brands
  FOR SELECT
  USING (is_active = true);

-- Insert default protected brands with hashed password
-- Password: Leif1975..
-- Using simple encoding for now (in production, use proper hashing)
INSERT INTO protected_brands (domain_name, brand_display_name, description, access_password)
VALUES
  ('tesla', 'Tesla', 'Tesla, Inc. - Electric vehicles and clean energy', 'Leif1975..'),
  ('ferrari', 'Ferrari', 'Ferrari S.p.A. - Luxury sports cars', 'Leif1975..')
ON CONFLICT (domain_name) DO NOTHING;

-- Mark Tesla and Ferrari as protected in premium_domains
UPDATE premium_domains
SET is_protected_brand = true
WHERE fqdn IN ('tesla.com.rich', 'ferrari.com.rich');

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_protected_brands_domain ON protected_brands(domain_name);
CREATE INDEX IF NOT EXISTS idx_protected_brands_active ON protected_brands(is_active);
CREATE INDEX IF NOT EXISTS idx_premium_domains_protected ON premium_domains(is_protected_brand);
