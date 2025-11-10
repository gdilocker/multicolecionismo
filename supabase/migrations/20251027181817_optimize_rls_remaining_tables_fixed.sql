/*
  # Optimize RLS Policies - Remaining Tables (Fixed)
  
  1. Changes
    - Replace auth.uid() with (SELECT auth.uid())
    - Use correct column names for each table
  
  2. Tables Updated
    - pending_orders (has user_id)
    - invoices  
    - audit_logs (uses actor_id)
    - cart_items (has user_id)
    - recovery_codes (has user_id)
    - licensing_requests
*/

-- ============================================
-- PENDING_ORDERS TABLE
-- ============================================

DROP POLICY IF EXISTS "Users can insert own pending orders" ON pending_orders;
DROP POLICY IF EXISTS "Users can read own pending orders" ON pending_orders;
DROP POLICY IF EXISTS "Users can select own pending orders" ON pending_orders;
DROP POLICY IF EXISTS "Users can update own pending orders" ON pending_orders;
DROP POLICY IF EXISTS "Users can delete own pending orders" ON pending_orders;

CREATE POLICY "Users can insert own pending orders"
  ON pending_orders
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can read own pending orders"
  ON pending_orders
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own pending orders"
  ON pending_orders
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own pending orders"
  ON pending_orders
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ============================================
-- INVOICES TABLE
-- ============================================

DROP POLICY IF EXISTS "Users can read own invoices" ON invoices;
DROP POLICY IF EXISTS "System can insert invoices" ON invoices;

CREATE POLICY "Users can read own invoices"
  ON invoices
  FOR SELECT
  TO authenticated
  USING (
    order_id IN (
      SELECT o.id FROM orders o
      JOIN customers c ON o.customer_id = c.id
      WHERE c.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "System can insert invoices"
  ON invoices
  FOR INSERT
  TO authenticated
  WITH CHECK (
    order_id IN (
      SELECT o.id FROM orders o
      JOIN customers c ON o.customer_id = c.id
      WHERE c.user_id = (SELECT auth.uid())
    )
  );

-- ============================================
-- AUDIT_LOGS TABLE (uses actor_id)
-- ============================================

DROP POLICY IF EXISTS "Users can read own audit logs" ON audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON audit_logs;

CREATE POLICY "Users can read own audit logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (actor_id = (SELECT auth.uid()));

CREATE POLICY "System can insert audit logs"
  ON audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (actor_id = (SELECT auth.uid()));

-- ============================================
-- CART_ITEMS TABLE
-- ============================================

DROP POLICY IF EXISTS "Users can view own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can insert own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can update own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can delete own cart items" ON cart_items;

CREATE POLICY "Users can view own cart items"
  ON cart_items
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own cart items"
  ON cart_items
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own cart items"
  ON cart_items
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own cart items"
  ON cart_items
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ============================================
-- RECOVERY_CODES TABLE
-- ============================================

DROP POLICY IF EXISTS "Users can view own recovery codes" ON recovery_codes;
DROP POLICY IF EXISTS "Users can create own recovery codes" ON recovery_codes;
DROP POLICY IF EXISTS "Users can update own recovery codes" ON recovery_codes;

CREATE POLICY "Users can view own recovery codes"
  ON recovery_codes
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can create own recovery codes"
  ON recovery_codes
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own recovery codes"
  ON recovery_codes
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ============================================
-- LICENSING_REQUESTS TABLE
-- ============================================

DROP POLICY IF EXISTS "Users can create licensing requests" ON licensing_requests;
DROP POLICY IF EXISTS "Users can view own licensing requests" ON licensing_requests;

CREATE POLICY "Users can create licensing requests"
  ON licensing_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    customer_id IN (
      SELECT id FROM customers WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can view own licensing requests"
  ON licensing_requests
  FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM customers WHERE user_id = (SELECT auth.uid())
    )
  );
