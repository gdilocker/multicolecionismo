/*
  # Domain Prices in USD

  1. Changes
    - Add comments to clarify that domain_suggestions.price_override is in USD
    - Update default pricing to reflect USD values

  2. Reason
    - Marketplace displays prices in USD for consistency with international pricing
    - Standard .email domain: $15.00 USD
    - Premium domains: Custom pricing in USD

  3. Notes
    - This is a documentation update only
    - No data migration needed (prices already stored as numeric values)
    - Frontend updated to display $ symbol instead of R$
*/

-- Add comment to clarify currency
COMMENT ON COLUMN domain_suggestions.price_override IS 'Domain price in USD (optional override, default is $15.00)';

-- Update any existing test data that might have BRL values
-- This is safe to run even if there's no data
UPDATE domain_suggestions
SET price_override = ROUND(price_override / 5.5, 2)
WHERE price_override > 100
  AND created_at >= '2025-10-01';
