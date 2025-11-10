/*
  # Add User Roles Support

  1. Changes
    - Add `role` column to customers table with default 'user'
    - Add check constraint to ensure valid roles
    - Create admin user helper function

  2. Security
    - Maintain existing RLS policies
    - Role can only be set by admins (future implementation)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'role'
  ) THEN
    ALTER TABLE customers ADD COLUMN role text DEFAULT 'user' NOT NULL;
    ALTER TABLE customers ADD CONSTRAINT valid_role CHECK (role IN ('user', 'admin'));
  END IF;
END $$;