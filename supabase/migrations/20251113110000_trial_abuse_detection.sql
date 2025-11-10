/*
  # Trial Abuse Detection System

  1. New Tables
    - `fraud_signals` - Store fraud detection signals
    - `blocked_trials` - Block specific identifiers from trials

  2. Functions
    - `normalize_email()` - Normalize email (remove +, dots)
    - `normalize_phone()` - Normalize phone numbers
    - `check_trial_abuse()` - Detect trial abuse patterns
    - `record_fraud_signal()` - Record fraud signal
    - `block_from_trial()` - Block identifier from trials

  3. Security
    - Enable RLS
    - Admin-only access
*/

CREATE TABLE IF NOT EXISTS fraud_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email_raw text,
  email_normalized text,
  email_hash text,
  phone_raw text,
  phone_normalized text,
  phone_hash text,
  ip_address inet,
  user_agent text,
  device_fingerprint text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS blocked_trials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier_type text CHECK (identifier_type IN ('email', 'phone', 'ip', 'fingerprint')) NOT NULL,
  identifier_hash text NOT NULL,
  reason text,
  blocked_at timestamptz DEFAULT now(),
  blocked_by uuid REFERENCES auth.users(id),
  expires_at timestamptz,
  notes text
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_fraud_signals_user ON fraud_signals(user_id);
CREATE INDEX IF NOT EXISTS idx_fraud_signals_email_hash ON fraud_signals(email_hash);
CREATE INDEX IF NOT EXISTS idx_fraud_signals_phone_hash ON fraud_signals(phone_hash) WHERE phone_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_fraud_signals_ip ON fraud_signals(ip_address) WHERE ip_address IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_fraud_signals_fingerprint ON fraud_signals(device_fingerprint) WHERE device_fingerprint IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_fraud_signals_created ON fraud_signals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blocked_trials_hash ON blocked_trials(identifier_hash);
CREATE INDEX IF NOT EXISTS idx_blocked_trials_expires ON blocked_trials(expires_at) WHERE expires_at IS NOT NULL;

-- RLS
ALTER TABLE fraud_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_trials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view fraud signals"
  ON fraud_signals FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM customers WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can manage blocked trials"
  ON blocked_trials FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM customers WHERE user_id = auth.uid() AND role = 'admin'));

-- Normalize email function
CREATE OR REPLACE FUNCTION normalize_email(p_email text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_normalized text;
BEGIN
  v_normalized := lower(trim(p_email));
  v_normalized := regexp_replace(v_normalized, '\+[^@]*@', '@');

  IF v_normalized LIKE '%@gmail.com' OR v_normalized LIKE '%@googlemail.com' THEN
    v_normalized := regexp_replace(regexp_replace(v_normalized, '\.', '', 'g'), '(.*)@', '\1@');
  END IF;

  RETURN v_normalized;
END;
$$;

-- Normalize phone function
CREATE OR REPLACE FUNCTION normalize_phone(p_phone text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN regexp_replace(p_phone, '[^0-9]', '', 'g');
END;
$$;

-- Check trial abuse function
CREATE OR REPLACE FUNCTION check_trial_abuse(
  p_email text,
  p_phone text DEFAULT NULL,
  p_ip inet DEFAULT NULL,
  p_device_fingerprint text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_email_normalized text;
  v_email_hash text;
  v_phone_normalized text;
  v_phone_hash text;
  v_abuse_score int := 0;
  v_abuse_reasons text[] := ARRAY[]::text[];
  v_previous_trials int;
  v_is_blocked boolean := false;
BEGIN
  v_email_normalized := normalize_email(p_email);
  v_email_hash := encode(digest(v_email_normalized, 'sha256'), 'hex');

  IF p_phone IS NOT NULL THEN
    v_phone_normalized := normalize_phone(p_phone);
    v_phone_hash := encode(digest(v_phone_normalized, 'sha256'), 'hex');
  END IF;

  -- Check explicit blocks
  SELECT EXISTS (
    SELECT 1 FROM blocked_trials
    WHERE identifier_hash IN (
      v_email_hash,
      v_phone_hash,
      encode(digest(p_ip::text, 'sha256'), 'hex'),
      encode(digest(p_device_fingerprint, 'sha256'), 'hex')
    )
    AND (expires_at IS NULL OR expires_at > now())
  ) INTO v_is_blocked;

  IF v_is_blocked THEN
    RETURN jsonb_build_object(
      'is_abuse', true,
      'score', 100,
      'reasons', ARRAY['Explicitly blocked from trials'],
      'should_block', true
    );
  END IF;

  -- Check email
  SELECT COUNT(*) INTO v_previous_trials
  FROM fraud_signals fs
  JOIN subscriptions s ON s.user_id = fs.user_id
  WHERE fs.email_hash = v_email_hash
    AND s.plan_code = 'prime'
    AND s.status IN ('trial', 'cancelled', 'expired')
    AND fs.created_at > now() - interval '90 days';

  IF v_previous_trials > 0 THEN
    v_abuse_score := v_abuse_score + (v_previous_trials * 40);
    v_abuse_reasons := array_append(v_abuse_reasons, format('%s previous trials with same email', v_previous_trials));
  END IF;

  -- Check IP
  IF p_ip IS NOT NULL THEN
    SELECT COUNT(*) INTO v_previous_trials
    FROM fraud_signals fs
    JOIN subscriptions s ON s.user_id = fs.user_id
    WHERE fs.ip_address = p_ip
      AND s.plan_code = 'prime'
      AND s.status IN ('trial', 'cancelled', 'expired')
      AND fs.created_at > now() - interval '90 days';

    IF v_previous_trials > 0 THEN
      v_abuse_score := v_abuse_score + (v_previous_trials * 30);
      v_abuse_reasons := array_append(v_abuse_reasons, format('%s previous trials from same IP', v_previous_trials));
    END IF;
  END IF;

  -- Check device fingerprint
  IF p_device_fingerprint IS NOT NULL THEN
    SELECT COUNT(*) INTO v_previous_trials
    FROM fraud_signals fs
    JOIN subscriptions s ON s.user_id = fs.user_id
    WHERE fs.device_fingerprint = p_device_fingerprint
      AND s.plan_code = 'prime'
      AND s.status IN ('trial', 'cancelled', 'expired')
      AND fs.created_at > now() - interval '90 days';

    IF v_previous_trials > 0 THEN
      v_abuse_score := v_abuse_score + (v_previous_trials * 35);
      v_abuse_reasons := array_append(v_abuse_reasons, format('%s previous trials from same device', v_previous_trials));
    END IF;
  END IF;

  -- Check phone
  IF p_phone IS NOT NULL THEN
    SELECT COUNT(*) INTO v_previous_trials
    FROM fraud_signals fs
    JOIN subscriptions s ON s.user_id = fs.user_id
    WHERE fs.phone_hash = v_phone_hash
      AND s.plan_code = 'prime'
      AND s.status IN ('trial', 'cancelled', 'expired')
      AND fs.created_at > now() - interval '90 days';

    IF v_previous_trials > 0 THEN
      v_abuse_score := v_abuse_score + (v_previous_trials * 45);
      v_abuse_reasons := array_append(v_abuse_reasons, format('%s previous trials with same phone', v_previous_trials));
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'is_abuse', v_abuse_score >= 50,
    'score', v_abuse_score,
    'reasons', v_abuse_reasons,
    'should_block', v_abuse_score >= 100
  );
END;
$$;

-- Record fraud signal
CREATE OR REPLACE FUNCTION record_fraud_signal(
  p_user_id uuid,
  p_email text,
  p_phone text DEFAULT NULL,
  p_ip inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_device_fingerprint text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_signal_id uuid;
BEGIN
  INSERT INTO fraud_signals (
    user_id,
    email_raw,
    email_normalized,
    email_hash,
    phone_raw,
    phone_normalized,
    phone_hash,
    ip_address,
    user_agent,
    device_fingerprint
  ) VALUES (
    p_user_id,
    p_email,
    normalize_email(p_email),
    encode(digest(normalize_email(p_email), 'sha256'), 'hex'),
    p_phone,
    CASE WHEN p_phone IS NOT NULL THEN normalize_phone(p_phone) ELSE NULL END,
    CASE WHEN p_phone IS NOT NULL THEN encode(digest(normalize_phone(p_phone), 'sha256'), 'hex') ELSE NULL END,
    p_ip,
    p_user_agent,
    p_device_fingerprint
  ) RETURNING id INTO v_signal_id;

  RETURN v_signal_id;
END;
$$;

-- Block from trial function
CREATE OR REPLACE FUNCTION block_from_trial(
  p_identifier_type text,
  p_identifier text,
  p_reason text,
  p_days int DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_block_id uuid;
  v_hash text;
BEGIN
  v_hash := CASE p_identifier_type
    WHEN 'email' THEN encode(digest(normalize_email(p_identifier), 'sha256'), 'hex')
    WHEN 'phone' THEN encode(digest(normalize_phone(p_identifier), 'sha256'), 'hex')
    WHEN 'ip' THEN encode(digest(p_identifier, 'sha256'), 'hex')
    WHEN 'fingerprint' THEN encode(digest(p_identifier, 'sha256'), 'hex')
    ELSE NULL
  END;

  IF v_hash IS NULL THEN
    RAISE EXCEPTION 'Invalid identifier type: %', p_identifier_type;
  END IF;

  INSERT INTO blocked_trials (
    identifier_type,
    identifier_hash,
    reason,
    blocked_by,
    expires_at
  ) VALUES (
    p_identifier_type,
    v_hash,
    p_reason,
    auth.uid(),
    CASE WHEN p_days IS NOT NULL THEN now() + (p_days || ' days')::interval ELSE NULL END
  ) RETURNING id INTO v_block_id;

  RETURN v_block_id;
END;
$$;

-- View for admin dashboard
CREATE OR REPLACE VIEW fraud_detection_summary AS
SELECT
  fs.email_normalized,
  COUNT(DISTINCT fs.user_id) as accounts_created,
  COUNT(DISTINCT s.id) as trial_attempts,
  SUM(CASE WHEN s.status = 'trial' THEN 1 ELSE 0 END) as active_trials,
  SUM(CASE WHEN s.status = 'active' AND s.plan_code = 'prime' THEN 1 ELSE 0 END) as converted_to_paid,
  MAX(fs.created_at) as last_attempt,
  ARRAY_AGG(DISTINCT fs.ip_address::text) FILTER (WHERE fs.ip_address IS NOT NULL) as ip_addresses
FROM fraud_signals fs
LEFT JOIN subscriptions s ON s.user_id = fs.user_id AND s.plan_code = 'prime'
WHERE fs.created_at > now() - interval '90 days'
GROUP BY fs.email_normalized
HAVING COUNT(DISTINCT fs.user_id) > 1 OR COUNT(DISTINCT s.id) > 1
ORDER BY accounts_created DESC, trial_attempts DESC;
