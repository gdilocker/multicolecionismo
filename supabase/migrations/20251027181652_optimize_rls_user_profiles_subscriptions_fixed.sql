/*
  # Optimize RLS Policies - User Profiles and Subscriptions (Fixed)
  
  1. Changes
    - Replace auth.uid() with (SELECT auth.uid())
    - Optimize user_profiles, subscriptions, subdomains
  
  2. Tables Updated
    - user_profiles
    - subscriptions
    - subdomains
    - physical_cards
*/

-- ============================================
-- USER_PROFILES TABLE
-- ============================================

DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON user_profiles;

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can view own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own profile"
  ON user_profiles
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ============================================
-- SUBSCRIPTIONS TABLE
-- ============================================

DROP POLICY IF EXISTS "Users can insert own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON subscriptions;

CREATE POLICY "Users can insert own subscriptions"
  ON subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can view own subscriptions"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own subscriptions"
  ON subscriptions
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ============================================
-- SUBDOMAINS TABLE
-- ============================================

DROP POLICY IF EXISTS "Users can insert own subdomains" ON subdomains;
DROP POLICY IF EXISTS "Users can view own subdomains" ON subdomains;
DROP POLICY IF EXISTS "Users can update own subdomains" ON subdomains;
DROP POLICY IF EXISTS "Users can delete own subdomains" ON subdomains;

CREATE POLICY "Users can insert own subdomains"
  ON subdomains
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can view own subdomains"
  ON subdomains
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own subdomains"
  ON subdomains
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own subdomains"
  ON subdomains
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ============================================
-- PHYSICAL_CARDS TABLE
-- ============================================

DROP POLICY IF EXISTS "Users can insert own physical cards" ON physical_cards;
DROP POLICY IF EXISTS "Users can view own physical cards" ON physical_cards;
DROP POLICY IF EXISTS "Users can update own physical cards" ON physical_cards;
DROP POLICY IF EXISTS "Users can delete own physical cards" ON physical_cards;

CREATE POLICY "Users can insert own physical cards"
  ON physical_cards
  FOR INSERT
  TO authenticated
  WITH CHECK (
    subscription_id IN (
      SELECT id FROM subscriptions WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can view own physical cards"
  ON physical_cards
  FOR SELECT
  TO authenticated
  USING (
    subscription_id IN (
      SELECT id FROM subscriptions WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update own physical cards"
  ON physical_cards
  FOR UPDATE
  TO authenticated
  USING (
    subscription_id IN (
      SELECT id FROM subscriptions WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete own physical cards"
  ON physical_cards
  FOR DELETE
  TO authenticated
  USING (
    subscription_id IN (
      SELECT id FROM subscriptions WHERE user_id = (SELECT auth.uid())
    )
  );
