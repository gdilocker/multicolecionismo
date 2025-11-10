/*
  # Premium Domain Ownership System

  1. New Tables
    - `premium_domain_purchases`
      - `id` (uuid, primary key)
      - `customer_id` (uuid) - Reference to customers table
      - `domain_fqdn` (text) - Reference to premium_domains table
      - `purchase_price` (integer) - One-time purchase price paid
      - `monthly_fee` (integer) - Monthly maintenance fee (typically plan price)
      - `purchased_at` (timestamptz) - When domain was purchased
      - `next_payment_due` (date) - Next monthly payment due date
      - `last_payment_date` (date) - Last successful payment date
      - `days_overdue` (integer) - Days since payment is overdue
      - `status` (text) - 'active', 'suspended', 'cancelled', 'expired'
      - `suspension_date` (timestamptz) - When domain was suspended (if applicable)
      - `expiration_date` (timestamptz) - When domain ownership expires (if applicable)
      - `notes` (text) - Admin notes
  
  2. Business Rules
    - One-time purchase price is paid upfront
    - Monthly fee starts 30 days after purchase
    - After 30 days overdue: domain is SUSPENDED (owner can't use it)
    - After 90 days overdue: domain is EXPIRED (ownership is lost, domain returns to marketplace)
    - Email notifications at: 7 days before due, due date, 7 days overdue, 15 days overdue, 25 days overdue
  
  3. Security
    - Enable RLS on `premium_domain_purchases` table
    - Users can view their own purchases
    - Admins can view and manage all purchases
  
  4. Indexes
    - Index on customer_id for faster lookups
    - Index on domain_fqdn for checking ownership
    - Index on status for filtering
    - Index on next_payment_due for payment processing
*/

-- Create premium_domain_purchases table
CREATE TABLE IF NOT EXISTS premium_domain_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  domain_fqdn TEXT NOT NULL REFERENCES premium_domains(fqdn) ON DELETE CASCADE,
  purchase_price INTEGER NOT NULL,
  monthly_fee INTEGER NOT NULL DEFAULT 9900,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  next_payment_due DATE NOT NULL,
  last_payment_date DATE,
  days_overdue INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled', 'expired')),
  suspension_date TIMESTAMPTZ,
  expiration_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(domain_fqdn)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_premium_purchases_customer ON premium_domain_purchases(customer_id);
CREATE INDEX IF NOT EXISTS idx_premium_purchases_domain ON premium_domain_purchases(domain_fqdn);
CREATE INDEX IF NOT EXISTS idx_premium_purchases_status ON premium_domain_purchases(status);
CREATE INDEX IF NOT EXISTS idx_premium_purchases_due_date ON premium_domain_purchases(next_payment_due);
CREATE INDEX IF NOT EXISTS idx_premium_purchases_overdue ON premium_domain_purchases(days_overdue) WHERE days_overdue > 0;

-- Enable RLS
ALTER TABLE premium_domain_purchases ENABLE ROW LEVEL SECURITY;

-- Users can view their own purchases
CREATE POLICY "Users can view own premium domain purchases"
  ON premium_domain_purchases
  FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM customers WHERE user_id = auth.uid()
    )
  );

-- Admins can view all purchases
CREATE POLICY "Admins can view all premium domain purchases"
  ON premium_domain_purchases
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = auth.uid()
      AND customers.role = 'admin'
    )
  );

-- Only admins can insert purchases (done via admin panel or checkout process)
CREATE POLICY "Admins can create premium domain purchases"
  ON premium_domain_purchases
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = auth.uid()
      AND customers.role = 'admin'
    )
  );

-- Admins can update purchases
CREATE POLICY "Admins can update premium domain purchases"
  ON premium_domain_purchases
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = auth.uid()
      AND customers.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = auth.uid()
      AND customers.role = 'admin'
    )
  );

-- Admins can delete purchases
CREATE POLICY "Admins can delete premium domain purchases"
  ON premium_domain_purchases
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = auth.uid()
      AND customers.role = 'admin'
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_premium_purchases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER premium_purchases_updated_at
  BEFORE UPDATE ON premium_domain_purchases
  FOR EACH ROW
  EXECUTE FUNCTION update_premium_purchases_updated_at();

-- Function to calculate days overdue
CREATE OR REPLACE FUNCTION calculate_days_overdue()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.next_payment_due < CURRENT_DATE THEN
    NEW.days_overdue = CURRENT_DATE - NEW.next_payment_due;
  ELSE
    NEW.days_overdue = 0;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_overdue_days
  BEFORE INSERT OR UPDATE ON premium_domain_purchases
  FOR EACH ROW
  EXECUTE FUNCTION calculate_days_overdue();

-- Function to auto-suspend domains after 30 days overdue
CREATE OR REPLACE FUNCTION auto_suspend_overdue_domains()
RETURNS void AS $$
BEGIN
  UPDATE premium_domain_purchases
  SET 
    status = 'suspended',
    suspension_date = NOW()
  WHERE 
    status = 'active'
    AND days_overdue >= 30
    AND suspension_date IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-expire domains after 90 days overdue
CREATE OR REPLACE FUNCTION auto_expire_overdue_domains()
RETURNS void AS $$
BEGIN
  -- Expire domains and return them to marketplace
  UPDATE premium_domain_purchases
  SET 
    status = 'expired',
    expiration_date = NOW()
  WHERE 
    status IN ('active', 'suspended')
    AND days_overdue >= 90
    AND expiration_date IS NULL;

  -- Mark domains as available in marketplace
  UPDATE premium_domains
  SET status = 'available'
  WHERE fqdn IN (
    SELECT domain_fqdn
    FROM premium_domain_purchases
    WHERE status = 'expired'
    AND expiration_date > NOW() - INTERVAL '1 minute'
  );
END;
$$ LANGUAGE plpgsql;

-- Create payment history table for tracking all payments
CREATE TABLE IF NOT EXISTS premium_payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES premium_domain_purchases(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('initial_purchase', 'monthly_fee', 'late_fee', 'refund')),
  payment_method TEXT,
  payment_status TEXT NOT NULL DEFAULT 'completed' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  transaction_id TEXT,
  paid_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for payment history
CREATE INDEX IF NOT EXISTS idx_premium_payment_history_purchase ON premium_payment_history(purchase_id);
CREATE INDEX IF NOT EXISTS idx_premium_payment_history_date ON premium_payment_history(paid_at);
CREATE INDEX IF NOT EXISTS idx_premium_payment_history_type ON premium_payment_history(payment_type);

-- Enable RLS on payment history
ALTER TABLE premium_payment_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own payment history
CREATE POLICY "Users can view own premium payment history"
  ON premium_payment_history
  FOR SELECT
  TO authenticated
  USING (
    purchase_id IN (
      SELECT id FROM premium_domain_purchases
      WHERE customer_id IN (
        SELECT id FROM customers WHERE user_id = auth.uid()
      )
    )
  );

-- Admins can view all payment history
CREATE POLICY "Admins can view all premium payment history"
  ON premium_payment_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = auth.uid()
      AND customers.role = 'admin'
    )
  );

-- Only admins can manage payment history
CREATE POLICY "Admins can manage premium payment history"
  ON premium_payment_history
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = auth.uid()
      AND customers.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = auth.uid()
      AND customers.role = 'admin'
    )
  );
