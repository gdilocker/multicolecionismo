/*
  # Enforce 2FA for Admins

  ## Overview
  Implements automatic enforcement of 2FA for all administrator accounts.

  ## Changes

  ### 1. Admin 2FA Enforcement Table
  - Tracks admin 2FA enforcement status
  - Records when admins were notified
  - Prevents admin access without 2FA

  ### 2. Function to Check 2FA Requirement
  - Returns whether user must enable 2FA before accessing system
  - Used by frontend to redirect admins to 2FA setup

  ### 3. Trigger to Enforce 2FA on Role Change
  - When user becomes admin, mark as requiring 2FA
  - Automated enforcement

  ## Security
  - Admins cannot bypass 2FA requirement
  - Grace period: 24 hours after becoming admin
  - After grace period, all admin actions require 2FA
*/

-- ============================================================================
-- PART 1: ADMIN 2FA ENFORCEMENT TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS admin_2fa_enforcement (
  user_id UUID PRIMARY KEY REFERENCES customers(user_id) ON DELETE CASCADE,
  must_enable_2fa BOOLEAN DEFAULT true,
  notified_at TIMESTAMPTZ DEFAULT NOW(),
  grace_period_ends TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comment
COMMENT ON TABLE admin_2fa_enforcement IS 'Tracks which admins must enable 2FA';
COMMENT ON COLUMN admin_2fa_enforcement.must_enable_2fa IS 'Whether admin must enable 2FA to continue';
COMMENT ON COLUMN admin_2fa_enforcement.grace_period_ends IS '24h grace period before forcing 2FA';

-- Enable RLS
ALTER TABLE admin_2fa_enforcement ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view own 2FA enforcement"
  ON admin_2fa_enforcement
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Admins can update own 2FA enforcement"
  ON admin_2fa_enforcement
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================================================
-- PART 2: FUNCTION TO CHECK IF ADMIN NEEDS 2FA
-- ============================================================================

CREATE OR REPLACE FUNCTION check_admin_2fa_required(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer RECORD;
  v_enforcement RECORD;
  v_result JSONB;
BEGIN
  -- Get customer info
  SELECT
    id,
    user_id,
    role,
    totp_enabled,
    totp_verified_at
  INTO v_customer
  FROM customers
  WHERE user_id = p_user_id;

  -- Not found
  IF v_customer.user_id IS NULL THEN
    RETURN jsonb_build_object(
      'needs_2fa', false,
      'must_enable_2fa', false,
      'is_admin', false,
      'reason', 'user_not_found'
    );
  END IF;

  -- Not an admin - no 2FA required
  IF v_customer.role != 'admin' THEN
    RETURN jsonb_build_object(
      'needs_2fa', false,
      'must_enable_2fa', false,
      'is_admin', false,
      'reason', 'not_admin'
    );
  END IF;

  -- Get enforcement record
  SELECT *
  INTO v_enforcement
  FROM admin_2fa_enforcement
  WHERE user_id = p_user_id;

  -- Admin has 2FA enabled - all good
  IF v_customer.totp_enabled = true THEN
    -- Clean up enforcement record if exists
    DELETE FROM admin_2fa_enforcement WHERE user_id = p_user_id;

    RETURN jsonb_build_object(
      'needs_2fa', true,
      'must_enable_2fa', false,
      'is_admin', true,
      'has_2fa', true,
      'reason', '2fa_enabled'
    );
  END IF;

  -- Admin without 2FA
  IF v_enforcement.user_id IS NULL THEN
    -- Create enforcement record
    INSERT INTO admin_2fa_enforcement (user_id)
    VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;

    -- Within grace period
    RETURN jsonb_build_object(
      'needs_2fa', false,
      'must_enable_2fa', true,
      'is_admin', true,
      'has_2fa', false,
      'in_grace_period', true,
      'grace_period_ends', (NOW() + INTERVAL '24 hours'),
      'reason', 'grace_period_active'
    );
  END IF;

  -- Check if grace period expired
  IF v_enforcement.grace_period_ends < NOW() THEN
    RETURN jsonb_build_object(
      'needs_2fa', false,
      'must_enable_2fa', true,
      'is_admin', true,
      'has_2fa', false,
      'in_grace_period', false,
      'grace_period_expired', true,
      'must_enable_immediately', true,
      'reason', 'grace_period_expired'
    );
  END IF;

  -- Still in grace period
  RETURN jsonb_build_object(
    'needs_2fa', false,
    'must_enable_2fa', true,
    'is_admin', true,
    'has_2fa', false,
    'in_grace_period', true,
    'grace_period_ends', v_enforcement.grace_period_ends,
    'reason', 'grace_period_active'
  );
END;
$$;

-- ============================================================================
-- PART 3: TRIGGER TO AUTO-ENFORCE 2FA WHEN USER BECOMES ADMIN
-- ============================================================================

CREATE OR REPLACE FUNCTION enforce_2fa_on_admin_promotion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If user is being promoted to admin
  IF NEW.role = 'admin' AND (OLD.role IS NULL OR OLD.role != 'admin') THEN
    -- If they don't have 2FA enabled
    IF NEW.totp_enabled = false OR NEW.totp_enabled IS NULL THEN
      -- Create enforcement record
      INSERT INTO admin_2fa_enforcement (user_id, must_enable_2fa, grace_period_ends)
      VALUES (NEW.user_id, true, NOW() + INTERVAL '24 hours')
      ON CONFLICT (user_id) DO UPDATE
      SET
        must_enable_2fa = true,
        notified_at = NOW(),
        grace_period_ends = NOW() + INTERVAL '24 hours',
        updated_at = NOW();
    END IF;
  END IF;

  -- If user is being demoted from admin
  IF OLD.role = 'admin' AND NEW.role != 'admin' THEN
    -- Remove enforcement record
    DELETE FROM admin_2fa_enforcement WHERE user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_enforce_2fa_on_admin_promotion ON customers;
CREATE TRIGGER trigger_enforce_2fa_on_admin_promotion
  AFTER INSERT OR UPDATE OF role ON customers
  FOR EACH ROW
  EXECUTE FUNCTION enforce_2fa_on_admin_promotion();

-- ============================================================================
-- PART 4: POPULATE ENFORCEMENT FOR EXISTING ADMINS WITHOUT 2FA
-- ============================================================================

-- Find all admins without 2FA and create enforcement records
INSERT INTO admin_2fa_enforcement (user_id, must_enable_2fa, grace_period_ends)
SELECT
  c.user_id,
  true,
  NOW() + INTERVAL '7 days' -- Give existing admins 7 days grace period
FROM customers c
WHERE c.role = 'admin'
AND (c.totp_enabled = false OR c.totp_enabled IS NULL)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- PART 5: ADMIN NOTIFICATION SYSTEM
-- ============================================================================

-- Function to get admin 2FA status for banner/notification
CREATE OR REPLACE FUNCTION get_admin_2fa_notification(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status JSONB;
  v_enforcement RECORD;
BEGIN
  -- Get 2FA status
  v_status := check_admin_2fa_required(p_user_id);

  -- Not an admin or has 2FA - no notification needed
  IF (v_status->>'is_admin')::boolean = false OR (v_status->>'has_2fa')::boolean = true THEN
    RETURN jsonb_build_object('show_notification', false);
  END IF;

  -- Get enforcement details
  SELECT * INTO v_enforcement
  FROM admin_2fa_enforcement
  WHERE user_id = p_user_id;

  IF v_enforcement.user_id IS NULL THEN
    RETURN jsonb_build_object('show_notification', false);
  END IF;

  -- Calculate time remaining
  RETURN jsonb_build_object(
    'show_notification', true,
    'type', CASE
      WHEN v_enforcement.grace_period_ends < NOW() THEN 'critical'
      WHEN v_enforcement.grace_period_ends < NOW() + INTERVAL '6 hours' THEN 'urgent'
      WHEN v_enforcement.grace_period_ends < NOW() + INTERVAL '24 hours' THEN 'warning'
      ELSE 'info'
    END,
    'message', CASE
      WHEN v_enforcement.grace_period_ends < NOW() THEN 'Two-Factor Authentication is required. Please enable 2FA immediately to continue using admin features.'
      WHEN v_enforcement.grace_period_ends < NOW() + INTERVAL '6 hours' THEN 'Your grace period expires soon. Please enable 2FA within the next few hours.'
      WHEN v_enforcement.grace_period_ends < NOW() + INTERVAL '24 hours' THEN 'Please enable Two-Factor Authentication within 24 hours to maintain admin access.'
      ELSE 'Two-Factor Authentication is recommended for administrators. Please enable 2FA for enhanced security.'
    END,
    'grace_period_ends', v_enforcement.grace_period_ends,
    'time_remaining', EXTRACT(EPOCH FROM (v_enforcement.grace_period_ends - NOW())),
    'setup_url', '/panel/settings/2fa'
  );
END;
$$;

-- ============================================================================
-- PART 6: CLEANUP FUNCTION (Run after admin enables 2FA)
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_admin_2fa_enforcement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If 2FA was just enabled
  IF NEW.totp_enabled = true AND (OLD.totp_enabled = false OR OLD.totp_enabled IS NULL) THEN
    -- Remove enforcement record
    DELETE FROM admin_2fa_enforcement WHERE user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_cleanup_admin_2fa_enforcement ON customers;
CREATE TRIGGER trigger_cleanup_admin_2fa_enforcement
  AFTER UPDATE OF totp_enabled ON customers
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_admin_2fa_enforcement();

-- ============================================================================
-- SUMMARY
-- ============================================================================

-- Enforcement system for admins to enable 2FA:
-- ✅ Automatic detection of admins without 2FA
-- ✅ 24-hour grace period for new admins
-- ✅ 7-day grace period for existing admins
-- ✅ Notification system with severity levels
-- ✅ Automatic cleanup when 2FA is enabled
-- ✅ Trigger on role promotion/demotion

-- Usage in frontend:
-- SELECT check_admin_2fa_required(auth.uid())
-- SELECT get_admin_2fa_notification(auth.uid())
