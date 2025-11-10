/*
  # Add Admin Registration Fields to Pending Orders

  1. Changes
    - Add `payment_method` column (text) to track payment type (admin_free, paypal, etc.)
    - Add `plan_code` column (text) to track plan used
    - Add `total_cents` column (integer) to track total amount in cents
    
  2. Notes
    - These fields are needed for admin free registration
    - Existing orders will have NULL values which is acceptable
*/

-- Add payment_method column
ALTER TABLE pending_orders 
ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- Add plan_code column
ALTER TABLE pending_orders 
ADD COLUMN IF NOT EXISTS plan_code TEXT;

-- Add total_cents column
ALTER TABLE pending_orders 
ADD COLUMN IF NOT EXISTS total_cents INTEGER;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_pending_orders_payment_method ON pending_orders(payment_method);
CREATE INDEX IF NOT EXISTS idx_pending_orders_plan_code ON pending_orders(plan_code);