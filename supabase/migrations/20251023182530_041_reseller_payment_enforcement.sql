/*
  # Reseller Payment Enforcement System

  1. Changes to Tables
    - Update `subscriptions` table to track overdue days
    - Add frozen commission tracking to `affiliate_commissions`
  
  2. New Columns for Subscriptions
    - `payment_status` - 'current', 'overdue', 'suspended', 'cancelled'
    - `days_overdue` - Days since payment is overdue
    - `suspension_date` - When subscription was suspended
    - `cancellation_date` - When subscription was cancelled
    - `last_payment_date` - Last successful payment
  
  3. New Columns for Affiliate Commissions
    - `payment_held` - Boolean indicating if payment is frozen
    - `held_reason` - Reason payment is held
    - `held_date` - When payment was frozen
    - `released_date` - When payment was released
    - `forfeited_date` - When commission was forfeited
  
  4. Business Rules for Resellers
    - 0-29 days overdue: Active, commissions accrue normally
    - 30-89 days overdue: Suspended, commissions FROZEN
    - 90+ days overdue: Cancelled, commissions FORFEITED, loses reseller status
  
  5. Important Notes
    - Frozen commissions can be released if reseller pays within 90 days
    - After 90 days, all frozen commissions are permanently forfeited
    - Reseller must re-purchase plan after cancellation
*/

-- Add payment tracking columns to subscriptions
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'payment_status') THEN
    ALTER TABLE subscriptions ADD COLUMN payment_status TEXT DEFAULT 'current' CHECK (payment_status IN ('current', 'overdue', 'suspended', 'cancelled'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'days_overdue') THEN
    ALTER TABLE subscriptions ADD COLUMN days_overdue INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'suspension_date') THEN
    ALTER TABLE subscriptions ADD COLUMN suspension_date TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'cancellation_date') THEN
    ALTER TABLE subscriptions ADD COLUMN cancellation_date TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'last_payment_date') THEN
    ALTER TABLE subscriptions ADD COLUMN last_payment_date DATE;
  END IF;
END $$;

-- Add commission hold tracking columns
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'affiliate_commissions' AND column_name = 'payment_held') THEN
    ALTER TABLE affiliate_commissions ADD COLUMN payment_held BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'affiliate_commissions' AND column_name = 'held_reason') THEN
    ALTER TABLE affiliate_commissions ADD COLUMN held_reason TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'affiliate_commissions' AND column_name = 'held_date') THEN
    ALTER TABLE affiliate_commissions ADD COLUMN held_date TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'affiliate_commissions' AND column_name = 'released_date') THEN
    ALTER TABLE affiliate_commissions ADD COLUMN released_date TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'affiliate_commissions' AND column_name = 'forfeited_date') THEN
    ALTER TABLE affiliate_commissions ADD COLUMN forfeited_date TIMESTAMPTZ;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_payment_status ON subscriptions(payment_status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_overdue ON subscriptions(days_overdue) WHERE days_overdue > 0;
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_held ON affiliate_commissions(payment_held) WHERE payment_held = TRUE;
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_forfeited ON affiliate_commissions(forfeited_date) WHERE forfeited_date IS NOT NULL;

-- Function to calculate subscription overdue days
CREATE OR REPLACE FUNCTION calculate_subscription_overdue()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('active', 'suspended') THEN
    IF NEW.next_billing_date::date < CURRENT_DATE THEN
      NEW.days_overdue = CURRENT_DATE - NEW.next_billing_date::date;
    ELSE
      NEW.days_overdue = 0;
    END IF;

    IF NEW.days_overdue = 0 THEN
      NEW.payment_status = 'current';
      NEW.suspension_date = NULL;
    ELSIF NEW.days_overdue >= 90 THEN
      NEW.payment_status = 'cancelled';
      NEW.status = 'cancelled';
      IF NEW.cancellation_date IS NULL THEN
        NEW.cancellation_date = NOW();
      END IF;
    ELSIF NEW.days_overdue >= 30 THEN
      NEW.payment_status = 'suspended';
      IF NEW.suspension_date IS NULL THEN
        NEW.suspension_date = NOW();
      END IF;
    ELSE
      NEW.payment_status = 'overdue';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS calculate_subscription_overdue_trigger ON subscriptions;
CREATE TRIGGER calculate_subscription_overdue_trigger
  BEFORE INSERT OR UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION calculate_subscription_overdue();

-- Function to freeze commissions for overdue resellers
CREATE OR REPLACE FUNCTION freeze_overdue_reseller_commissions()
RETURNS void AS $$
BEGIN
  UPDATE affiliate_commissions ac
  SET 
    payment_held = TRUE,
    held_reason = 'Reseller subscription overdue - payment suspended',
    held_date = COALESCE(ac.held_date, NOW())
  FROM customers c
  JOIN subscriptions s ON s.user_id = c.user_id
  WHERE 
    ac.affiliate_id = c.id
    AND ac.status = 'pending'
    AND ac.payment_held = FALSE
    AND s.payment_status IN ('suspended', 'overdue')
    AND s.days_overdue >= 30
    AND c.is_reseller = TRUE;

  UPDATE affiliate_commissions ac
  SET 
    payment_held = TRUE,
    held_reason = 'Reseller subscription cancelled - commission forfeited',
    forfeited_date = NOW(),
    status = 'forfeited'
  FROM customers c
  JOIN subscriptions s ON s.user_id = c.user_id
  WHERE 
    ac.affiliate_id = c.id
    AND ac.status = 'pending'
    AND ac.forfeited_date IS NULL
    AND s.payment_status = 'cancelled'
    AND s.days_overdue >= 90
    AND c.is_reseller = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to release frozen commissions
CREATE OR REPLACE FUNCTION release_reseller_commissions(p_customer_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE affiliate_commissions
  SET 
    payment_held = FALSE,
    released_date = NOW(),
    held_reason = NULL
  WHERE 
    affiliate_id = p_customer_id
    AND payment_held = TRUE
    AND forfeited_date IS NULL
    AND status = 'pending';
END;
$$ LANGUAGE plpgsql;

-- Function to check if reseller can receive payouts
CREATE OR REPLACE FUNCTION can_receive_commission_payout(p_customer_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_payment_status TEXT;
  v_is_reseller BOOLEAN;
  v_user_id UUID;
BEGIN
  SELECT user_id, is_reseller INTO v_user_id, v_is_reseller
  FROM customers WHERE id = p_customer_id;

  IF v_is_reseller = FALSE THEN
    RETURN FALSE;
  END IF;

  SELECT payment_status INTO v_payment_status
  FROM subscriptions 
  WHERE user_id = v_user_id AND status = 'active'
  ORDER BY created_at DESC LIMIT 1;

  RETURN (v_payment_status = 'current');
END;
$$ LANGUAGE plpgsql;
