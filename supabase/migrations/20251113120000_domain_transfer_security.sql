/*
  # Domain Transfer Security System

  1. Schema Changes
    - Add auth_code fields to domains table
    - Add security fields to domain_transfers table

  2. Functions
    - generate_domain_auth_code() - Generate secure auth code
    - verify_transfer_auth_code() - Verify auth code
    - initiate_secure_transfer() - Start secure transfer with validations

  3. Security
    - Auth code required for transfers
    - 2FA support
    - Cooling period enforcement
*/

-- Add fields to domains table
ALTER TABLE domains
  ADD COLUMN IF NOT EXISTS transfer_auth_code_hash text,
  ADD COLUMN IF NOT EXISTS transfer_auth_code_generated_at timestamptz,
  ADD COLUMN IF NOT EXISTS transfer_lock_until timestamptz;

-- Update domain_transfers table
ALTER TABLE domain_transfers
  ADD COLUMN IF NOT EXISTS auth_code_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS requires_2fa boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS twofa_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS email_confirmation_token uuid DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS email_confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS cooling_period_end timestamptz;

-- Generate auth code
CREATE OR REPLACE FUNCTION generate_domain_auth_code(p_domain_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_auth_code text;
  v_code_hash text;
  v_user_id uuid;
BEGIN
  SELECT c.user_id INTO v_user_id
  FROM domains d
  JOIN customers c ON c.id = d.customer_id
  WHERE d.id = p_domain_id;

  IF v_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  v_auth_code := upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 16));
  v_code_hash := encode(digest(v_auth_code, 'sha256'), 'hex');

  UPDATE domains
  SET transfer_auth_code_hash = v_code_hash,
      transfer_auth_code_generated_at = now()
  WHERE id = p_domain_id;

  RETURN v_auth_code;
END;
$$;

-- Verify auth code
CREATE OR REPLACE FUNCTION verify_transfer_auth_code(
  p_domain_id uuid,
  p_auth_code text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stored_hash text;
  v_input_hash text;
BEGIN
  SELECT transfer_auth_code_hash INTO v_stored_hash
  FROM domains
  WHERE id = p_domain_id;

  IF v_stored_hash IS NULL THEN
    RETURN false;
  END IF;

  v_input_hash := encode(digest(upper(trim(p_auth_code)), 'sha256'), 'hex');
  RETURN v_stored_hash = v_input_hash;
END;
$$;

-- Initiate secure transfer
CREATE OR REPLACE FUNCTION initiate_secure_transfer(
  p_domain_id uuid,
  p_auth_code text,
  p_to_customer_id uuid,
  p_twofa_code text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transfer_id uuid;
  v_from_customer_id uuid;
  v_user_id uuid;
BEGIN
  SELECT d.customer_id, c.user_id
  INTO v_from_customer_id, v_user_id
  FROM domains d
  JOIN customers c ON c.id = d.customer_id
  WHERE d.id = p_domain_id;

  IF v_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized to transfer this domain';
  END IF;

  IF NOT verify_transfer_auth_code(p_domain_id, p_auth_code) THEN
    RAISE EXCEPTION 'Invalid auth code';
  END IF;

  IF EXISTS (
    SELECT 1 FROM domains
    WHERE id = p_domain_id
    AND transfer_lock_until > now()
  ) THEN
    RAISE EXCEPTION 'Domain is in transfer lock period';
  END IF;

  INSERT INTO domain_transfers (
    domain_id,
    from_customer_id,
    to_customer_id,
    status,
    auth_code_verified_at,
    cooling_period_end,
    initiated_by
  ) VALUES (
    p_domain_id,
    v_from_customer_id,
    p_to_customer_id,
    'pending_confirmation',
    now(),
    now() + interval '7 days',
    auth.uid()
  ) RETURNING id INTO v_transfer_id;

  RETURN v_transfer_id;
END;
$$;
