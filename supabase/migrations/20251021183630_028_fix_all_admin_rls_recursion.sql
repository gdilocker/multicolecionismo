/*
  # Fix RLS Recursion Across All Tables

  1. Problem
    - Many tables check customers table to verify admin role
    - This creates infinite recursion when AuthContext tries to load user data
    - Error: "infinite recursion detected in policy for relation customers"

  2. Solution
    - Create a helper function that checks admin role without causing recursion
    - Use SECURITY DEFINER to bypass RLS when checking role
    - Update all policies to use this helper function

  3. Changes
    - Create is_admin() helper function
    - Update all admin policies across all tables
    - Maintain security while eliminating recursion
*/

-- Create helper function to check if user is admin (bypasses RLS)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM customers
    WHERE user_id = auth.uid()
    AND role = 'admin'
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

-- Fix audit_logs policies
DROP POLICY IF EXISTS "Admins can read all audit logs" ON audit_logs;
CREATE POLICY "Admins can read all audit logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- Fix physical_cards policies
DROP POLICY IF EXISTS "Admins can manage all physical cards" ON physical_cards;
CREATE POLICY "Admins can manage all physical cards"
  ON physical_cards
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Fix pricing_plans policies
DROP POLICY IF EXISTS "Only admins can delete pricing plans" ON pricing_plans;
DROP POLICY IF EXISTS "Only admins can update pricing plans" ON pricing_plans;

CREATE POLICY "Only admins can delete pricing plans"
  ON pricing_plans
  FOR DELETE
  TO authenticated
  USING (is_admin());

CREATE POLICY "Only admins can update pricing plans"
  ON pricing_plans
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Fix subdomains policies
DROP POLICY IF EXISTS "Admins can manage all subdomains" ON subdomains;
CREATE POLICY "Admins can manage all subdomains"
  ON subdomains
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Fix subscription_plans policies
DROP POLICY IF EXISTS "Admins can manage subscription plans" ON subscription_plans;
CREATE POLICY "Admins can manage subscription plans"
  ON subscription_plans
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Fix subscriptions policies
DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON subscriptions;
CREATE POLICY "Admins can manage all subscriptions"
  ON subscriptions
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Note: domains and orders policies are fine as they only use customers.id lookup
-- which doesn't cause recursion
