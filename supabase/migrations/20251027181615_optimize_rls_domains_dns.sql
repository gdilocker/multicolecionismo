/*
  # Optimize RLS Policies - Domains and DNS
  
  1. Changes
    - Replace auth.uid() with (SELECT auth.uid())
    - Optimize domain and DNS record policies
  
  2. Tables Updated
    - domains
    - dns_records
*/

-- ============================================
-- DOMAINS TABLE
-- ============================================

DROP POLICY IF EXISTS "Users and admins can create domains" ON domains;
DROP POLICY IF EXISTS "Users and admins can read domains" ON domains;
DROP POLICY IF EXISTS "Users and admins can update domains" ON domains;
DROP POLICY IF EXISTS "Users and admins can delete domains" ON domains;

CREATE POLICY "Users and admins can create domains"
  ON domains
  FOR INSERT
  TO authenticated
  WITH CHECK (
    customer_id IN (
      SELECT id FROM customers WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users and admins can read domains"
  ON domains
  FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM customers WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users and admins can update domains"
  ON domains
  FOR UPDATE
  TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM customers WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users and admins can delete domains"
  ON domains
  FOR DELETE
  TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM customers WHERE user_id = (SELECT auth.uid())
    )
  );

-- ============================================
-- DNS_RECORDS TABLE
-- ============================================

DROP POLICY IF EXISTS "Users can create own DNS records" ON dns_records;
DROP POLICY IF EXISTS "Users can read own DNS records" ON dns_records;
DROP POLICY IF EXISTS "Users can update own DNS records" ON dns_records;
DROP POLICY IF EXISTS "Users can delete own DNS records" ON dns_records;

CREATE POLICY "Users can create own DNS records"
  ON dns_records
  FOR INSERT
  TO authenticated
  WITH CHECK (
    domain_id IN (
      SELECT d.id FROM domains d
      JOIN customers c ON d.customer_id = c.id
      WHERE c.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can read own DNS records"
  ON dns_records
  FOR SELECT
  TO authenticated
  USING (
    domain_id IN (
      SELECT d.id FROM domains d
      JOIN customers c ON d.customer_id = c.id
      WHERE c.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update own DNS records"
  ON dns_records
  FOR UPDATE
  TO authenticated
  USING (
    domain_id IN (
      SELECT d.id FROM domains d
      JOIN customers c ON d.customer_id = c.id
      WHERE c.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete own DNS records"
  ON dns_records
  FOR DELETE
  TO authenticated
  USING (
    domain_id IN (
      SELECT d.id FROM domains d
      JOIN customers c ON d.customer_id = c.id
      WHERE c.user_id = (SELECT auth.uid())
    )
  );
