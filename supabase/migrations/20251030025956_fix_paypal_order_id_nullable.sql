/*
  # Fix PayPal Order ID Constraint

  1. Changes
    - Remove NOT NULL constraint from `paypal_order_id` column
    - This allows admin free registrations and other non-PayPal payments
    
  2. Notes
    - Admin registrations don't have PayPal orders
    - Future payment methods may not use PayPal
*/

-- Remove NOT NULL constraint from paypal_order_id
ALTER TABLE pending_orders 
ALTER COLUMN paypal_order_id DROP NOT NULL;