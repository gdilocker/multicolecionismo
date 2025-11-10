/*
  # Dynamic Pricing System for Premium Domains

  1. New Tables
    - `pricing_rules`
      - `id` (uuid, primary key)
      - `rule_type` (text) - Type of rule: 'standard', 'premium', 'super_premium'
      - `min_price` (numeric) - Minimum USD price to apply this rule
      - `max_price` (numeric) - Maximum USD price (null = no limit)
      - `markup_percentage` (numeric) - Markup to apply (50 = 1.5x, 100 = 2x)
      - `is_active` (boolean) - Whether this rule is active
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `currency_rates`
      - `id` (uuid, primary key)
      - `currency_code` (text) - Currency code (BRL, USD, EUR, etc.)
      - `rate_to_usd` (numeric) - Exchange rate to USD
      - `last_updated` (timestamptz)
      - `source` (text) - Source of exchange rate

  2. Changes
    - Add `registrar_cost_usd` column to `domains` table
    - Add `is_premium` column to `domains` table
    - Add `renewal_price_usd` column to `domains` table

  3. Security
    - Enable RLS on both tables
    - Admin-only access for pricing_rules
    - Public read access for currency_rates

  4. Initial Data
    - Default pricing rules for standard, premium, and super premium domains
    - Initial BRL exchange rate
*/

-- Create pricing_rules table
CREATE TABLE IF NOT EXISTS pricing_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_type text NOT NULL CHECK (rule_type IN ('standard', 'premium', 'super_premium')),
  min_price numeric NOT NULL DEFAULT 0 CHECK (min_price >= 0),
  max_price numeric CHECK (max_price IS NULL OR max_price > min_price),
  markup_percentage numeric NOT NULL CHECK (markup_percentage >= 0),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create currency_rates table
CREATE TABLE IF NOT EXISTS currency_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  currency_code text NOT NULL UNIQUE,
  rate_to_usd numeric NOT NULL CHECK (rate_to_usd > 0),
  last_updated timestamptz DEFAULT now(),
  source text DEFAULT 'manual'
);

-- Add columns to domains table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'domains' AND column_name = 'registrar_cost_usd'
  ) THEN
    ALTER TABLE domains ADD COLUMN registrar_cost_usd numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'domains' AND column_name = 'is_premium'
  ) THEN
    ALTER TABLE domains ADD COLUMN is_premium boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'domains' AND column_name = 'renewal_price_usd'
  ) THEN
    ALTER TABLE domains ADD COLUMN renewal_price_usd numeric;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE currency_rates ENABLE ROW LEVEL SECURITY;

-- Policies for pricing_rules (admin only)
CREATE POLICY "Admins can view pricing rules"
  ON pricing_rules FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = auth.uid()
      AND customers.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert pricing rules"
  ON pricing_rules FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = auth.uid()
      AND customers.role = 'admin'
    )
  );

CREATE POLICY "Admins can update pricing rules"
  ON pricing_rules FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = auth.uid()
      AND customers.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete pricing rules"
  ON pricing_rules FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = auth.uid()
      AND customers.role = 'admin'
    )
  );

-- Policies for currency_rates (public read, admin write)
CREATE POLICY "Anyone can view currency rates"
  ON currency_rates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert currency rates"
  ON currency_rates FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = auth.uid()
      AND customers.role = 'admin'
    )
  );

CREATE POLICY "Admins can update currency rates"
  ON currency_rates FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = auth.uid()
      AND customers.role = 'admin'
    )
  );

-- Insert default pricing rules
INSERT INTO pricing_rules (rule_type, min_price, max_price, markup_percentage, is_active)
VALUES
  ('standard', 0, 50, 50, true),           -- Up to $50: add 50% markup (1.5x)
  ('premium', 50, 500, 100, true),         -- $50-500: add 100% markup (2x)
  ('super_premium', 500, NULL, 150, true)  -- $500+: add 150% markup (2.5x)
ON CONFLICT DO NOTHING;

-- Insert initial BRL exchange rate (approximate)
INSERT INTO currency_rates (currency_code, rate_to_usd, source)
VALUES ('BRL', 5.50, 'manual')
ON CONFLICT (currency_code)
DO UPDATE SET rate_to_usd = 5.50, last_updated = now();

-- Create function to get applicable markup
CREATE OR REPLACE FUNCTION get_markup_for_price(price_usd numeric)
RETURNS numeric
LANGUAGE plpgsql
AS $$
DECLARE
  markup numeric;
BEGIN
  SELECT markup_percentage INTO markup
  FROM pricing_rules
  WHERE is_active = true
    AND min_price <= price_usd
    AND (max_price IS NULL OR price_usd < max_price)
  ORDER BY min_price DESC
  LIMIT 1;

  RETURN COALESCE(markup, 50); -- Default 50% if no rule found
END;
$$;

-- Create function to convert USD to BRL
CREATE OR REPLACE FUNCTION convert_usd_to_brl(amount_usd numeric)
RETURNS numeric
LANGUAGE plpgsql
AS $$
DECLARE
  rate numeric;
BEGIN
  SELECT rate_to_usd INTO rate
  FROM currency_rates
  WHERE currency_code = 'BRL'
  LIMIT 1;

  RETURN amount_usd * COALESCE(rate, 5.50); -- Default rate if not found
END;
$$;

-- Create updated_at trigger for pricing_rules
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pricing_rules_updated_at
  BEFORE UPDATE ON pricing_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
