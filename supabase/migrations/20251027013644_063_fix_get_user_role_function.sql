/*
  # Fix User Role Retrieval - Bypass RLS Recursion

  ## Problem
  RLS policies on customers table check for admin role, but to get the role
  we need to read from the same table, creating a circular dependency.

  ## Solution
  Create a SECURITY DEFINER function that bypasses RLS to safely retrieve
  the user's role and subscription info.

  ## Changes
  1. Create `get_user_role_and_subscription` function with SECURITY DEFINER
  2. Function returns role, subscription status, and plan type
  3. Bypasses RLS policies safely by running with elevated privileges
*/

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_user_role_and_subscription(uuid);

-- Create function to get user role and subscription bypassing RLS
CREATE OR REPLACE FUNCTION get_user_role_and_subscription(user_uuid uuid)
RETURNS TABLE(
  role text,
  has_active_subscription boolean,
  subscription_plan text
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(c.role, 'user'::text) as role,
    COALESCE(s.status = 'active', false) as has_active_subscription,
    sp.plan_type as subscription_plan
  FROM customers c
  LEFT JOIN subscriptions s ON s.user_id = c.user_id AND s.status = 'active'
  LEFT JOIN subscription_plans sp ON sp.id = s.plan_id
  WHERE c.user_id = user_uuid
  LIMIT 1;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_role_and_subscription(uuid) TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_user_role_and_subscription IS 
'Safely retrieves user role and subscription info bypassing RLS policies. Used by AuthContext to avoid circular RLS dependencies.';
