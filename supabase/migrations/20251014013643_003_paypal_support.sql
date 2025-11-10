/*
  # Add PayPal Support

  1. Changes
    - Add paypal_order_id column to orders table
    - Create pending_orders table to track orders before payment completion
    - Add indexes for better query performance

  2. New Tables
    - `pending_orders`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `paypal_order_id` (text, unique)
      - `fqdn` (text)
      - `amount` (numeric)
      - `contact_info` (jsonb)
      - `status` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  3. Security
    - Enable RLS on pending_orders table
    - Add policies for authenticated users to manage their pending orders
*/

-- Add PayPal column to orders table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'paypal_order_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN paypal_order_id text;
  END IF;
END $$;

-- Add payment_method column to orders table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_method text DEFAULT 'paypal';
  END IF;
END $$;

-- Create pending_orders table
CREATE TABLE IF NOT EXISTS pending_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  paypal_order_id text UNIQUE NOT NULL,
  fqdn text NOT NULL,
  amount numeric NOT NULL,
  contact_info jsonb,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE pending_orders ENABLE ROW LEVEL SECURITY;

-- Policies for pending_orders
CREATE POLICY "Users can view own pending orders"
  ON pending_orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pending orders"
  ON pending_orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending orders"
  ON pending_orders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own pending orders"
  ON pending_orders FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pending_orders_user_id ON pending_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_orders_paypal_order_id ON pending_orders(paypal_order_id);
CREATE INDEX IF NOT EXISTS idx_pending_orders_status ON pending_orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_paypal_order_id ON orders(paypal_order_id);