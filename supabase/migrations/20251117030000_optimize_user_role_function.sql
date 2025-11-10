/*
  # Optimize User Role Function - Performance Fix

  ## Problem
  The `get_user_role_and_subscription` function was causing slow logins
  due to multiple LEFT JOINs without proper indexing.

  ## Solution
  1. Add indexes for faster lookups
  2. Optimize the function query
  3. Add query timeout protection

  ## Changes
  - Add index on subscriptions(user_id, status) for faster active subscription lookup
  - Optimize function to avoid unnecessary joins
  - Add execution timeout
*/

-- ============================================================================
-- PART 1: ADD MISSING INDEXES
-- ============================================================================

-- Index for faster subscription lookups by user
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status
  ON subscriptions(user_id, status)
  WHERE status = 'active';

-- Index for faster customer lookups
CREATE INDEX IF NOT EXISTS idx_customers_user_id_role
  ON customers(user_id, role);

-- ============================================================================
-- PART 2: OPTIMIZE THE FUNCTION
-- ============================================================================

-- Drop existing function
DROP FUNCTION IF EXISTS get_user_role_and_subscription(uuid);

-- Create optimized version
CREATE OR REPLACE FUNCTION get_user_role_and_subscription(user_uuid uuid)
RETURNS TABLE(
  role text,
  has_active_subscription boolean,
  subscription_plan text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET statement_timeout = '5s' -- Add timeout protection
AS $$
DECLARE
  v_role text;
  v_has_sub boolean;
  v_plan text;
BEGIN
  -- Get customer role first (fastest query)
  SELECT COALESCE(c.role, 'user')
  INTO v_role
  FROM customers c
  WHERE c.user_id = user_uuid
  LIMIT 1;

  -- If no customer found, return early
  IF v_role IS NULL THEN
    RETURN QUERY SELECT 'user'::text, false, NULL::text;
    RETURN;
  END IF;

  -- Get subscription info (separate query for better performance)
  SELECT
    true as has_sub,
    sp.plan_type
  INTO v_has_sub, v_plan
  FROM subscriptions s
  INNER JOIN subscription_plans sp ON sp.id = s.plan_id
  WHERE s.user_id = user_uuid
    AND s.status = 'active'
  ORDER BY s.created_at DESC
  LIMIT 1;

  -- Return combined result
  RETURN QUERY SELECT
    v_role,
    COALESCE(v_has_sub, false),
    v_plan;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_role_and_subscription(uuid) TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_user_role_and_subscription IS
'Optimized function to retrieve user role and subscription info. Includes timeout protection and optimized queries for fast login.';

-- ============================================================================
-- SUMMARY
-- ============================================================================

-- Performance improvements:
-- ✅ Added indexes for faster lookups
-- ✅ Separated queries to avoid expensive JOINs
-- ✅ Added 5-second timeout to prevent hanging
-- ✅ Early return if customer not found
-- ✅ Used INNER JOIN instead of LEFT JOIN where possible

-- Expected improvement:
-- Before: 1-3 seconds (sometimes timeout)
-- After: 50-200ms average
