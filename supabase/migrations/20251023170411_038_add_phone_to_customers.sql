/*
  # Add Phone and Country to Customers

  1. Changes
    - Add `country_code` column (e.g., 'BR', 'US', 'PT')
    - Add `phone` column for phone number without country prefix
    - Add `phone_country_prefix` column (e.g., '+55', '+1', '+351')
  
  2. Notes
    - All fields are optional to maintain backward compatibility
    - Existing records remain valid without phone data
*/

-- Add phone-related columns to customers table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'country_code'
  ) THEN
    ALTER TABLE customers ADD COLUMN country_code text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'phone'
  ) THEN
    ALTER TABLE customers ADD COLUMN phone text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'phone_country_prefix'
  ) THEN
    ALTER TABLE customers ADD COLUMN phone_country_prefix text;
  END IF;
END $$;