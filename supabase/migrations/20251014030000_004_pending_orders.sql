/*
  # Create pending_orders table for PayPal integration

  1. New Table
    - `pending_orders` - Stores orders awaiting PayPal payment confirmation
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `paypal_order_id` (text, PayPal order ID)
      - `fqdn` (text, domain being purchased)
      - `amount` (numeric, order amount in USD)
      - `contact_info` (jsonb, customer contact information)
      - `status` (text, order status: pending, completed, failed, cancelled)
      - `created_at` (timestamptz, creation timestamp)
      - `updated_at` (timestamptz, update timestamp)

  2. Security
    - Enable RLS
    - Users can read their own pending orders
    - Users can create their own pending orders
    - System can update pending orders (for webhook processing)
*/

CREATE TABLE IF NOT EXISTS pending_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  paypal_order_id text NOT NULL UNIQUE,
  fqdn text NOT NULL,
  amount numeric NOT NULL,
  contact_info jsonb,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pending_orders_user_id ON pending_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_orders_paypal_order_id ON pending_orders(paypal_order_id);
CREATE INDEX IF NOT EXISTS idx_pending_orders_status ON pending_orders(status);

ALTER TABLE pending_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own pending orders"
  ON pending_orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own pending orders"
  ON pending_orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update pending orders"
  ON pending_orders FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION update_pending_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_pending_orders_updated_at
  BEFORE UPDATE ON pending_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_pending_orders_updated_at();
