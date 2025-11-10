/*
  # Optimize RLS Policies - Orders and Customers
  
  1. Changes
    - Replace auth.uid() with (SELECT auth.uid()) for better performance
    - Prevents re-evaluation for each row
    - Significant performance improvement at scale
  
  2. Tables Updated
    - orders
    - customers
*/

-- ============================================
-- ORDERS TABLE
-- ============================================

DROP POLICY IF EXISTS "Users can create own orders" ON orders;
DROP POLICY IF EXISTS "Users can read own orders" ON orders;
DROP POLICY IF EXISTS "Users can update own orders" ON orders;

CREATE POLICY "Users can create own orders"
  ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers 
      WHERE customers.id = orders.customer_id 
      AND customers.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can read own orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers 
      WHERE customers.id = orders.customer_id 
      AND customers.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update own orders"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers 
      WHERE customers.id = orders.customer_id 
      AND customers.user_id = (SELECT auth.uid())
    )
  );

-- ============================================
-- CUSTOMERS TABLE
-- ============================================

DROP POLICY IF EXISTS "authenticated_create_own_customer" ON customers;
DROP POLICY IF EXISTS "authenticated_read_own_customer" ON customers;
DROP POLICY IF EXISTS "authenticated_update_own_customer" ON customers;
DROP POLICY IF EXISTS "authenticated_delete_own_customer" ON customers;

CREATE POLICY "authenticated_create_own_customer"
  ON customers
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "authenticated_read_own_customer"
  ON customers
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "authenticated_update_own_customer"
  ON customers
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "authenticated_delete_own_customer"
  ON customers
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));
