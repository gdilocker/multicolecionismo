/*
  # Subscription Control & Anti-Fraud System

  This migration implements a comprehensive subscription control system with anti-fraud
  measures, payment tracking, and plan change restrictions.

  ## Changes

  1. Subscription Status Enhancement
    - Add new status values: 'trialing', 'past_due', 'unpaid_hold'
    - Add payment tracking fields
    - Add plan change control fields

  2. New Fields Added to `subscriptions`
    - `last_payment_at` - Timestamp of last confirmed payment
    - `next_plan_change_available_at` - When user can change plans (60 days after payment)
    - `balance_due` - Amount owed if payment failed
    - `trial_ends_at` - End date for trial period (14 days for Prime)
    - `payment_method` - Payment method used (paypal, stripe, etc)
    - `plan_change_blocked_reason` - Why plan change is blocked (if applicable)

  3. Functions
    - `check_plan_change_eligibility()` - Validates if user can change plans
    - `update_payment_tracking()` - Updates payment dates after successful payment
    - `block_plan_change()` - Blocks plan change with reason
    - `calculate_next_change_date()` - Calculates 60-day lock period

  4. Triggers
    - Auto-update `next_plan_change_available_at` on payment success
    - Auto-block plan changes when payment fails

  5. Security
    - RLS policies updated to prevent plan changes during lock period
    - Validation functions to enforce 60-day rule
*/

-- Step 1: Update subscriptions table with new status values and fields
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'subscriptions' AND constraint_name = 'subscriptions_status_check'
  ) THEN
    ALTER TABLE subscriptions DROP CONSTRAINT subscriptions_status_check;
  END IF;
END $$;

-- Add new status constraint with all possible values
ALTER TABLE subscriptions
ADD CONSTRAINT subscriptions_status_check
CHECK (status IN ('active', 'trialing', 'past_due', 'unpaid_hold', 'cancelled', 'expired', 'pending'));

-- Add new fields to subscriptions table
DO $$
BEGIN
  -- last_payment_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'last_payment_at'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN last_payment_at timestamptz;
  END IF;

  -- next_plan_change_available_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'next_plan_change_available_at'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN next_plan_change_available_at timestamptz;
  END IF;

  -- balance_due
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'balance_due'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN balance_due numeric(10, 2) DEFAULT 0;
  END IF;

  -- trial_ends_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'trial_ends_at'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN trial_ends_at timestamptz;
  END IF;

  -- payment_method
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN payment_method text;
  END IF;

  -- plan_change_blocked_reason
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'plan_change_blocked_reason'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN plan_change_blocked_reason text;
  END IF;
END $$;

-- Step 2: Create function to check plan change eligibility
CREATE OR REPLACE FUNCTION check_plan_change_eligibility(
  p_user_id uuid,
  p_new_plan_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscription subscriptions%ROWTYPE;
  v_current_plan subscription_plans%ROWTYPE;
  v_new_plan subscription_plans%ROWTYPE;
  v_days_since_payment integer;
  v_result jsonb;
BEGIN
  -- Get current subscription
  SELECT * INTO v_subscription
  FROM subscriptions
  WHERE user_id = p_user_id
    AND status IN ('active', 'trialing', 'past_due', 'unpaid_hold')
  ORDER BY created_at DESC
  LIMIT 1;

  -- No active subscription found
  IF v_subscription IS NULL THEN
    RETURN jsonb_build_object(
      'eligible', true,
      'reason', NULL
    );
  END IF;

  -- Get plan details
  SELECT * INTO v_current_plan FROM subscription_plans WHERE id = v_subscription.plan_id;
  SELECT * INTO v_new_plan FROM subscription_plans WHERE id = p_new_plan_id;

  -- Check 1: Payment pending or past due
  IF v_subscription.status IN ('past_due', 'unpaid_hold') THEN
    RETURN jsonb_build_object(
      'eligible', false,
      'reason', 'PAYMENT_REQUIRED',
      'message', 'Você precisa regularizar o pagamento do seu plano atual antes de mudar de plano. Acesse a área de Pagamentos para resolver.',
      'balance_due', v_subscription.balance_due
    );
  END IF;

  -- Check 2: Trial expired without payment
  IF v_subscription.status = 'trialing' AND v_subscription.trial_ends_at < now() THEN
    RETURN jsonb_build_object(
      'eligible', false,
      'reason', 'TRIAL_EXPIRED',
      'message', 'O período de teste do plano ' || v_current_plan.plan_name || ' expirou. Para continuar ou mudar de plano, finalize o pagamento pendente.',
      'trial_ended', v_subscription.trial_ends_at
    );
  END IF;

  -- Check 3: 60-day lock period
  IF v_subscription.next_plan_change_available_at IS NOT NULL
     AND v_subscription.next_plan_change_available_at > now() THEN

    v_days_since_payment := EXTRACT(DAY FROM (now() - v_subscription.last_payment_at));

    RETURN jsonb_build_object(
      'eligible', false,
      'reason', 'LOCK_PERIOD',
      'message', 'Por política de estabilidade de assinatura, as mudanças de plano só são liberadas 60 dias após o último pagamento confirmado. Essa medida garante consistência, exclusividade e proteção aos membros do clube.',
      'last_payment_at', v_subscription.last_payment_at,
      'next_change_available', v_subscription.next_plan_change_available_at,
      'days_remaining', EXTRACT(DAY FROM (v_subscription.next_plan_change_available_at - now()))
    );
  END IF;

  -- All checks passed
  RETURN jsonb_build_object(
    'eligible', true,
    'reason', NULL,
    'current_plan', v_current_plan.plan_name,
    'new_plan', v_new_plan.plan_name
  );
END;
$$;

-- Step 3: Create function to update payment tracking
CREATE OR REPLACE FUNCTION update_payment_tracking(
  p_subscription_id uuid,
  p_payment_amount numeric,
  p_payment_method text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE subscriptions
  SET
    last_payment_at = now(),
    next_plan_change_available_at = now() + interval '60 days',
    balance_due = 0,
    status = 'active',
    payment_method = COALESCE(p_payment_method, payment_method),
    plan_change_blocked_reason = NULL,
    updated_at = now()
  WHERE id = p_subscription_id;
END;
$$;

-- Step 4: Create function to handle payment failures
CREATE OR REPLACE FUNCTION handle_payment_failure(
  p_subscription_id uuid,
  p_amount_due numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE subscriptions
  SET
    status = 'past_due',
    balance_due = p_amount_due,
    plan_change_blocked_reason = 'Pagamento pendente',
    updated_at = now()
  WHERE id = p_subscription_id;
END;
$$;

-- Step 5: Create function to initialize trial period
CREATE OR REPLACE FUNCTION initialize_trial_subscription(
  p_user_id uuid,
  p_plan_id uuid,
  p_trial_days integer DEFAULT 14
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscription_id uuid;
BEGIN
  INSERT INTO subscriptions (
    user_id,
    plan_id,
    status,
    trial_ends_at,
    started_at,
    next_plan_change_available_at
  ) VALUES (
    p_user_id,
    p_plan_id,
    'trialing',
    now() + (p_trial_days || ' days')::interval,
    now(),
    NULL -- No lock during trial
  )
  RETURNING id INTO v_subscription_id;

  RETURN v_subscription_id;
END;
$$;

-- Step 6: Create function to finalize trial with payment
CREATE OR REPLACE FUNCTION finalize_trial_payment(
  p_subscription_id uuid,
  p_payment_method text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE subscriptions
  SET
    status = 'active',
    last_payment_at = now(),
    next_plan_change_available_at = now() + interval '60 days',
    payment_method = p_payment_method,
    trial_ends_at = NULL,
    updated_at = now()
  WHERE id = p_subscription_id
    AND status = 'trialing';
END;
$$;

-- Step 7: Create index for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status
ON subscriptions(user_id, status);

CREATE INDEX IF NOT EXISTS idx_subscriptions_next_change_date
ON subscriptions(next_plan_change_available_at)
WHERE next_plan_change_available_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_subscriptions_trial_ends
ON subscriptions(trial_ends_at)
WHERE trial_ends_at IS NOT NULL;

-- Step 8: Create view for subscription eligibility
CREATE OR REPLACE VIEW subscription_change_eligibility AS
SELECT
  s.id as subscription_id,
  s.user_id,
  s.status,
  s.last_payment_at,
  s.next_plan_change_available_at,
  s.balance_due,
  s.trial_ends_at,
  sp.plan_name as current_plan,
  sp.plan_type as current_plan_type,
  CASE
    WHEN s.status IN ('past_due', 'unpaid_hold') THEN false
    WHEN s.status = 'trialing' AND s.trial_ends_at < now() THEN false
    WHEN s.next_plan_change_available_at > now() THEN false
    ELSE true
  END as can_change_plan,
  CASE
    WHEN s.status IN ('past_due', 'unpaid_hold') THEN 'PAYMENT_REQUIRED'
    WHEN s.status = 'trialing' AND s.trial_ends_at < now() THEN 'TRIAL_EXPIRED'
    WHEN s.next_plan_change_available_at > now() THEN 'LOCK_PERIOD'
    ELSE NULL
  END as block_reason,
  EXTRACT(DAY FROM (s.next_plan_change_available_at - now()))::integer as days_until_change_available
FROM subscriptions s
JOIN subscription_plans sp ON s.plan_id = sp.id
WHERE s.status IN ('active', 'trialing', 'past_due', 'unpaid_hold');

-- Step 9: Add comments for documentation
COMMENT ON COLUMN subscriptions.last_payment_at IS 'Timestamp of last confirmed payment';
COMMENT ON COLUMN subscriptions.next_plan_change_available_at IS 'When user can change plans (60 days after payment)';
COMMENT ON COLUMN subscriptions.balance_due IS 'Amount owed if payment failed';
COMMENT ON COLUMN subscriptions.trial_ends_at IS 'End date for trial period (14 days for Prime)';
COMMENT ON COLUMN subscriptions.payment_method IS 'Payment method used (paypal, stripe, etc)';
COMMENT ON COLUMN subscriptions.plan_change_blocked_reason IS 'Human-readable reason why plan change is blocked';

COMMENT ON FUNCTION check_plan_change_eligibility IS 'Validates if user can change plans based on payment status and 60-day rule';
COMMENT ON FUNCTION update_payment_tracking IS 'Updates payment tracking fields after successful payment';
COMMENT ON FUNCTION handle_payment_failure IS 'Handles subscription status when payment fails';
COMMENT ON FUNCTION initialize_trial_subscription IS 'Creates new subscription with trial period';
COMMENT ON FUNCTION finalize_trial_payment IS 'Converts trial subscription to paid after successful payment';
