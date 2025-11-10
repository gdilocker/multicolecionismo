/*
  # Add Domain Type Classification

  1. Changes
    - Add `domain_type` column to domains table
      - Values: 'personal' or 'business'
      - Default: 'personal'
    - This allows users to have up to 2 domains (1 personal + 1 business)

  2. Notes
    - Existing domains will default to 'personal' type
    - Frontend will enforce the 2-domain limit based on this field
*/

-- Add domain_type column to domains table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'domains' AND column_name = 'domain_type'
  ) THEN
    ALTER TABLE domains ADD COLUMN domain_type text DEFAULT 'personal' CHECK (domain_type IN ('personal', 'business'));
  END IF;
END $$;

-- Create index for faster domain type queries
CREATE INDEX IF NOT EXISTS idx_domains_customer_type ON domains(customer_id, domain_type);

-- Add comment for documentation
COMMENT ON COLUMN domains.domain_type IS 'Type of domain: personal or business. Users can have max 1 of each type.';
