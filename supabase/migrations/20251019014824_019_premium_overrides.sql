/*
  # Premium Domain Price Overrides

  1. New Tables
    - `premium_overrides`
      - `id` (uuid, primary key)
      - `domain` (text, unique) - Full domain name (e.g., "api.email")
      - `registrar_cost_usd` (numeric) - Override cost in USD
      - `renewal_cost_usd` (numeric) - Override renewal cost in USD
      - `is_active` (boolean) - Whether override is active
      - `notes` (text) - Admin notes about the override
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `premium_overrides` table
    - Add policy for public read access (for domain search)
    - Add policy for admin write access only

  3. Data
    - Insert override for api.email ($1000 base cost)

  ## Purpose
  This table allows manual override of premium domain pricing when the registrar
  doesn't provide pricing information for unavailable premium domains.
*/

-- Create premium_overrides table
CREATE TABLE IF NOT EXISTS premium_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text UNIQUE NOT NULL,
  registrar_cost_usd numeric(10, 2) NOT NULL,
  renewal_cost_usd numeric(10, 2) NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE premium_overrides ENABLE ROW LEVEL SECURITY;

-- Public can read active overrides (for domain search)
CREATE POLICY "Anyone can view active premium overrides"
  ON premium_overrides
  FOR SELECT
  USING (is_active = true);

-- Only admins can insert overrides
CREATE POLICY "Admins can insert premium overrides"
  ON premium_overrides
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = auth.uid()
      AND customers.role = 'admin'
    )
  );

-- Only admins can update overrides
CREATE POLICY "Admins can update premium overrides"
  ON premium_overrides
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

-- Only admins can delete overrides
CREATE POLICY "Admins can delete premium overrides"
  ON premium_overrides
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = auth.uid()
      AND customers.role = 'admin'
    )
  );

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_premium_overrides_domain 
  ON premium_overrides(domain) 
  WHERE is_active = true;

-- Insert api.email override
INSERT INTO premium_overrides (domain, registrar_cost_usd, renewal_cost_usd, notes)
VALUES (
  'api.email',
  1000.00,
  1000.00,
  'Ultra-premium 3-letter domain - manually set override'
)
ON CONFLICT (domain) DO NOTHING;

-- Create updated_at trigger function if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column'
  ) THEN
    CREATE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $func$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;
  END IF;
END $$;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_premium_overrides_updated_at ON premium_overrides;
CREATE TRIGGER update_premium_overrides_updated_at
  BEFORE UPDATE ON premium_overrides
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();