/*
  # Premium Domains Require Elite Plan

  This migration enforces that premium domains can only be purchased and maintained
  by users with active Elite subscriptions. It also adds automatic blocking when
  Elite subscription is cancelled.

  ## Changes

  1. Updates
    - Add `subscription_id` to `premium_domain_purchases` to track Elite subscription
    - Auto-suspend domains when Elite subscription is cancelled/expired

  2. Functions
    - `check_elite_subscription_for_premium()` - Validates Elite subscription on purchase
    - `auto_suspend_on_elite_cancel()` - Suspends domains when Elite is cancelled

  3. Triggers
    - Prevent purchase without Elite subscription
    - Auto-suspend domains when subscription changes to non-active

  4. Security
    - Ensure only Elite members can purchase premium domains
    - Automatically protect premium domains when subscription lapses
*/

-- Add subscription_id to track which Elite subscription is linked
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'premium_domain_purchases'
    AND column_name = 'subscription_id'
  ) THEN
    ALTER TABLE premium_domain_purchases
    ADD COLUMN subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_premium_purchases_subscription
  ON premium_domain_purchases(subscription_id);

-- Function to validate Elite subscription before purchase
CREATE OR REPLACE FUNCTION check_elite_subscription_for_premium()
RETURNS TRIGGER AS $$
DECLARE
  v_plan_type TEXT;
  v_subscription_status TEXT;
BEGIN
  -- Get subscription details
  SELECT
    sp.plan_type,
    s.status
  INTO
    v_plan_type,
    v_subscription_status
  FROM subscriptions s
  JOIN subscription_plans sp ON s.plan_id = sp.id
  WHERE s.id = NEW.subscription_id;

  -- Check if subscription exists and is Elite
  IF v_plan_type IS NULL THEN
    RAISE EXCEPTION 'Subscription not found for premium domain purchase';
  END IF;

  IF v_plan_type != 'elite' THEN
    RAISE EXCEPTION 'Premium domains require an active Elite subscription';
  END IF;

  IF v_subscription_status != 'active' THEN
    RAISE EXCEPTION 'Elite subscription must be active to purchase premium domains';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to validate Elite subscription on purchase
DROP TRIGGER IF EXISTS validate_elite_subscription ON premium_domain_purchases;
CREATE TRIGGER validate_elite_subscription
  BEFORE INSERT ON premium_domain_purchases
  FOR EACH ROW
  EXECUTE FUNCTION check_elite_subscription_for_premium();

-- Function to auto-suspend domains when Elite subscription is cancelled
CREATE OR REPLACE FUNCTION auto_suspend_on_elite_cancel()
RETURNS TRIGGER AS $$
BEGIN
  -- If subscription status changed from active to cancelled/expired
  IF OLD.status = 'active' AND NEW.status IN ('cancelled', 'expired') THEN
    -- Suspend all premium domains linked to this subscription
    UPDATE premium_domain_purchases
    SET
      status = 'suspended',
      suspension_date = NOW(),
      notes = COALESCE(notes || E'\n\n', '') ||
              'Auto-suspended: Elite subscription ' || NEW.status || ' on ' || NOW()::DATE
    WHERE
      subscription_id = NEW.id
      AND status = 'active';
  END IF;

  -- If subscription is reactivated, reactivate domains that were auto-suspended
  IF OLD.status IN ('cancelled', 'expired') AND NEW.status = 'active' THEN
    UPDATE premium_domain_purchases
    SET
      status = 'active',
      suspension_date = NULL,
      days_overdue = 0,
      notes = COALESCE(notes || E'\n\n', '') ||
              'Auto-reactivated: Elite subscription restored on ' || NOW()::DATE
    WHERE
      subscription_id = NEW.id
      AND status = 'suspended'
      AND expiration_date IS NULL; -- Don't reactivate expired domains
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on subscriptions table to auto-suspend/reactivate domains
DROP TRIGGER IF EXISTS subscription_status_change ON subscriptions;
CREATE TRIGGER subscription_status_change
  AFTER UPDATE OF status ON subscriptions
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION auto_suspend_on_elite_cancel();

-- Update existing premium_domain_purchases to link with Elite subscriptions
-- This is a one-time update for existing data
DO $$
DECLARE
  v_purchase RECORD;
  v_subscription_id UUID;
BEGIN
  FOR v_purchase IN
    SELECT pdp.id, pdp.customer_id
    FROM premium_domain_purchases pdp
    WHERE pdp.subscription_id IS NULL
    AND pdp.status = 'active'
  LOOP
    -- Find active Elite subscription for this customer
    SELECT s.id INTO v_subscription_id
    FROM subscriptions s
    JOIN subscription_plans sp ON s.plan_id = sp.id
    JOIN customers c ON c.user_id = s.user_id
    WHERE c.id = v_purchase.customer_id
    AND sp.plan_type = 'elite'
    AND s.status = 'active'
    LIMIT 1;

    -- Update purchase with subscription_id if found
    IF v_subscription_id IS NOT NULL THEN
      UPDATE premium_domain_purchases
      SET subscription_id = v_subscription_id
      WHERE id = v_purchase.id;
    END IF;
  END LOOP;
END $$;

-- Add comment explaining the business logic
COMMENT ON COLUMN premium_domain_purchases.subscription_id IS
  'References the Elite subscription that enables this premium domain ownership. Domain is auto-suspended if Elite subscription is cancelled or expired.';
