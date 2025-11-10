/*
  # Fix All Pending Orders Constraints - FINAL

  1. Changes
    - Make `amount` column nullable (for admin free registrations)
    - Set default value of 0 for `amount`
    - Ensure `paypal_order_id` is nullable (already done but double-checking)
    
  2. Notes
    - Admin registrations have amount = 0, no PayPal order
    - Dev mode registrations also don't have PayPal orders
    - This allows all registration types to work correctly
*/

-- Make amount nullable and set default
ALTER TABLE pending_orders 
ALTER COLUMN amount DROP NOT NULL,
ALTER COLUMN amount SET DEFAULT 0;

-- Ensure paypal_order_id is nullable (idempotent)
ALTER TABLE pending_orders 
ALTER COLUMN paypal_order_id DROP NOT NULL;