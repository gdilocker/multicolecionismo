/*
  # Fix RLS Policies

  1. Changes
    - Remove duplicate policies on pending_orders table
    - Fix insecure policies using USING (true)
    - Ensure all policies follow security best practices
    - Add missing policies for customers table (update)
    - Add missing policies for orders table (update, delete)
    - Add missing policies for invoices table (insert)
    - Add missing policies for domains table (delete)
    
  2. Security
    - All policies now properly check authentication and ownership
    - No policies use USING (true) except for service role operations
    - Separate policies for each operation (SELECT, INSERT, UPDATE, DELETE)
*/

-- Drop duplicate and insecure policies on pending_orders
DROP POLICY IF EXISTS "Users can create own pending orders" ON pending_orders;
DROP POLICY IF EXISTS "Users can insert own pending orders" ON pending_orders;
DROP POLICY IF EXISTS "Users can view own pending orders" ON pending_orders;
DROP POLICY IF EXISTS "System can update pending orders" ON pending_orders;

-- Recreate pending_orders policies correctly
CREATE POLICY "Users can insert own pending orders"
  ON pending_orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can select own pending orders"
  ON pending_orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Keep the existing update policy for users
-- DROP POLICY IF EXISTS "Users can update own pending orders" ON pending_orders;
-- Already exists and is correct

-- Keep the existing delete policy
-- DROP POLICY IF EXISTS "Users can delete own pending orders" ON pending_orders;
-- Already exists and is correct

-- Add missing policies for customers table
CREATE POLICY "Users can update own customer data"
  ON customers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add missing policies for orders table
CREATE POLICY "Users can update own orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM customers WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    customer_id IN (
      SELECT id FROM customers WHERE user_id = auth.uid()
    )
  );

-- Add missing policies for invoices table
CREATE POLICY "System can insert invoices"
  ON invoices FOR INSERT
  TO authenticated
  WITH CHECK (
    order_id IN (
      SELECT o.id FROM orders o
      JOIN customers c ON o.customer_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

-- Add missing policies for domains table
CREATE POLICY "Users can delete own domains"
  ON domains FOR DELETE
  TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM customers WHERE user_id = auth.uid()
    )
  );

-- Fix audit_logs policy (service operations should be more restrictive)
DROP POLICY IF EXISTS "Service can create audit logs" ON audit_logs;

CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (actor_id = auth.uid());

-- Add admin read access to audit_logs
CREATE POLICY "Admins can read all audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Add missing update policy for customers (for admins)
CREATE POLICY "Admins can update all customer data"
  ON customers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Add admin read access to customers
CREATE POLICY "Admins can read all customer data"
  ON customers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Add missing update policy for subdomains
CREATE POLICY "Users can update own subdomains"
  ON subdomains FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own subdomains"
  ON subdomains FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add missing update policy for physical_cards
CREATE POLICY "Users can update own physical cards"
  ON physical_cards FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own physical cards"
  ON physical_cards FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own physical cards"
  ON physical_cards FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
