/*
  # Fix Customers RLS for Self-Lookup

  1. Problem
    - Admin cannot query their own customer record
    - Policy `authenticated_select_own` uses `auth.uid() = user_id` which works
    - BUT this is causing issues in the frontend
  
  2. Solution
    - Keep existing policies but ensure they work correctly
    - Add explicit admin bypass for all operations
    - This ensures admin can always access customer data
  
  3. Security
    - Regular users can only see their own customer record
    - Admin can see ALL customer records
    - Service role has full access
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "authenticated_select_own" ON customers;
DROP POLICY IF EXISTS "authenticated_insert_own" ON customers;
DROP POLICY IF EXISTS "authenticated_update_own" ON customers;
DROP POLICY IF EXISTS "authenticated_delete_own" ON customers;

-- SELECT: Users can see their own record, admins can see all
CREATE POLICY "Users and admins can read customers"
  ON customers FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR
    get_user_role(auth.uid()) = 'admin'
  );

-- INSERT: Users can create their own record, admins can create any
CREATE POLICY "Users and admins can create customers"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    OR
    get_user_role(auth.uid()) = 'admin'
  );

-- UPDATE: Users can update their own record, admins can update any
CREATE POLICY "Users and admins can update customers"
  ON customers FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR
    get_user_role(auth.uid()) = 'admin'
  )
  WITH CHECK (
    auth.uid() = user_id
    OR
    get_user_role(auth.uid()) = 'admin'
  );

-- DELETE: Users can delete their own record, admins can delete any
CREATE POLICY "Users and admins can delete customers"
  ON customers FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR
    get_user_role(auth.uid()) = 'admin'
  );
