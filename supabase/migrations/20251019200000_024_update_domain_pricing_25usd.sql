/*
  # Update Domain Pricing to $25/year

  1. Changes
    - Update default .email domain pricing from $15 to $25 per year
    - Set renewal price to $50 per year
    - Update pricing_plans table if domain product exists
    - Update documentation to reflect new pricing structure

  2. Pricing Structure
    - Registration: $25.00 USD per year
    - Renewal: $50.00 USD per year
    - Premium domains: Custom pricing (unchanged)

  3. Notes
    - This migration updates the base pricing for standard .email domains
    - Premium domain pricing remains custom and unchanged
    - Email plans remain unchanged (monthly billing)
*/

-- Update pricing_plans table for domain product
UPDATE pricing_plans
SET
  price_cents = 2500,
  description = 'Registro de domínio .email por 1 ano - Renovação: $50/ano'
WHERE product_type = 'domain' AND code = 'domain_annual';

-- Update any existing domain suggestions with default pricing
UPDATE domain_suggestions
SET price_override = 25.00
WHERE price_override = 15.00
  AND status = 'available';

-- Add comment to document new pricing
COMMENT ON TABLE domain_suggestions IS 'Domain marketplace with pricing: Standard $25/year (renewal $50/year), Premium custom pricing in USD';
