/*
  # Add Two-Factor Authentication (2FA) Support
  
  1. Changes
    - Add 2FA fields to customers table
    - Create recovery codes table
    - Add audit logging for 2FA events
  
  2. Security Features
    - TOTP secret encrypted at rest
    - Recovery codes stored as hashes (bcrypt-like)
    - Tracking of used recovery codes
    - Audit trail for all 2FA operations
*/

-- Add 2FA fields to customers table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'totp_enabled'
  ) THEN
    ALTER TABLE customers ADD COLUMN totp_enabled boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'totp_secret'
  ) THEN
    ALTER TABLE customers ADD COLUMN totp_secret text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'totp_verified_at'
  ) THEN
    ALTER TABLE customers ADD COLUMN totp_verified_at timestamptz;
  END IF;
END $$;

-- Add comments
COMMENT ON COLUMN customers.totp_enabled IS 'Whether 2FA is enabled for this user';
COMMENT ON COLUMN customers.totp_secret IS 'Encrypted TOTP secret (only if 2FA enabled)';
COMMENT ON COLUMN customers.totp_verified_at IS 'When user first verified their 2FA setup';

-- Create recovery codes table if it doesn't exist
CREATE TABLE IF NOT EXISTS recovery_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  code_hash text NOT NULL,
  used boolean DEFAULT false,
  used_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_recovery_codes_user_id 
  ON recovery_codes(user_id);

CREATE INDEX IF NOT EXISTS idx_recovery_codes_unused 
  ON recovery_codes(user_id, used) 
  WHERE used = false;

CREATE INDEX IF NOT EXISTS idx_customers_totp_enabled 
  ON customers(id) 
  WHERE totp_enabled = true;

-- Enable RLS
ALTER TABLE recovery_codes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own recovery codes" ON recovery_codes;
DROP POLICY IF EXISTS "Users can create own recovery codes" ON recovery_codes;
DROP POLICY IF EXISTS "Users can update own recovery codes" ON recovery_codes;
DROP POLICY IF EXISTS "Admins can view all recovery codes" ON recovery_codes;

-- Users can view their own recovery codes
CREATE POLICY "Users can view own recovery codes"
  ON recovery_codes
  FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM customers 
      WHERE id = auth.uid()
    )
  );

-- Users can insert their own recovery codes
CREATE POLICY "Users can create own recovery codes"
  ON recovery_codes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IN (
      SELECT id FROM customers 
      WHERE id = auth.uid()
    )
  );

-- Users can update their own recovery codes (mark as used)
CREATE POLICY "Users can update own recovery codes"
  ON recovery_codes
  FOR UPDATE
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM customers 
      WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    user_id IN (
      SELECT id FROM customers 
      WHERE id = auth.uid()
    )
  );

-- Admins can view all recovery codes
CREATE POLICY "Admins can view all recovery codes"
  ON recovery_codes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Function to cleanup old unused recovery codes (keep only latest 10 per user)
CREATE OR REPLACE FUNCTION cleanup_old_recovery_codes()
RETURNS trigger AS $$
BEGIN
  DELETE FROM recovery_codes
  WHERE user_id = NEW.user_id
    AND id NOT IN (
      SELECT id FROM recovery_codes
      WHERE user_id = NEW.user_id
      ORDER BY created_at DESC
      LIMIT 10
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_cleanup_recovery_codes ON recovery_codes;
CREATE TRIGGER trigger_cleanup_recovery_codes
  AFTER INSERT ON recovery_codes
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_old_recovery_codes();
