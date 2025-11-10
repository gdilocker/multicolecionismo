/*
  # Optimize Critical RLS Policies - Performance Fix

  1. Problem
    - RLS policies re-evaluate auth.uid() for each row causing performance issues

  2. Solution
    - Wrap auth.uid() in SELECT to evaluate once per query
    - Only fix the most critical policies that check profile/user ownership

  3. Strategy
    - Focus on high-traffic tables
    - Use subquery optimization for auth.uid()
*/

-- Fix domain_transfers policies (critical for security)
DROP POLICY IF EXISTS "Admins have full access to transfers" ON public.domain_transfers;
CREATE POLICY "Admins have full access to transfers"
  ON public.domain_transfers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = (SELECT auth.uid())
      AND customers.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can initiate transfers for owned domains" ON public.domain_transfers;
CREATE POLICY "Users can initiate transfers for owned domains"
  ON public.domain_transfers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM domains d
      JOIN customers c ON d.customer_id = c.id
      WHERE d.id = domain_transfers.domain_id
      AND c.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can view own transfers (from)" ON public.domain_transfers;
CREATE POLICY "Users can view own transfers (from)"
  ON public.domain_transfers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = domain_transfers.from_customer_id
      AND customers.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can view own transfers (to)" ON public.domain_transfers;
CREATE POLICY "Users can view own transfers (to)"
  ON public.domain_transfers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = domain_transfers.to_customer_id
      AND customers.user_id = (SELECT auth.uid())
    )
  );

-- Fix profile_admins policies
DROP POLICY IF EXISTS "Profile owners manage admins" ON public.profile_admins;
CREATE POLICY "Profile owners manage admins"
  ON public.profile_admins
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = profile_admins.profile_id
      AND user_profiles.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can view own profile admins" ON public.profile_admins;
CREATE POLICY "Users can view own profile admins"
  ON public.profile_admins
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Fix profile_change_history policy
DROP POLICY IF EXISTS "Users view own change history" ON public.profile_change_history;
CREATE POLICY "Users view own change history"
  ON public.profile_change_history
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Note: Other policies will be addressed in subsequent migrations
-- as they require understanding the exact relationship between profiles and users
