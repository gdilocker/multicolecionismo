/*
  # Create get_user_role_and_subscription function (FIXED)

  1. Changes
    - Add indexes for faster lookups
    - Create function to get user role and subscription status
    - Uses correct table name: user_subscriptions (not subscriptions)
    - Grant execute permission to authenticated users
  
  2. Notes
    - This function is used by AuthContext to load user role
    - Optimized for performance with indexes and timeout protection
    - Admin users should ALWAYS have access regardless of subscription
*/

-- Index for faster subscription lookups by user
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_status
  ON user_subscriptions(user_id, status)
  WHERE status = 'active';

-- Index for faster customer lookups
CREATE INDEX IF NOT EXISTS idx_customers_user_id_role
  ON customers(user_id, role);

-- Drop existing function if exists
DROP FUNCTION IF EXISTS get_user_role_and_subscription(uuid);

-- Create function with correct table names
CREATE OR REPLACE FUNCTION get_user_role_and_subscription(user_uuid uuid)
RETURNS TABLE(
  role text,
  has_active_subscription boolean,
  subscription_plan text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET statement_timeout = '5s'
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

  -- If no customer found, return default user role
  IF v_role IS NULL THEN
    v_role := 'user';
  END IF;

  -- Get subscription info (separate query for better performance)
  SELECT
    true as has_sub,
    sp.plan_type
  INTO v_has_sub, v_plan
  FROM user_subscriptions s
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
GRANT EXECUTE ON FUNCTION get_user_role_and_subscription(uuid) TO anon;
