/*
  # Domain Lifecycle System - Complete Renewal, Loss & Recovery Cycle

  This migration implements a professional domain lifecycle management system
  inspired by registry.br and ICANN best practices, with multiple grace periods,
  redemption, auction, and anti-fraud measures.

  ## Domain Lifecycle States

  1. **active** - Domain is fully operational
  2. **grace** - Payment failed, 15-day grace period (services still active)
  3. **redemption** - Day 16-45, suspended (requires payment + recovery fee)
  4. **registry_hold** - Day 46-60, protection period before auction
  5. **auction** - Day 61-75, available for internal auction/waitlist
  6. **pending_delete** - Day 76-80, final technical window
  7. **released** - Day 81+, back to inventory (may become premium)
  8. **dispute_hold** - Chargeback or fraud investigation
  9. **unpaid_hold** - Trial expired without payment
  10. **parked** - Trial period, limited DNS functionality

  ## Timeline

  - D-14, D-7, D-3, D-1: Pre-expiration notifications
  - D0: Payment failed → grace period begins
  - D1-15: Grace period (no extra fees)
  - D16-45: Redemption period (requires recovery fee)
  - D46-60: Registry hold (pre-auction protection)
  - D61-75: Auction/waitlist (original owner has priority until D65)
  - D76-80: Pending delete (technical window)
  - D81+: Released to inventory

  ## Anti-Fraud Measures

  - 60-day transfer lock after registration/renewal
  - Multi-account detection (same payment/IP/device)
  - Velocity limits (max 2 domains in first 48h for new users)
  - KYC required for Elite/Supreme before DNS activation
  - Chargeback = immediate suspension

  ## Recovery Fees

  - Grace period (D1-15): No fee, just pay current invoice
  - Redemption (D16-45): Monthly fee + recovery fee
  - After D45: Cannot recover without special appeal
*/

-- Step 1: Add new domain status values
DO $$
BEGIN
  -- We'll handle the constraint update separately
  NULL;
END $$;

-- Step 2: Add lifecycle tracking fields to domains table
DO $$
BEGIN
  -- grace_until
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'domains' AND column_name = 'grace_until'
  ) THEN
    ALTER TABLE domains ADD COLUMN grace_until timestamptz;
  END IF;

  -- redemption_until
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'domains' AND column_name = 'redemption_until'
  ) THEN
    ALTER TABLE domains ADD COLUMN redemption_until timestamptz;
  END IF;

  -- registry_hold_until
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'domains' AND column_name = 'registry_hold_until'
  ) THEN
    ALTER TABLE domains ADD COLUMN registry_hold_until timestamptz;
  END IF;

  -- auction_until
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'domains' AND column_name = 'auction_until'
  ) THEN
    ALTER TABLE domains ADD COLUMN auction_until timestamptz;
  END IF;

  -- pending_delete_until
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'domains' AND column_name = 'pending_delete_until'
  ) THEN
    ALTER TABLE domains ADD COLUMN pending_delete_until timestamptz;
  END IF;

  -- locked_until (60-day transfer lock)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'domains' AND column_name = 'locked_until'
  ) THEN
    ALTER TABLE domains ADD COLUMN locked_until timestamptz;
  END IF;

  -- last_paid_invoice_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'domains' AND column_name = 'last_paid_invoice_id'
  ) THEN
    ALTER TABLE domains ADD COLUMN last_paid_invoice_id uuid;
  END IF;

  -- recovery_fee_applied
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'domains' AND column_name = 'recovery_fee_applied'
  ) THEN
    ALTER TABLE domains ADD COLUMN recovery_fee_applied boolean DEFAULT false;
  END IF;

  -- late_fee_amount
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'domains' AND column_name = 'late_fee_amount'
  ) THEN
    ALTER TABLE domains ADD COLUMN late_fee_amount numeric(10, 2) DEFAULT 0;
  END IF;

  -- parking_template
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'domains' AND column_name = 'parking_template'
  ) THEN
    ALTER TABLE domains ADD COLUMN parking_template text DEFAULT 'default';
  END IF;

  -- suspension_reason
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'domains' AND column_name = 'suspension_reason'
  ) THEN
    ALTER TABLE domains ADD COLUMN suspension_reason text;
  END IF;

  -- original_owner_priority_until (for auctions)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'domains' AND column_name = 'original_owner_priority_until'
  ) THEN
    ALTER TABLE domains ADD COLUMN original_owner_priority_until timestamptz;
  END IF;
END $$;

-- Step 3: Create domain_lifecycle_events table for audit trail
CREATE TABLE IF NOT EXISTS domain_lifecycle_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id uuid NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  old_status text,
  new_status text,
  triggered_by text, -- 'system', 'user', 'admin', 'payment'
  notes text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Step 4: Create domain_notifications table
CREATE TABLE IF NOT EXISTS domain_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id uuid NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type text NOT NULL, -- 'expiration_warning', 'grace_period', 'redemption', etc
  scheduled_for timestamptz NOT NULL,
  sent_at timestamptz,
  delivery_method text DEFAULT 'email', -- 'email', 'sms', 'whatsapp', 'in_app'
  template_id text,
  status text DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'cancelled'
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Step 5: Create fraud_detection_logs table
CREATE TABLE IF NOT EXISTS fraud_detection_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type text NOT NULL, -- 'multi_account', 'velocity_limit', 'chargeback', 'suspicious_pattern'
  risk_score integer DEFAULT 0, -- 0-100
  fingerprint jsonb, -- device, IP, payment method fingerprints
  action_taken text, -- 'flagged', 'blocked', 'manual_review', 'allowed'
  notes text,
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Step 6: Create recovery_fees_config table
CREATE TABLE IF NOT EXISTS recovery_fees_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_type text NOT NULL UNIQUE, -- 'grace', 'redemption', 'registry_hold'
  base_fee numeric(10, 2) NOT NULL DEFAULT 0,
  percentage_of_renewal numeric(5, 2) DEFAULT 0, -- Additional % of renewal price
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert default recovery fees
INSERT INTO recovery_fees_config (period_type, base_fee, percentage_of_renewal, description) VALUES
  ('grace', 0, 0, 'No additional fee during grace period'),
  ('redemption', 50, 0, 'Recovery fee for domains in redemption period'),
  ('registry_hold', 100, 0, 'Special recovery fee for registry hold period')
ON CONFLICT (period_type) DO NOTHING;

-- Step 7: Create function to calculate recovery cost
CREATE OR REPLACE FUNCTION calculate_recovery_cost(
  p_domain_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_domain domains%ROWTYPE;
  v_subscription subscriptions%ROWTYPE;
  v_plan subscription_plans%ROWTYPE;
  v_recovery_config recovery_fees_config%ROWTYPE;
  v_period_type text;
  v_total_cost numeric;
  v_monthly_cost numeric;
  v_recovery_fee numeric;
BEGIN
  -- Get domain
  SELECT * INTO v_domain FROM domains WHERE id = p_domain_id;
  IF v_domain IS NULL THEN
    RETURN jsonb_build_object('error', 'Domain not found');
  END IF;

  -- Determine current period
  IF v_domain.registrar_status = 'grace' THEN
    v_period_type := 'grace';
  ELSIF v_domain.registrar_status = 'redemption' THEN
    v_period_type := 'redemption';
  ELSIF v_domain.registrar_status = 'registry_hold' THEN
    v_period_type := 'registry_hold';
  ELSE
    RETURN jsonb_build_object('error', 'Domain not in recoverable state');
  END IF;

  -- Get subscription and plan
  SELECT s.* INTO v_subscription
  FROM subscriptions s
  WHERE s.user_id = v_domain.user_id
    AND s.status IN ('active', 'grace', 'past_due')
  ORDER BY s.created_at DESC
  LIMIT 1;

  IF v_subscription IS NOT NULL THEN
    SELECT * INTO v_plan FROM subscription_plans WHERE id = v_subscription.plan_id;
    v_monthly_cost := COALESCE(v_plan.price_usd, 0);
  ELSE
    v_monthly_cost := 0;
  END IF;

  -- Get recovery fee config
  SELECT * INTO v_recovery_config
  FROM recovery_fees_config
  WHERE period_type = v_period_type AND is_active = true;

  v_recovery_fee := COALESCE(v_recovery_config.base_fee, 0);
  v_recovery_fee := v_recovery_fee + (v_monthly_cost * COALESCE(v_recovery_config.percentage_of_renewal, 0) / 100);

  v_total_cost := v_monthly_cost + v_recovery_fee;

  RETURN jsonb_build_object(
    'period_type', v_period_type,
    'monthly_cost', v_monthly_cost,
    'recovery_fee', v_recovery_fee,
    'total_cost', v_total_cost,
    'domain_status', v_domain.registrar_status,
    'expires_at', v_domain.expires_at,
    'can_recover', true
  );
END;
$$;

-- Step 8: Create function to transition domain states
CREATE OR REPLACE FUNCTION transition_domain_state(
  p_domain_id uuid,
  p_new_state text,
  p_triggered_by text DEFAULT 'system',
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_domain domains%ROWTYPE;
  v_old_status text;
  v_grace_days integer := 15;
  v_redemption_days integer := 30;
  v_registry_hold_days integer := 15;
  v_auction_days integer := 15;
  v_pending_delete_days integer := 5;
BEGIN
  -- Get current domain
  SELECT * INTO v_domain FROM domains WHERE id = p_domain_id;
  IF v_domain IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Domain not found');
  END IF;

  v_old_status := v_domain.registrar_status;

  -- Calculate deadline dates based on new state
  CASE p_new_state
    WHEN 'grace' THEN
      UPDATE domains SET
        registrar_status = 'grace',
        grace_until = now() + (v_grace_days || ' days')::interval,
        redemption_until = now() + ((v_grace_days + v_redemption_days) || ' days')::interval,
        suspension_reason = 'Payment failed'
      WHERE id = p_domain_id;

    WHEN 'redemption' THEN
      UPDATE domains SET
        registrar_status = 'redemption',
        redemption_until = now() + (v_redemption_days || ' days')::interval,
        registry_hold_until = now() + ((v_redemption_days + v_registry_hold_days) || ' days')::interval,
        suspension_reason = 'Entered redemption period'
      WHERE id = p_domain_id;

    WHEN 'registry_hold' THEN
      UPDATE domains SET
        registrar_status = 'registry_hold',
        registry_hold_until = now() + (v_registry_hold_days || ' days')::interval,
        auction_until = now() + ((v_registry_hold_days + v_auction_days) || ' days')::interval,
        suspension_reason = 'Registry protection period'
      WHERE id = p_domain_id;

    WHEN 'auction' THEN
      UPDATE domains SET
        registrar_status = 'auction',
        auction_until = now() + (v_auction_days || ' days')::interval,
        pending_delete_until = now() + ((v_auction_days + v_pending_delete_days) || ' days')::interval,
        original_owner_priority_until = now() + (5 || ' days')::interval, -- 5-day priority
        suspension_reason = 'Available for auction'
      WHERE id = p_domain_id;

    WHEN 'pending_delete' THEN
      UPDATE domains SET
        registrar_status = 'pending_delete',
        pending_delete_until = now() + (v_pending_delete_days || ' days')::interval,
        suspension_reason = 'Pending deletion'
      WHERE id = p_domain_id;

    WHEN 'active' THEN
      UPDATE domains SET
        registrar_status = 'active',
        grace_until = NULL,
        redemption_until = NULL,
        registry_hold_until = NULL,
        auction_until = NULL,
        pending_delete_until = NULL,
        original_owner_priority_until = NULL,
        suspension_reason = NULL,
        recovery_fee_applied = false,
        late_fee_amount = 0,
        locked_until = now() + interval '60 days' -- 60-day transfer lock
      WHERE id = p_domain_id;

    WHEN 'dispute_hold' THEN
      UPDATE domains SET
        registrar_status = 'dispute_hold',
        suspension_reason = 'Chargeback or fraud investigation'
      WHERE id = p_domain_id;

    ELSE
      RETURN jsonb_build_object('success', false, 'error', 'Invalid state');
  END CASE;

  -- Log the transition
  INSERT INTO domain_lifecycle_events (
    domain_id,
    event_type,
    old_status,
    new_status,
    triggered_by,
    notes
  ) VALUES (
    p_domain_id,
    'state_transition',
    v_old_status,
    p_new_state,
    p_triggered_by,
    p_notes
  );

  RETURN jsonb_build_object(
    'success', true,
    'old_status', v_old_status,
    'new_status', p_new_state,
    'domain_id', p_domain_id
  );
END;
$$;

-- Step 9: Create function to schedule domain notifications
CREATE OR REPLACE FUNCTION schedule_domain_notifications(
  p_domain_id uuid,
  p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_domain domains%ROWTYPE;
  v_expires_at timestamptz;
BEGIN
  SELECT * INTO v_domain FROM domains WHERE id = p_domain_id;
  IF v_domain IS NULL THEN
    RETURN;
  END IF;

  v_expires_at := v_domain.expires_at;

  -- Delete existing pending notifications for this domain
  DELETE FROM domain_notifications
  WHERE domain_id = p_domain_id AND status = 'pending';

  -- Schedule pre-expiration notifications
  INSERT INTO domain_notifications (domain_id, user_id, notification_type, scheduled_for, template_id)
  VALUES
    (p_domain_id, p_user_id, 'expiration_warning', v_expires_at - interval '14 days', 'expiry_14d'),
    (p_domain_id, p_user_id, 'expiration_warning', v_expires_at - interval '7 days', 'expiry_7d'),
    (p_domain_id, p_user_id, 'expiration_warning', v_expires_at - interval '3 days', 'expiry_3d'),
    (p_domain_id, p_user_id, 'expiration_warning', v_expires_at - interval '1 day', 'expiry_1d');
END;
$$;

-- Step 10: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_domains_registrar_status ON domains(registrar_status);
CREATE INDEX IF NOT EXISTS idx_domains_expires_at ON domains(expires_at) WHERE registrar_status IN ('active', 'grace');
CREATE INDEX IF NOT EXISTS idx_domains_grace_until ON domains(grace_until) WHERE grace_until IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_domains_redemption_until ON domains(redemption_until) WHERE redemption_until IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_domains_locked_until ON domains(locked_until) WHERE locked_until IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_domain_notifications_scheduled ON domain_notifications(scheduled_for, status);
CREATE INDEX IF NOT EXISTS idx_domain_notifications_domain ON domain_notifications(domain_id, status);

CREATE INDEX IF NOT EXISTS idx_fraud_logs_user ON fraud_detection_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_fraud_logs_event_type ON fraud_detection_logs(event_type, created_at);

-- Step 11: Enable RLS on new tables
ALTER TABLE domain_lifecycle_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_detection_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE recovery_fees_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies for domain_lifecycle_events
CREATE POLICY "Users can view events for their domains"
  ON domain_lifecycle_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM domains
      WHERE domains.id = domain_lifecycle_events.domain_id
      AND domains.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all lifecycle events"
  ON domain_lifecycle_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = auth.uid()
      AND customers.role = 'admin'
    )
  );

-- RLS Policies for domain_notifications
CREATE POLICY "Users can view their notifications"
  ON domain_notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all notifications"
  ON domain_notifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = auth.uid()
      AND customers.role = 'admin'
    )
  );

-- RLS Policies for fraud_detection_logs
CREATE POLICY "Only admins can view fraud logs"
  ON fraud_detection_logs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = auth.uid()
      AND customers.role = 'admin'
    )
  );

-- RLS Policies for recovery_fees_config
CREATE POLICY "Everyone can view recovery fees"
  ON recovery_fees_config FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Only admins can manage recovery fees"
  ON recovery_fees_config FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = auth.uid()
      AND customers.role = 'admin'
    )
  );

-- Step 12: Add comments for documentation
COMMENT ON TABLE domain_lifecycle_events IS 'Audit trail of all domain state transitions';
COMMENT ON TABLE domain_notifications IS 'Scheduled notifications for domain expiration and lifecycle events';
COMMENT ON TABLE fraud_detection_logs IS 'Anti-fraud detection and prevention logs';
COMMENT ON TABLE recovery_fees_config IS 'Configuration for domain recovery fees by period type';

COMMENT ON FUNCTION calculate_recovery_cost IS 'Calculates total cost to recover a domain including base fee and recovery charges';
COMMENT ON FUNCTION transition_domain_state IS 'Transitions domain through lifecycle states with automatic deadline calculation';
COMMENT ON FUNCTION schedule_domain_notifications IS 'Schedules all pre-expiration notifications for a domain';

COMMENT ON COLUMN domains.grace_until IS 'End of grace period (15 days after expiration)';
COMMENT ON COLUMN domains.redemption_until IS 'End of redemption period (45 days after expiration)';
COMMENT ON COLUMN domains.registry_hold_until IS 'End of registry hold period (60 days after expiration)';
COMMENT ON COLUMN domains.auction_until IS 'End of auction period (75 days after expiration)';
COMMENT ON COLUMN domains.pending_delete_until IS 'End of pending delete period (80 days after expiration)';
COMMENT ON COLUMN domains.locked_until IS '60-day transfer lock after registration or renewal';
COMMENT ON COLUMN domains.original_owner_priority_until IS 'Original owner has priority to reclaim during auction (typically first 5 days)';
