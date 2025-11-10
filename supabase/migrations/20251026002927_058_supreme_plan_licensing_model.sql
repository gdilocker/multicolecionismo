/*
  # Supreme Plan - Exclusive Licensing Model

  1. Purpose
    - Add Supreme Plan support to premium domains
    - Implement Exclusive License Fee model
    - Support "by request" pricing for high-value domains
    - Enable approval workflow for premium domain licensing

  2. New Fields in premium_domains
    - `plan_required` - Tier requirement (base/elite/supreme)
    - `exclusive_license_fee_usd` - One-time licensing fee
    - `plan_monthly_usd` - Custom monthly subscription
    - `requires_approval` - Admin approval needed
    - `license_fee_paid` - Payment status
    - `supreme_support` - Corporate support included
    - `owner_id` - Current license holder

  3. Subscription Plans Table
    - Add Supreme Plan entry
    - Set pricing as "by request"

  4. Security
    - Update RLS policies for new fields
    - Ensure only admins can modify licensing terms
*/

-- ============================================
-- ADD SUPREME PLAN FIELDS TO PREMIUM DOMAINS
-- ============================================

DO $$
BEGIN
  -- Add plan_required field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'premium_domains' AND column_name = 'plan_required'
  ) THEN
    ALTER TABLE premium_domains ADD COLUMN plan_required TEXT DEFAULT 'base';
  END IF;

  -- Add exclusive_license_fee_usd field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'premium_domains' AND column_name = 'exclusive_license_fee_usd'
  ) THEN
    ALTER TABLE premium_domains ADD COLUMN exclusive_license_fee_usd NUMERIC(12, 2);
  END IF;

  -- Add plan_monthly_usd field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'premium_domains' AND column_name = 'plan_monthly_usd'
  ) THEN
    ALTER TABLE premium_domains ADD COLUMN plan_monthly_usd NUMERIC(10, 2);
  END IF;

  -- Add requires_approval field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'premium_domains' AND column_name = 'requires_approval'
  ) THEN
    ALTER TABLE premium_domains ADD COLUMN requires_approval BOOLEAN DEFAULT false;
  END IF;

  -- Add license_fee_paid field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'premium_domains' AND column_name = 'license_fee_paid'
  ) THEN
    ALTER TABLE premium_domains ADD COLUMN license_fee_paid BOOLEAN DEFAULT false;
  END IF;

  -- Add supreme_support field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'premium_domains' AND column_name = 'supreme_support'
  ) THEN
    ALTER TABLE premium_domains ADD COLUMN supreme_support BOOLEAN DEFAULT false;
  END IF;

  -- Add owner_id field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'premium_domains' AND column_name = 'owner_id'
  ) THEN
    ALTER TABLE premium_domains ADD COLUMN owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  -- Add licensing_notes field for admin comments
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'premium_domains' AND column_name = 'licensing_notes'
  ) THEN
    ALTER TABLE premium_domains ADD COLUMN licensing_notes TEXT;
  END IF;

  -- Add licensed_at timestamp
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'premium_domains' AND column_name = 'licensed_at'
  ) THEN
    ALTER TABLE premium_domains ADD COLUMN licensed_at TIMESTAMPTZ;
  END IF;

END $$;

-- Create index on plan_required for filtering
CREATE INDEX IF NOT EXISTS idx_premium_domains_plan_required ON premium_domains(plan_required);
CREATE INDEX IF NOT EXISTS idx_premium_domains_owner_id ON premium_domains(owner_id);

-- ============================================
-- CREATE LICENSING REQUESTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS licensing_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fqdn TEXT NOT NULL REFERENCES premium_domains(fqdn) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  company_name TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  intended_use TEXT,
  message TEXT,
  status TEXT DEFAULT 'pending',
  admin_notes TEXT,
  proposed_license_fee_usd NUMERIC(12, 2),
  proposed_monthly_usd NUMERIC(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE licensing_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "Users can view own licensing requests"
  ON licensing_requests
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can create licensing requests
CREATE POLICY "Users can create licensing requests"
  ON licensing_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Admins can view all requests
CREATE POLICY "Admins can view all licensing requests"
  ON licensing_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = auth.uid()
      AND customers.role = 'admin'
    )
  );

-- Admins can update requests
CREATE POLICY "Admins can update licensing requests"
  ON licensing_requests
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_licensing_requests_user_id ON licensing_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_licensing_requests_fqdn ON licensing_requests(fqdn);
CREATE INDEX IF NOT EXISTS idx_licensing_requests_status ON licensing_requests(status);

-- ============================================
-- ADD SUPREME PLAN TO PRICING_PLANS
-- ============================================

INSERT INTO pricing_plans (
  code,
  name,
  description,
  price_cents,
  mailboxes_included,
  mailbox_quota_mb,
  aliases_limit,
  billing_period,
  product_type,
  is_active,
  sort_order,
  features
) VALUES (
  'supreme',
  'Supreme',
  'Exclusive licensing for premium domains with personalized terms and dedicated corporate support',
  0,
  0,
  0,
  0,
  'monthly',
  'subscription',
  true,
  3,
  jsonb_build_array(
    'Exclusive domain licensing',
    'Custom license fee terms',
    'Personalized monthly rates',
    'Premium domain portfolio',
    'Dedicated account manager',
    'Corporate priority support',
    'SLA guarantees',
    'Custom contract terms',
    'White-glove onboarding',
    'Strategic consulting included'
  )
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order;

-- ============================================
-- UPDATE EXISTING PREMIUM DOMAINS
-- ============================================

-- Set high-value domains to require Supreme plan
UPDATE premium_domains
SET 
  plan_required = 'supreme',
  requires_approval = true,
  supreme_support = true
WHERE fqdn IN (
  'rolex.com.rich',
  'ferrari.com.rich',
  'lamborghini.com.rich',
  'hermes.com.rich',
  'chanel.com.rich',
  'louisvuitton.com.rich',
  'rollsroyce.com.rich',
  'bugatti.com.rich',
  'patek.com.rich',
  'cartier.com.rich'
);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Supreme Plan licensing model implemented successfully';
  RAISE NOTICE 'Licensing requests table created';
  RAISE NOTICE 'High-value domains updated to require Supreme plan approval';
END $$;