/*
  # Simplify Customers RLS - No Recursion

  1. Problem
    - get_user_role() causes recursion with customers table
    - Customer table needs to be readable for role checking
  
  2. Solution
    - Remove get_user_role() from customers policies
    - Use simple auth.uid() = user_id check (users can read their own record)
    - This breaks the recursion cycle
  
  3. Security
    - Users can only see their own customer record
    - This is safe and prevents recursion
*/

-- Drop existing policies on customers
DROP POLICY IF EXISTS "Users and admins can read customers" ON customers;
DROP POLICY IF EXISTS "Users and admins can create customers" ON customers;
DROP POLICY IF EXISTS "Users and admins can update customers" ON customers;
DROP POLICY IF EXISTS "Users and admins can delete customers" ON customers;

-- Simple policies without get_user_role() to avoid recursion
-- Users can read their own record (this is essential for role checking)
CREATE POLICY "authenticated_read_own_customer"
  ON customers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can create their own record
CREATE POLICY "authenticated_create_own_customer"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own record  
CREATE POLICY "authenticated_update_own_customer"
  ON customers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own record
CREATE POLICY "authenticated_delete_own_customer"
  ON customers FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
