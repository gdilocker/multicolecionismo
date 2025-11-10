/*
  # Add Dynadot Sandbox Support

  1. Changes
    - Add `dynadot_sandbox_api_key` column for sandbox testing
    - Add `dynadot_sandbox_api_secret` column for sandbox testing
    - Add `dynadot_mode` column to specify production or sandbox

  2. Notes
    - Allows separate credentials for testing vs production
    - Mode defaults to 'production' for existing setups
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_credentials' AND column_name = 'dynadot_sandbox_api_key'
  ) THEN
    ALTER TABLE api_credentials ADD COLUMN dynadot_sandbox_api_key text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_credentials' AND column_name = 'dynadot_sandbox_api_secret'
  ) THEN
    ALTER TABLE api_credentials ADD COLUMN dynadot_sandbox_api_secret text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_credentials' AND column_name = 'dynadot_mode'
  ) THEN
    ALTER TABLE api_credentials ADD COLUMN dynadot_mode text DEFAULT 'production';
  END IF;
END $$;