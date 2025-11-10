/*
  # Admin Domain Access

  1. Changes
    - Create get_user_role() helper function
    - Add admin access policies to domains table
    - Admins can read, create, update, and delete ALL domains
    - This allows the admin to see and manage all domains in the system
  
  2. Security
    - Uses get_user_role() function to check if user is admin
    - Admin access is granted through role-based checking
    - Regular users still restricted to their own domains
*/

-- Create helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT COALESCE(role, 'customer')
    FROM customers
    WHERE user_id = user_uuid
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can read own domains" ON domains;
DROP POLICY IF EXISTS "Users can create own domains" ON domains;
DROP POLICY IF EXISTS "Users can update own domains" ON domains;
DROP POLICY IF EXISTS "Users can delete own domains" ON domains;

-- Create new policies with admin access

-- SELECT: Admin can see ALL domains, users see only their own
CREATE POLICY "Users and admins can read domains"
  ON domains FOR SELECT
  TO authenticated
  USING (
    get_user_role(auth.uid()) = 'admin' 
    OR 
    customer_id IN (
      SELECT id FROM customers WHERE user_id = auth.uid()
    )
  );

-- INSERT: Admin can create ANY domain, users can create their own
CREATE POLICY "Users and admins can create domains"
  ON domains FOR INSERT
  TO authenticated
  WITH CHECK (
    get_user_role(auth.uid()) = 'admin'
    OR
    customer_id IN (
      SELECT id FROM customers WHERE user_id = auth.uid()
    )
  );

-- UPDATE: Admin can update ANY domain, users can update their own
CREATE POLICY "Users and admins can update domains"
  ON domains FOR UPDATE
  TO authenticated
  USING (
    get_user_role(auth.uid()) = 'admin'
    OR
    customer_id IN (
      SELECT id FROM customers WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    get_user_role(auth.uid()) = 'admin'
    OR
    customer_id IN (
      SELECT id FROM customers WHERE user_id = auth.uid()
    )
  );

-- DELETE: Admin can delete ANY domain, users can delete their own
CREATE POLICY "Users and admins can delete domains"
  ON domains FOR DELETE
  TO authenticated
  USING (
    get_user_role(auth.uid()) = 'admin'
    OR
    customer_id IN (
      SELECT id FROM customers WHERE user_id = auth.uid()
    )
  );
