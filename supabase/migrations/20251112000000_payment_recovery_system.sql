/*
  # Payment & Recovery System for Domain Lifecycle

  This migration extends the existing domain lifecycle system with:
  - Payment tracking and history
  - Recovery fee calculation
  - Checkout flow support
  - Invoice generation
  - Payment webhook processing

  Integrates with existing:
  - Domain lifecycle states (grace, redemption, auction)
  - Notification system
  - Anti-fraud system
*/

-- Step 1: Add payment tracking fields to domains table
DO $$
BEGIN
  -- last_payment_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'domains' AND column_name = 'last_payment_at'
  ) THEN
    ALTER TABLE domains ADD COLUMN last_payment_at timestamptz;
  END IF;

  -- next_renewal_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'domains' AND column_name = 'next_renewal_at'
  ) THEN
    ALTER TABLE domains ADD COLUMN next_renewal_at timestamptz;
  END IF;

  -- recovery_fee_usd (calculated dynamically)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'domains' AND column_name = 'recovery_fee_usd'
  ) THEN
    ALTER TABLE domains ADD COLUMN recovery_fee_usd numeric(10, 2) DEFAULT 25.00;
  END IF;

  -- monthly_fee_usd
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'domains' AND column_name = 'monthly_fee_usd'
  ) THEN
    ALTER TABLE domains ADD COLUMN monthly_fee_usd numeric(10, 2) DEFAULT 70.00;
  END IF;

  -- auto_renew
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'domains' AND column_name = 'auto_renew'
  ) THEN
    ALTER TABLE domains ADD COLUMN auto_renew boolean DEFAULT true;
  END IF;

  -- payment_failed_count
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'domains' AND column_name = 'payment_failed_count'
  ) THEN
    ALTER TABLE domains ADD COLUMN payment_failed_count integer DEFAULT 0;
  END IF;
END $$;

-- Step 2: Create domain_payments table (payment history)
CREATE TABLE IF NOT EXISTS domain_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id uuid NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Payment details
  amount_usd numeric(10, 2) NOT NULL,
  currency text DEFAULT 'USD',
  payment_type text NOT NULL CHECK (payment_type IN ('renewal', 'recovery', 'initial', 'upgrade')),
  payment_method text, -- 'paypal', 'stripe', 'crypto'

  -- External IDs
  payment_provider text,
  external_payment_id text,
  external_transaction_id text,

  -- Status
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'disputed')),
  completed_at timestamptz,
  failed_at timestamptz,
  failure_reason text,

  -- Recovery specific
  includes_recovery_fee boolean DEFAULT false,
  recovery_fee_amount numeric(10, 2) DEFAULT 0,

  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb,
  notes text,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Step 3: Create domain_invoices table
CREATE TABLE IF NOT EXISTS domain_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id uuid NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Invoice details
  invoice_number text UNIQUE NOT NULL,
  amount_usd numeric(10, 2) NOT NULL,
  due_date timestamptz NOT NULL,

  -- Status
  status text DEFAULT 'open' CHECK (status IN ('open', 'paid', 'overdue', 'cancelled', 'void')),
  paid_at timestamptz,
  payment_id uuid REFERENCES domain_payments(id),

  -- Line items
  line_items jsonb NOT NULL, -- [{ description, amount, type }]

  -- PDF generation
  pdf_url text,
  pdf_generated_at timestamptz,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Step 4: Create function to calculate recovery cost
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
  v_monthly_fee numeric(10, 2);
  v_recovery_fee numeric(10, 2);
  v_total numeric(10, 2);
  v_days_in_status integer;
BEGIN
  -- Get domain
  SELECT * INTO v_domain FROM domains WHERE id = p_domain_id;

  IF v_domain IS NULL THEN
    RETURN jsonb_build_object('error', 'Domain not found');
  END IF;

  -- Base fees
  v_monthly_fee := v_domain.monthly_fee_usd;
  v_recovery_fee := 0;

  -- Calculate days in current status
  v_days_in_status := EXTRACT(day FROM now() - COALESCE(v_domain.grace_until, v_domain.created_at));

  -- Determine recovery fee based on status
  IF v_domain.registrar_status = 'grace' THEN
    -- Grace period: no recovery fee, just monthly
    v_recovery_fee := 0;
  ELSIF v_domain.registrar_status = 'redemption' THEN
    -- Redemption: monthly + recovery fee
    v_recovery_fee := v_domain.recovery_fee_usd;
  ELSIF v_domain.registrar_status IN ('registry_hold', 'auction') THEN
    -- After redemption: higher recovery fee or not recoverable
    v_recovery_fee := v_domain.recovery_fee_usd * 2;
  ELSE
    -- Active or other: just monthly renewal
    v_recovery_fee := 0;
  END IF;

  v_total := v_monthly_fee + v_recovery_fee;

  RETURN jsonb_build_object(
    'domain_id', p_domain_id,
    'domain_name', v_domain.fqdn,
    'status', v_domain.registrar_status,
    'days_in_status', v_days_in_status,
    'monthly_fee', v_monthly_fee,
    'recovery_fee', v_recovery_fee,
    'total_amount', v_total,
    'currency', 'USD',
    'can_recover', v_domain.registrar_status IN ('grace', 'redemption', 'registry_hold'),
    'requires_recovery_fee', v_recovery_fee > 0
  );
END;
$$;

-- Step 5: Create function to process payment
CREATE OR REPLACE FUNCTION process_domain_payment(
  p_domain_id uuid,
  p_payment_type text,
  p_amount_usd numeric,
  p_payment_provider text,
  p_external_payment_id text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_domain domains%ROWTYPE;
  v_payment_id uuid;
  v_user_id uuid;
  v_recovery_cost jsonb;
BEGIN
  -- Get domain and user
  SELECT * INTO v_domain FROM domains WHERE id = p_domain_id;

  IF v_domain IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Domain not found');
  END IF;

  v_user_id := v_domain.user_id;

  -- Calculate recovery cost if needed
  v_recovery_cost := calculate_recovery_cost(p_domain_id);

  -- Verify payment amount
  IF p_amount_usd < (v_recovery_cost->>'total_amount')::numeric THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient payment amount',
      'required', v_recovery_cost->>'total_amount',
      'provided', p_amount_usd
    );
  END IF;

  -- Insert payment record
  INSERT INTO domain_payments (
    domain_id,
    user_id,
    amount_usd,
    payment_type,
    payment_provider,
    external_payment_id,
    status,
    completed_at,
    includes_recovery_fee,
    recovery_fee_amount,
    metadata
  ) VALUES (
    p_domain_id,
    v_user_id,
    p_amount_usd,
    p_payment_type,
    p_payment_provider,
    p_external_payment_id,
    'completed',
    now(),
    (v_recovery_cost->>'recovery_fee')::numeric > 0,
    (v_recovery_cost->>'recovery_fee')::numeric,
    p_metadata
  )
  RETURNING id INTO v_payment_id;

  -- Update domain status
  UPDATE domains
  SET
    registrar_status = 'active',
    last_payment_at = now(),
    next_renewal_at = now() + interval '1 month',
    grace_until = NULL,
    redemption_until = NULL,
    locked_until = now() + interval '60 days', -- Anti-transfer lock
    payment_failed_count = 0,
    suspension_reason = NULL
  WHERE id = p_domain_id;

  -- Auto-resolve payment notifications
  PERFORM auto_resolve_notification(v_user_id, 'payment_due', p_domain_id);
  PERFORM auto_resolve_notification(v_user_id, 'payment_overdue', p_domain_id);
  PERFORM auto_resolve_notification(v_user_id, 'domain_grace', p_domain_id);
  PERFORM auto_resolve_notification(v_user_id, 'domain_redemption', p_domain_id);

  -- Create success notification
  PERFORM create_notification_from_template(
    v_user_id,
    'payment_success',
    p_domain_id,
    NULL,
    jsonb_build_object(
      'domain_name', v_domain.fqdn,
      'domain_id', p_domain_id,
      'amount', p_amount_usd
    )
  );

  -- Log event
  INSERT INTO domain_lifecycle_events (
    domain_id,
    event_type,
    old_status,
    new_status,
    triggered_by,
    metadata,
    notes
  ) VALUES (
    p_domain_id,
    'payment_processed',
    v_domain.registrar_status,
    'active',
    'payment_system',
    jsonb_build_object(
      'payment_id', v_payment_id,
      'amount', p_amount_usd,
      'recovery_fee', v_recovery_cost->>'recovery_fee'
    ),
    'Payment processed successfully'
  );

  RETURN jsonb_build_object(
    'success', true,
    'payment_id', v_payment_id,
    'domain_status', 'active',
    'next_renewal', now() + interval '1 month',
    'message', 'Pagamento processado com sucesso! Domínio reativado.'
  );
END;
$$;

-- Step 6: Create function to generate invoice
CREATE OR REPLACE FUNCTION generate_domain_invoice(
  p_domain_id uuid,
  p_due_date timestamptz
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_domain domains%ROWTYPE;
  v_recovery_cost jsonb;
  v_invoice_id uuid;
  v_invoice_number text;
  v_line_items jsonb;
BEGIN
  -- Get domain
  SELECT * INTO v_domain FROM domains WHERE id = p_domain_id;

  IF v_domain IS NULL THEN
    RAISE EXCEPTION 'Domain not found';
  END IF;

  -- Calculate costs
  v_recovery_cost := calculate_recovery_cost(p_domain_id);

  -- Generate invoice number (YYYY-MM-XXXXXX)
  v_invoice_number := to_char(now(), 'YYYY-MM') || '-' ||
                      LPAD(floor(random() * 999999)::text, 6, '0');

  -- Build line items
  v_line_items := jsonb_build_array(
    jsonb_build_object(
      'description', 'Renovação mensal - ' || v_domain.fqdn,
      'amount', v_recovery_cost->>'monthly_fee',
      'type', 'renewal'
    )
  );

  -- Add recovery fee if applicable
  IF (v_recovery_cost->>'recovery_fee')::numeric > 0 THEN
    v_line_items := v_line_items || jsonb_build_array(
      jsonb_build_object(
        'description', 'Taxa de recuperação - ' || v_domain.fqdn,
        'amount', v_recovery_cost->>'recovery_fee',
        'type', 'recovery_fee'
      )
    );
  END IF;

  -- Insert invoice
  INSERT INTO domain_invoices (
    domain_id,
    user_id,
    invoice_number,
    amount_usd,
    due_date,
    status,
    line_items
  ) VALUES (
    p_domain_id,
    v_domain.user_id,
    v_invoice_number,
    (v_recovery_cost->>'total_amount')::numeric,
    p_due_date,
    'open',
    v_line_items
  )
  RETURNING id INTO v_invoice_id;

  RETURN v_invoice_id;
END;
$$;

-- Step 7: Create view for billing dashboard
CREATE OR REPLACE VIEW user_billing_dashboard AS
SELECT
  d.id as domain_id,
  d.fqdn as domain_name,
  d.user_id,
  d.registrar_status as status,
  d.created_at as registered_at,
  d.last_payment_at,
  d.next_renewal_at,
  d.grace_until,
  d.redemption_until,
  d.monthly_fee_usd,
  d.recovery_fee_usd,
  d.auto_renew,

  -- Calculate days until action needed
  CASE
    WHEN d.registrar_status = 'active' AND d.next_renewal_at IS NOT NULL THEN
      EXTRACT(day FROM d.next_renewal_at - now())::integer
    WHEN d.registrar_status = 'grace' AND d.grace_until IS NOT NULL THEN
      EXTRACT(day FROM d.grace_until - now())::integer
    WHEN d.registrar_status = 'redemption' AND d.redemption_until IS NOT NULL THEN
      EXTRACT(day FROM d.redemption_until - now())::integer
    ELSE NULL
  END as days_until_action,

  -- Determine action needed
  CASE
    WHEN d.registrar_status = 'active' THEN 'renew'
    WHEN d.registrar_status IN ('grace', 'redemption', 'registry_hold') THEN 'recover'
    WHEN d.registrar_status = 'auction' THEN 'priority_recover'
    WHEN d.registrar_status = 'pending_delete' THEN 'cannot_recover'
    ELSE 'none'
  END as action_required,

  -- Latest payment
  (
    SELECT jsonb_build_object(
      'amount', dp.amount_usd,
      'status', dp.status,
      'date', dp.created_at
    )
    FROM domain_payments dp
    WHERE dp.domain_id = d.id
    ORDER BY dp.created_at DESC
    LIMIT 1
  ) as latest_payment,

  -- Open invoices
  (
    SELECT COUNT(*)
    FROM domain_invoices di
    WHERE di.domain_id = d.id AND di.status = 'open'
  ) as open_invoices_count

FROM domains d
WHERE d.registrar_status NOT IN ('released', 'cancelled');

-- Step 8: Create indexes
CREATE INDEX IF NOT EXISTS idx_domain_payments_domain ON domain_payments(domain_id, created_at);
CREATE INDEX IF NOT EXISTS idx_domain_payments_user ON domain_payments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_domain_payments_external ON domain_payments(external_payment_id);

CREATE INDEX IF NOT EXISTS idx_domain_invoices_domain ON domain_invoices(domain_id, status);
CREATE INDEX IF NOT EXISTS idx_domain_invoices_user ON domain_invoices(user_id, status);
CREATE INDEX IF NOT EXISTS idx_domain_invoices_due ON domain_invoices(due_date, status);

-- Step 9: Enable RLS
ALTER TABLE domain_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own payments"
  ON domain_payments FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can view their own invoices"
  ON domain_invoices FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all payments"
  ON domain_payments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = auth.uid()
      AND customers.role = 'admin'
    )
  );

CREATE POLICY "Admins can view all invoices"
  ON domain_invoices FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = auth.uid()
      AND customers.role = 'admin'
    )
  );

GRANT SELECT ON user_billing_dashboard TO authenticated;

-- Step 10: Add comments
COMMENT ON TABLE domain_payments IS 'Payment history for domain renewals and recoveries';
COMMENT ON TABLE domain_invoices IS 'Invoice records for domain billing';
COMMENT ON VIEW user_billing_dashboard IS 'Unified view of user billing status and actions';

COMMENT ON FUNCTION calculate_recovery_cost IS 'Calculates total cost to recover domain based on current status';
COMMENT ON FUNCTION process_domain_payment IS 'Processes payment and reactivates domain';
COMMENT ON FUNCTION generate_domain_invoice IS 'Generates invoice for domain renewal/recovery';
