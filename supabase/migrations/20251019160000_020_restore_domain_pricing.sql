/*
  # Restore Standard Domain Pricing

  1. Changes
    - Domain .email: $2.00 (test) → $15.00 (standard production price)

  2. Reason
    - The test price of $2.00 was set in migration 012 for testing purposes
    - Now we need to use the proper production pricing
    - This ensures domains are priced correctly for all customers

  3. Pricing Logic
    - Standard domains (< $10 at Dynadot): $15.00 fixed
    - Premium domains ($10-$99): Dynadot price × 1.5
    - Ultra premium ($100-$499): Dynadot price × 2.0
    - Super premium ($500+): Dynadot price × 2.5
*/

UPDATE pricing_plans
SET price_cents = 1500
WHERE code = 'domain-email' AND product_type = 'domain';
