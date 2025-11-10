/*
  # Add price visibility control to premium domains

  1. Changes
    - Add `show_price` boolean column to `premium_domains` table
    - Default is `false` (prices hidden, show "Sob Consulta")
    - When `true`, display actual price
    - Prices are always stored in database for admin/backend use

  2. Purpose
    - Allow hiding prices in public gallery (show "Sob Consulta")
    - Keep prices in database for when admin wants to expose them
    - Enable sending price information to interested buyers when ready
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'premium_domains' AND column_name = 'show_price'
  ) THEN
    ALTER TABLE premium_domains 
    ADD COLUMN show_price boolean DEFAULT false;
  END IF;
END $$;

COMMENT ON COLUMN premium_domains.show_price IS 'When false, show "Sob Consulta" in gallery. When true, display actual price.';
