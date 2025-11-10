/*
  # Consolidate Critical RLS Policies

  ## Summary
  Consolidates duplicate permissive RLS policies on the most critical tables
  to simplify security model and improve maintainability.

  ## Tables Updated
  - customers (2 SELECT → 1, 2 UPDATE → 1)
  - user_profiles (2 anon SELECT → 1, 3 auth SELECT → 1, 3 UPDATE → 1)
  - domains (2 SELECT → 1)

  ## Impact
  - Simplified security model
  - Easier to audit and maintain
  - Uses (SELECT auth.uid()) for performance optimization
  - Zero functional change - same access control logic
*/

-- ============================================================================
-- CUSTOMERS TABLE
-- ============================================================================

-- Consolidate SELECT policies
DROP POLICY IF EXISTS "Users can read own customer data" ON public.customers;
DROP POLICY IF EXISTS authenticated_read_own_customer ON public.customers;

CREATE POLICY "authenticated_read_own_customer"
  ON public.customers
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Consolidate UPDATE policies
DROP POLICY IF EXISTS "Users can update own customer data" ON public.customers;
DROP POLICY IF EXISTS authenticated_update_own_customer ON public.customers;

CREATE POLICY "authenticated_update_own_customer"
  ON public.customers
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================================================
-- USER_PROFILES TABLE
-- ============================================================================

-- Consolidate anon SELECT policies
DROP POLICY IF EXISTS "Anyone can view public profiles" ON public.user_profiles;
DROP POLICY IF EXISTS anon_view_public_profiles ON public.user_profiles;

CREATE POLICY "anon_view_public_profiles"
  ON public.user_profiles
  FOR SELECT
  TO anon
  USING (is_public = true AND is_active = true);

-- Consolidate authenticated SELECT policies
DROP POLICY IF EXISTS auth_view_own_profile ON public.user_profiles;
DROP POLICY IF EXISTS auth_view_public_profiles ON public.user_profiles;

CREATE POLICY "auth_view_profiles"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR (is_public = true AND is_active = true)
  );

-- Consolidate UPDATE policies
DROP POLICY IF EXISTS "Admins can control feature permissions" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own feature controls" ON public.user_profiles;
DROP POLICY IF EXISTS auth_update_own_profile ON public.user_profiles;

CREATE POLICY "auth_update_own_profile"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = (SELECT auth.uid())
      AND customers.role = 'admin'
    )
  )
  WITH CHECK (
    user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = (SELECT auth.uid())
      AND customers.role = 'admin'
    )
  );

-- ============================================================================
-- DOMAINS TABLE
-- ============================================================================

-- Consolidate SELECT policies
DROP POLICY IF EXISTS "Anyone can view domains" ON public.domains;
DROP POLICY IF EXISTS "Users can view own domains" ON public.domains;

CREATE POLICY "view_domains"
  ON public.domains
  FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM customers WHERE user_id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = (SELECT auth.uid())
      AND customers.role = 'admin'
    )
  );

-- ============================================================================
-- POLICY COMMENTS
-- ============================================================================

COMMENT ON POLICY "authenticated_read_own_customer" ON public.customers IS
'Consolidated policy: Users read own customer data using cached auth.uid() for performance';

COMMENT ON POLICY "authenticated_update_own_customer" ON public.customers IS
'Consolidated policy: Users update own customer data with cached auth.uid()';

COMMENT ON POLICY "anon_view_public_profiles" ON public.user_profiles IS
'Consolidated policy: Anonymous users can only view public, active profiles';

COMMENT ON POLICY "auth_view_profiles" ON public.user_profiles IS
'Consolidated policy: Authenticated users view own profile OR any public active profile';

COMMENT ON POLICY "auth_update_own_profile" ON public.user_profiles IS
'Consolidated policy: Users update own profile, admins update any profile';

COMMENT ON POLICY "view_domains" ON public.domains IS
'Consolidated policy: Users view own domains, admins view all domains';
