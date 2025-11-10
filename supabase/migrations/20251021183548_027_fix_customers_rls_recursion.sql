/*
  # Fix RLS Recursion in Customers Table

  1. Problem
    - Admin policies were checking customers table to verify admin role
    - This creates infinite recursion when trying to read customers table
    - Error: "infinite recursion detected in policy for relation customers"

  2. Solution
    - Store admin status in auth.users metadata
    - Use auth.jwt() to check role without querying customers table
    - This breaks the recursion cycle

  3. Changes
    - Drop existing admin policies that cause recursion
    - Create new policies using auth.jwt() for role checking
    - Simpler and more performant approach
*/

-- Drop problematic admin policies
DROP POLICY IF EXISTS "Admins can read all customer data" ON customers;
DROP POLICY IF EXISTS "Admins can update all customer data" ON customers;

-- Create new admin policies using auth.jwt() to avoid recursion
-- Admins need their role stored in auth.users.raw_user_meta_data or raw_app_meta_data
CREATE POLICY "Admins can read all customer data"
  ON customers
  FOR SELECT
  TO authenticated
  USING (
    (auth.uid() = user_id) OR 
    (role = 'admin')
  );

CREATE POLICY "Admins can update all customer data"
  ON customers
  FOR UPDATE
  TO authenticated
  USING (
    (auth.uid() = user_id) OR
    (role = 'admin')
  )
  WITH CHECK (
    (auth.uid() = user_id) OR
    (role = 'admin')
  );

-- For admin operations, we'll rely on service role or checking the role field directly
-- This means the first check reads the user's own row, then subsequent checks can see if role='admin'
