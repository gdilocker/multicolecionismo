/*
  # Fix Domain Suggestions RLS Policies

  1. Problem
    - RLS policies for domain_suggestions reference 'users' table
    - The project uses 'customers' table for user data and roles
    - This causes "Error updating domain" when trying to edit suggestions

  2. Changes
    - Drop existing policies that reference 'users' table
    - Recreate policies with correct 'customers' table reference

  3. Security
    - Only admins can create, update, and delete suggestions
    - Public can view available suggestions
    - Authenticated users can view all suggestions
*/

-- Drop existing incorrect policies
DROP POLICY IF EXISTS "Only admins can create domain suggestions" ON domain_suggestions;
DROP POLICY IF EXISTS "Only admins can update domain suggestions" ON domain_suggestions;
DROP POLICY IF EXISTS "Only admins can delete domain suggestions" ON domain_suggestions;

-- Recreate policies with correct table reference

-- Only admins can insert suggestions
CREATE POLICY "Only admins can create domain suggestions"
  ON domain_suggestions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = auth.uid()
      AND customers.role = 'admin'
    )
  );

-- Only admins can update suggestions
CREATE POLICY "Only admins can update domain suggestions"
  ON domain_suggestions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = auth.uid()
      AND customers.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = auth.uid()
      AND customers.role = 'admin'
    )
  );

-- Only admins can delete suggestions
CREATE POLICY "Only admins can delete domain suggestions"
  ON domain_suggestions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = auth.uid()
      AND customers.role = 'admin'
    )
  );
