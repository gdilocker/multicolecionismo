/*
  # Enhance Premium Domains Table

  1. Changes
    - Add `price_usd` column (integer) - Price in USD
    - Add `category` column (text) - Domain category (lifestyle, finance, real-estate, etc.)
    - Add `is_featured` column (boolean) - Whether domain is featured
    - Add `description` column (text) - Domain description
    - Add `status` column (text) - Domain status (available, sold, reserved)
  
  2. Notes
    - Existing domains will have NULL values for new columns
    - Default status is 'available'
    - Prices are stored in USD cents for precision
*/

-- Add new columns to premium_domains
ALTER TABLE premium_domains
  ADD COLUMN IF NOT EXISTS price_usd INTEGER DEFAULT 25000,
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'lifestyle',
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'available';

-- Add index for faster filtering
CREATE INDEX IF NOT EXISTS idx_premium_domains_category ON premium_domains(category);
CREATE INDEX IF NOT EXISTS idx_premium_domains_featured ON premium_domains(is_featured);
CREATE INDEX IF NOT EXISTS idx_premium_domains_status ON premium_domains(status);
