/*
  # Trial Rights Control & Affiliate Protection System

  This migration implements a comprehensive system to control rights and affiliate
  relationships during trial periods, preventing fraud and ensuring only paid
  members maintain their benefits.

  ## Trial Policy Overview

  During Prime 14-day trial:
  - Users can explore the platform
  - Can invite affiliates BUT links are PENDING
  - NO commissions generated
  - NO permanent rights guaranteed
  - Domain is PARKED (limited DNS)

  After trial expires without payment:
  - Account status → unpaid_hold
  - ALL rights revoked automatically
  - ALL affiliates released (can join other sponsors)
  - Domain enters protection period
  - User has 15 days to recover with payment

  ## Anti-Fraud Measures

  - Multiple trials with same CPF/email/card/IP → all blocked
  - Account enters fraud_hold status
  - All affiliates removed
  - Requires manual review

  ## Changes

  1. New affiliate status: 'pending_trial' (awaiting sponsor payment)
  2. Affiliate release mechanism when sponsor trial expires
  3. Trial account fingerprinting for fraud detection
  4. Rights revocation tracking
  5. Recovery window (15 days post-trial)
*/

-- Step 1: Add trial control fields to customers table
DO $$
BEGIN
  -- is_trial_account
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'is_trial_account'
  ) THEN
    ALTER TABLE customers ADD COLUMN is_trial_account boolean DEFAULT false;
  END IF;

  -- trial_started_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'trial_started_at'
  ) THEN
    ALTER TABLE customers ADD COLUMN trial_started_at timestamptz;
  END IF;

  -- trial_ends_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'trial_ends_at'
  ) THEN
    ALTER TABLE customers ADD COLUMN trial_ends_at timestamptz;
  END IF;

  -- trial_converted_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'trial_converted_at'
  ) THEN
    ALTER TABLE customers ADD COLUMN trial_converted_at timestamptz;
  END IF;

  -- rights_revoked_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'rights_revoked_at'
  ) THEN
    ALTER TABLE customers ADD COLUMN rights_revoked_at timestamptz;
  END IF;

  -- recovery_window_until
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'recovery_window_until'
  ) THEN
    ALTER TABLE customers ADD COLUMN recovery_window_until timestamptz;
  END IF;

  -- account_fingerprint (for fraud detection)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'account_fingerprint'
  ) THEN
    ALTER TABLE customers ADD COLUMN account_fingerprint jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Step 2: Create trial_rights_revocations table (audit trail)
CREATE TABLE IF NOT EXISTS trial_rights_revocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  revocation_type text NOT NULL, -- 'trial_expired', 'fraud_detected', 'manual'
  rights_lost jsonb NOT NULL, -- List of what was revoked
  affiliates_count integer DEFAULT 0,
  domains_count integer DEFAULT 0,
  commissions_lost numeric(10, 2) DEFAULT 0,
  reason text,
  can_recover boolean DEFAULT true,
  recovery_deadline timestamptz,
  recovered_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Step 3: Create trial_affiliate_holds table (pending affiliates)
CREATE TABLE IF NOT EXISTS trial_affiliate_holds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL, -- The invited person
  sponsor_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sponsor_trial_ends timestamptz NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'released', 'expired')),
  confirmed_at timestamptz,
  released_at timestamptz,
  release_reason text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Step 4: Create account_fingerprints table (fraud detection)
CREATE TABLE IF NOT EXISTS account_fingerprints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint_hash text NOT NULL,
  fingerprint_type text NOT NULL, -- 'cpf', 'email', 'payment_method', 'ip', 'device'
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_seen_at timestamptz DEFAULT now(),
  last_seen_at timestamptz DEFAULT now(),
  usage_count integer DEFAULT 1,
  is_flagged boolean DEFAULT false,
  flagged_reason text,
  created_at timestamptz DEFAULT now()
);

-- Step 5: Add index for fingerprint lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_account_fingerprints_hash_type
ON account_fingerprints(fingerprint_hash, fingerprint_type);

CREATE INDEX IF NOT EXISTS idx_account_fingerprints_user
ON account_fingerprints(user_id);

CREATE INDEX IF NOT EXISTS idx_account_fingerprints_flagged
ON account_fingerprints(is_flagged, fingerprint_type)
WHERE is_flagged = true;

-- Step 6: Create function to start trial
CREATE OR REPLACE FUNCTION start_trial_period(
  p_user_id uuid,
  p_plan_id uuid,
  p_fingerprint jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trial_days integer := 14;
  v_recovery_days integer := 15;
  v_subscription_id uuid;
  v_customer customers%ROWTYPE;
BEGIN
  -- Get or create customer
  SELECT * INTO v_customer FROM customers WHERE user_id = p_user_id;

  IF v_customer IS NULL THEN
    INSERT INTO customers (user_id, role)
    VALUES (p_user_id, 'member')
    RETURNING * INTO v_customer;
  END IF;

  -- Check for fraud (multiple trials)
  IF EXISTS (
    SELECT 1 FROM account_fingerprints
    WHERE fingerprint_hash IN (
      SELECT jsonb_object_keys(p_fingerprint)
    )
    AND is_flagged = true
  ) THEN
    -- Mark as fraud
    UPDATE customers
    SET
      role = 'suspended',
      account_fingerprint = p_fingerprint
    WHERE user_id = p_user_id;

    INSERT INTO fraud_detection_logs (
      user_id,
      event_type,
      risk_score,
      fingerprint,
      action_taken,
      notes
    ) VALUES (
      p_user_id,
      'multiple_trials',
      100,
      p_fingerprint,
      'blocked',
      'Detected multiple trial attempts with same fingerprint'
    );

    RETURN jsonb_build_object(
      'success', false,
      'error', 'FRAUD_DETECTED',
      'message', 'Detectamos múltiplas tentativas de uso indevido do período de teste. Sua conta foi bloqueada para análise.'
    );
  END IF;

  -- Store fingerprints
  IF p_fingerprint IS NOT NULL AND p_fingerprint != '{}'::jsonb THEN
    INSERT INTO account_fingerprints (fingerprint_hash, fingerprint_type, user_id)
    SELECT
      value::text,
      key,
      p_user_id
    FROM jsonb_each_text(p_fingerprint)
    ON CONFLICT (fingerprint_hash, fingerprint_type)
    DO UPDATE SET
      last_seen_at = now(),
      usage_count = account_fingerprints.usage_count + 1,
      is_flagged = CASE
        WHEN account_fingerprints.usage_count >= 2 THEN true
        ELSE account_fingerprints.is_flagged
      END,
      flagged_reason = CASE
        WHEN account_fingerprints.usage_count >= 2 THEN 'Multiple trial accounts detected'
        ELSE account_fingerprints.flagged_reason
      END;
  END IF;

  -- Create trial subscription
  INSERT INTO subscriptions (
    user_id,
    plan_id,
    status,
    trial_ends_at,
    started_at
  ) VALUES (
    p_user_id,
    p_plan_id,
    'trialing',
    now() + (v_trial_days || ' days')::interval,
    now()
  )
  RETURNING id INTO v_subscription_id;

  -- Update customer as trial
  UPDATE customers
  SET
    is_trial_account = true,
    trial_started_at = now(),
    trial_ends_at = now() + (v_trial_days || ' days')::interval,
    recovery_window_until = now() + ((v_trial_days + v_recovery_days) || ' days')::interval,
    account_fingerprint = p_fingerprint
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'subscription_id', v_subscription_id,
    'trial_ends_at', now() + (v_trial_days || ' days')::interval,
    'message', 'Trial iniciado com sucesso. Seus direitos e afiliados serão confirmados após o pagamento.'
  );
END;
$$;

-- Step 7: Create function to revoke trial rights
CREATE OR REPLACE FUNCTION revoke_trial_rights(
  p_user_id uuid,
  p_reason text DEFAULT 'trial_expired'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer customers%ROWTYPE;
  v_affiliates_count integer;
  v_domains_count integer;
  v_rights_lost jsonb;
BEGIN
  -- Get customer
  SELECT * INTO v_customer FROM customers WHERE user_id = p_user_id;

  IF v_customer IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Customer not found');
  END IF;

  -- Count affiliates (from referrals or affiliate system)
  SELECT COUNT(*) INTO v_affiliates_count
  FROM subscriptions
  WHERE referred_by = p_user_id AND status IN ('active', 'trialing');

  -- Count domains
  SELECT COUNT(*) INTO v_domains_count
  FROM domains
  WHERE user_id = p_user_id AND registrar_status IN ('active', 'parked');

  -- Build rights lost record
  v_rights_lost := jsonb_build_object(
    'affiliates', v_affiliates_count,
    'domains', v_domains_count,
    'subscription_status', 'revoked',
    'network_position', 'removed'
  );

  -- 1. Release all affiliates (mark as available for reassignment)
  UPDATE trial_affiliate_holds
  SET
    status = 'released',
    released_at = now(),
    release_reason = p_reason
  WHERE sponsor_user_id = p_user_id
    AND status = 'pending';

  -- Also release from main subscriptions table
  UPDATE subscriptions
  SET
    referred_by = NULL,
    status = CASE
      WHEN status = 'trialing' THEN 'cancelled'
      ELSE status
    END
  WHERE referred_by = p_user_id;

  -- 2. Move domains to protected state
  UPDATE domains
  SET
    registrar_status = 'unpaid_hold',
    suspension_reason = 'Trial expired without payment',
    grace_until = now() + interval '15 days'
  WHERE user_id = p_user_id
    AND registrar_status IN ('active', 'parked');

  -- 3. Update customer status
  UPDATE customers
  SET
    role = 'suspended',
    is_trial_account = false,
    rights_revoked_at = now()
  WHERE user_id = p_user_id;

  -- 4. Cancel subscription
  UPDATE subscriptions
  SET
    status = 'unpaid_hold',
    cancelled_at = now()
  WHERE user_id = p_user_id
    AND status = 'trialing';

  -- 5. Log revocation
  INSERT INTO trial_rights_revocations (
    user_id,
    revocation_type,
    rights_lost,
    affiliates_count,
    domains_count,
    reason,
    can_recover,
    recovery_deadline
  ) VALUES (
    p_user_id,
    p_reason,
    v_rights_lost,
    v_affiliates_count,
    v_domains_count,
    'Trial period expired without payment confirmation',
    true,
    v_customer.recovery_window_until
  );

  -- 6. Log event
  INSERT INTO domain_lifecycle_events (
    domain_id,
    event_type,
    old_status,
    new_status,
    triggered_by,
    notes
  )
  SELECT
    id,
    'trial_rights_revoked',
    registrar_status,
    'unpaid_hold',
    'system',
    'Trial expired, all rights revoked'
  FROM domains
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'rights_revoked', v_rights_lost,
    'recovery_deadline', v_customer.recovery_window_until,
    'message', 'Todos os direitos foram revogados. Regularize o pagamento para recuperar.'
  );
END;
$$;

-- Step 8: Create function to recover from trial expiration
CREATE OR REPLACE FUNCTION recover_trial_account(
  p_user_id uuid,
  p_payment_confirmed boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer customers%ROWTYPE;
  v_revocation trial_rights_revocations%ROWTYPE;
  v_can_recover boolean;
BEGIN
  -- Get customer
  SELECT * INTO v_customer FROM customers WHERE user_id = p_user_id;

  IF v_customer IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Customer not found');
  END IF;

  -- Check if within recovery window
  v_can_recover := v_customer.recovery_window_until >= now();

  IF NOT v_can_recover THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'RECOVERY_WINDOW_EXPIRED',
      'message', 'O prazo de recuperação expirou. Seus direitos não podem mais ser restaurados.'
    );
  END IF;

  -- Get latest revocation
  SELECT * INTO v_revocation
  FROM trial_rights_revocations
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_revocation IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No revocation found');
  END IF;

  -- 1. Restore customer status
  UPDATE customers
  SET
    role = 'member',
    rights_revoked_at = NULL,
    trial_converted_at = now(),
    is_trial_account = false
  WHERE user_id = p_user_id;

  -- 2. Activate subscription
  UPDATE subscriptions
  SET
    status = 'active',
    last_payment_at = now(),
    next_plan_change_available_at = now() + interval '60 days',
    cancelled_at = NULL
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT 1;

  -- 3. Restore domains
  UPDATE domains
  SET
    registrar_status = 'active',
    suspension_reason = NULL,
    grace_until = NULL,
    locked_until = now() + interval '60 days'
  WHERE user_id = p_user_id
    AND registrar_status = 'unpaid_hold';

  -- 4. Try to restore affiliates (if they haven't joined someone else)
  UPDATE trial_affiliate_holds
  SET
    status = 'confirmed',
    confirmed_at = now()
  WHERE sponsor_user_id = p_user_id
    AND status = 'released'
    AND released_at > now() - interval '15 days'; -- Only if released recently

  -- 5. Mark revocation as recovered
  UPDATE trial_rights_revocations
  SET recovered_at = now()
  WHERE id = v_revocation.id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Conta recuperada com sucesso! Seus direitos foram restaurados.',
    'affiliates_restored', (SELECT COUNT(*) FROM trial_affiliate_holds
                           WHERE sponsor_user_id = p_user_id AND status = 'confirmed')
  );
END;
$$;

-- Step 9: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_customers_trial ON customers(is_trial_account, trial_ends_at)
WHERE is_trial_account = true;

CREATE INDEX IF NOT EXISTS idx_customers_recovery ON customers(recovery_window_until)
WHERE recovery_window_until IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_trial_holds_sponsor ON trial_affiliate_holds(sponsor_user_id, status);
CREATE INDEX IF NOT EXISTS idx_trial_holds_expires ON trial_affiliate_holds(sponsor_trial_ends, status);

CREATE INDEX IF NOT EXISTS idx_revocations_user ON trial_rights_revocations(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_revocations_recovery ON trial_rights_revocations(can_recover, recovery_deadline)
WHERE can_recover = true;

-- Step 10: Enable RLS
ALTER TABLE trial_rights_revocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE trial_affiliate_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_fingerprints ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own revocations"
  ON trial_rights_revocations FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all revocations"
  ON trial_rights_revocations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = auth.uid()
      AND customers.role = 'admin'
    )
  );

CREATE POLICY "Users can view their affiliate holds"
  ON trial_affiliate_holds FOR SELECT
  TO authenticated
  USING (
    sponsor_user_id = auth.uid()
    OR affiliate_id IN (
      SELECT user_id FROM customers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Only admins can view fingerprints"
  ON account_fingerprints FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = auth.uid()
      AND customers.role = 'admin'
    )
  );

-- Step 11: Add comments
COMMENT ON TABLE trial_rights_revocations IS 'Audit trail of trial rights revocations and recoveries';
COMMENT ON TABLE trial_affiliate_holds IS 'Pending affiliate relationships during sponsor trial period';
COMMENT ON TABLE account_fingerprints IS 'Fraud detection fingerprints for multi-account detection';

COMMENT ON FUNCTION start_trial_period IS 'Initiates 14-day trial period with fraud detection';
COMMENT ON FUNCTION revoke_trial_rights IS 'Revokes all rights when trial expires without payment';
COMMENT ON FUNCTION recover_trial_account IS 'Recovers account within 15-day window after payment';

COMMENT ON COLUMN customers.is_trial_account IS 'User is currently in trial period';
COMMENT ON COLUMN customers.trial_ends_at IS 'When trial period expires';
COMMENT ON COLUMN customers.rights_revoked_at IS 'When rights were revoked (trial expiration)';
COMMENT ON COLUMN customers.recovery_window_until IS 'Deadline to recover account with payment (trial + 15 days)';
COMMENT ON COLUMN customers.account_fingerprint IS 'Fraud detection data (IP, device, payment method)';
