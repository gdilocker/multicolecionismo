/*
  # Fix RLS Recursion Issue V2
  
  1. Problem
    - Current admin policies check `role = 'admin'` which creates recursion
    - Users can't read their own data due to RLS blocking
    
  2. Solution
    - Drop problematic recursive policies
    - Create simple non-recursive policies
    - Users can always read/update their own data
    - Service role can do everything (for RPC functions)
    
  3. Security
    - RPC function `get_user_role_and_subscription` uses SECURITY DEFINER
    - It runs with elevated privileges and bypasses RLS
    - Regular queries are restricted to own user_id only
*/

-- Drop all existing policies on customers table
DROP POLICY IF EXISTS "Admins can read all customer data" ON customers;
DROP POLICY IF EXISTS "Admins can update all customer data" ON customers;
DROP POLICY IF EXISTS "Users can read own customer data" ON customers;
DROP POLICY IF EXISTS "Users can update own customer data" ON customers;
DROP POLICY IF EXISTS "Users can create own customer data" ON customers;

-- Create simple, non-recursive policies
-- SELECT: Users can read their own data
CREATE POLICY "authenticated_select_own"
  ON customers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- INSERT: Users can create their own record
CREATE POLICY "authenticated_insert_own"
  ON customers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can update their own data
CREATE POLICY "authenticated_update_own"
  ON customers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can delete their own data
CREATE POLICY "authenticated_delete_own"
  ON customers
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role has full access (for RPC functions)
-- This is implicit and doesn't need a policy
