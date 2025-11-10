/*
  # Payment Reconciliation System

  1. New Tables
    - `payment_reconciliation_log`
      - Tracks all reconciliation attempts
      - Stores execution metrics
    - `payment_discrepancies`
      - Records found discrepancies
      - Tracks resolution status

  2. Functions
    - `log_reconciliation_attempt()` - Log reconciliation execution
    - `mark_discrepancy_resolved()` - Mark discrepancy as resolved

  3. Security
    - Enable RLS on all tables
    - Admin-only access policies
*/

-- Log de tentativas de reconciliação
CREATE TABLE IF NOT EXISTS payment_reconciliation_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  status text CHECK (status IN ('running', 'completed', 'failed')) NOT NULL,
  paypal_transactions_checked int DEFAULT 0,
  db_orders_checked int DEFAULT 0,
  discrepancies_found int DEFAULT 0,
  discrepancies_resolved int DEFAULT 0,
  error_message text,
  execution_time_ms int
);

-- Discrepâncias encontradas
CREATE TABLE IF NOT EXISTS payment_discrepancies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reconciliation_id uuid REFERENCES payment_reconciliation_log(id),
  discrepancy_type text CHECK (discrepancy_type IN (
    'missing_in_db',
    'status_mismatch',
    'amount_mismatch',
    'duplicate_payment'
  )) NOT NULL,
  paypal_transaction_id text NOT NULL,
  paypal_amount numeric(10,2),
  paypal_status text,
  db_order_id uuid REFERENCES orders(id),
  db_amount numeric(10,2),
  db_status text,
  auto_resolved boolean DEFAULT false,
  resolution_action text,
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reconciliation_log_started ON payment_reconciliation_log(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_discrepancies_resolved ON payment_discrepancies(auto_resolved, resolved_at);
CREATE INDEX IF NOT EXISTS idx_discrepancies_paypal_id ON payment_discrepancies(paypal_transaction_id);
CREATE INDEX IF NOT EXISTS idx_discrepancies_db_order ON payment_discrepancies(db_order_id) WHERE db_order_id IS NOT NULL;

-- RLS
ALTER TABLE payment_reconciliation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_discrepancies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view reconciliation logs"
  ON payment_reconciliation_log FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers c
      WHERE c.user_id = auth.uid() AND c.role = 'admin'
    )
  );

CREATE POLICY "Admins can view discrepancies"
  ON payment_discrepancies FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers c
      WHERE c.user_id = auth.uid() AND c.role = 'admin'
    )
  );

-- Função helper para log
CREATE OR REPLACE FUNCTION log_reconciliation_attempt(
  p_status text,
  p_paypal_checked int DEFAULT 0,
  p_db_checked int DEFAULT 0,
  p_discrepancies_found int DEFAULT 0,
  p_discrepancies_resolved int DEFAULT 0,
  p_execution_time_ms int DEFAULT 0,
  p_error_message text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log_id uuid;
BEGIN
  INSERT INTO payment_reconciliation_log (
    status,
    paypal_transactions_checked,
    db_orders_checked,
    discrepancies_found,
    discrepancies_resolved,
    execution_time_ms,
    error_message,
    completed_at
  ) VALUES (
    p_status,
    p_paypal_checked,
    p_db_checked,
    p_discrepancies_found,
    p_discrepancies_resolved,
    p_execution_time_ms,
    p_error_message,
    now()
  ) RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- Função para marcar discrepância como resolvida
CREATE OR REPLACE FUNCTION mark_discrepancy_resolved(
  p_discrepancy_id uuid,
  p_resolution_action text,
  p_notes text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE payment_discrepancies
  SET
    resolved_at = now(),
    resolved_by = auth.uid(),
    resolution_action = p_resolution_action,
    notes = COALESCE(p_notes, notes)
  WHERE id = p_discrepancy_id;

  RETURN FOUND;
END;
$$;
