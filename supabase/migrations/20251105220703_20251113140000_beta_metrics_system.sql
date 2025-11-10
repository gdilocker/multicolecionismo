/*
  # Beta Metrics Collection System

  1. New Tables
    - `beta_metrics_snapshots` - Stores periodic metric snapshots
    - `beta_events_log` - Logs important events

  2. Functions
    - `collect_beta_metrics()` - Collects current metrics
    - `get_beta_report_data()` - Generates report data

  3. Security
    - Admin-only access
*/

-- Snapshots table for time-series metrics
CREATE TABLE IF NOT EXISTS beta_metrics_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_time timestamptz DEFAULT now(),
  
  -- User metrics
  total_users int,
  active_users_24h int,
  new_users_24h int,
  trial_users int,
  paid_users int,
  
  -- Payment metrics
  total_orders int,
  orders_24h int,
  successful_payments int,
  failed_payments int,
  pending_payments int,
  payment_success_rate numeric(5,2),
  
  -- Fraud metrics
  fraud_checks_24h int,
  fraud_flagged_24h int,
  fraud_blocked_24h int,
  fraud_score_avg numeric(5,2),
  
  -- System metrics
  total_domains int,
  active_domains int,
  reconciliation_runs_24h int,
  discrepancies_found_24h int,
  discrepancies_resolved_24h int,
  
  -- Performance metrics
  avg_response_time_ms int,
  error_count_24h int,
  
  created_at timestamptz DEFAULT now()
);

-- Events log for important occurrences
CREATE TABLE IF NOT EXISTS beta_events_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text CHECK (event_type IN (
    'user_signup',
    'payment_success',
    'payment_failed',
    'fraud_blocked',
    'limit_hit',
    'domain_transfer',
    'error_occurred',
    'milestone_reached'
  )) NOT NULL,
  severity text CHECK (severity IN ('info', 'warning', 'error', 'critical')) DEFAULT 'info',
  user_id uuid REFERENCES auth.users(id),
  description text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_metrics_snapshots_time ON beta_metrics_snapshots(snapshot_time DESC);
CREATE INDEX IF NOT EXISTS idx_events_log_type ON beta_events_log(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_log_severity ON beta_events_log(severity, created_at DESC);

-- RLS
ALTER TABLE beta_metrics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE beta_events_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view metrics snapshots"
  ON beta_metrics_snapshots FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM customers WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can view events log"
  ON beta_events_log FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM customers WHERE user_id = auth.uid() AND role = 'admin'));

-- Function to collect current metrics
CREATE OR REPLACE FUNCTION collect_beta_metrics()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_snapshot_id uuid;
  v_payment_success_rate numeric(5,2);
BEGIN
  -- Calculate payment success rate
  SELECT 
    CASE 
      WHEN COUNT(*) = 0 THEN 100.00
      ELSE (COUNT(*) FILTER (WHERE status = 'completed') * 100.0 / COUNT(*))
    END
  INTO v_payment_success_rate
  FROM orders
  WHERE created_at > now() - interval '24 hours';

  -- Insert snapshot
  INSERT INTO beta_metrics_snapshots (
    total_users,
    active_users_24h,
    new_users_24h,
    trial_users,
    paid_users,
    total_orders,
    orders_24h,
    successful_payments,
    failed_payments,
    pending_payments,
    payment_success_rate,
    fraud_checks_24h,
    fraud_flagged_24h,
    fraud_blocked_24h,
    fraud_score_avg,
    total_domains,
    active_domains,
    reconciliation_runs_24h,
    discrepancies_found_24h,
    discrepancies_resolved_24h,
    error_count_24h
  ) VALUES (
    (SELECT COUNT(*) FROM auth.users),
    (SELECT COUNT(DISTINCT user_id) FROM subscriptions WHERE updated_at > now() - interval '24 hours'),
    (SELECT COUNT(*) FROM auth.users WHERE created_at > now() - interval '24 hours'),
    (SELECT COUNT(*) FROM subscriptions WHERE status = 'trial'),
    (SELECT COUNT(*) FROM subscriptions WHERE status = 'active' AND is_trial = false),
    (SELECT COUNT(*) FROM orders),
    (SELECT COUNT(*) FROM orders WHERE created_at > now() - interval '24 hours'),
    (SELECT COUNT(*) FROM orders WHERE status = 'completed' AND created_at > now() - interval '24 hours'),
    (SELECT COUNT(*) FROM orders WHERE status = 'failed' AND created_at > now() - interval '24 hours'),
    (SELECT COUNT(*) FROM orders WHERE status = 'pending' AND created_at > now() - interval '24 hours'),
    v_payment_success_rate,
    (SELECT COUNT(*) FROM fraud_signals WHERE created_at > now() - interval '24 hours'),
    0, -- Will be calculated when fraud detection is active
    (SELECT COUNT(*) FROM blocked_trials WHERE blocked_at > now() - interval '24 hours'),
    0.0, -- Will be calculated when fraud detection is active
    (SELECT COUNT(*) FROM domains),
    (SELECT COUNT(*) FROM domains WHERE status = 'active'),
    (SELECT COUNT(*) FROM payment_reconciliation_log WHERE started_at > now() - interval '24 hours'),
    (SELECT COALESCE(SUM(discrepancies_found), 0) FROM payment_reconciliation_log WHERE started_at > now() - interval '24 hours'),
    (SELECT COALESCE(SUM(discrepancies_resolved), 0) FROM payment_reconciliation_log WHERE started_at > now() - interval '24 hours'),
    0 -- Will be populated from error tracking
  ) RETURNING id INTO v_snapshot_id;

  RETURN v_snapshot_id;
END;
$$;

-- Function to log events
CREATE OR REPLACE FUNCTION log_beta_event(
  p_event_type text,
  p_severity text DEFAULT 'info',
  p_user_id uuid DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event_id uuid;
BEGIN
  INSERT INTO beta_events_log (
    event_type,
    severity,
    user_id,
    description,
    metadata
  ) VALUES (
    p_event_type,
    p_severity,
    p_user_id,
    p_description,
    p_metadata
  ) RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$;

-- View for easy report generation
CREATE OR REPLACE VIEW beta_metrics_latest AS
SELECT
  bms.*,
  bms.snapshot_time as collected_at
FROM beta_metrics_snapshots bms
ORDER BY bms.snapshot_time DESC
LIMIT 1;

-- View for 24h comparison
CREATE OR REPLACE VIEW beta_metrics_24h_comparison AS
WITH latest AS (
  SELECT * FROM beta_metrics_snapshots
  ORDER BY snapshot_time DESC
  LIMIT 1
),
previous AS (
  SELECT * FROM beta_metrics_snapshots
  WHERE snapshot_time < (SELECT snapshot_time FROM latest) - interval '24 hours'
  ORDER BY snapshot_time DESC
  LIMIT 1
)
SELECT
  latest.snapshot_time as current_time,
  previous.snapshot_time as previous_time,
  latest.total_users - COALESCE(previous.total_users, 0) as users_growth,
  latest.payment_success_rate,
  latest.fraud_blocked_24h,
  latest.discrepancies_found_24h,
  latest.discrepancies_resolved_24h
FROM latest
LEFT JOIN previous ON true;
