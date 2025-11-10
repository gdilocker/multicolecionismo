/*
  # Add PayPal Webhook ID to API Credentials

  1. Changes
    - Add `paypal_webhook_id` column to `api_credentials` table
    - Add `paypal_mode` column to specify sandbox or live mode

  2. Notes
    - Webhook ID is needed to verify webhook signatures
    - Mode helps distinguish between sandbox and production
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_credentials' AND column_name = 'paypal_webhook_id'
  ) THEN
    ALTER TABLE api_credentials ADD COLUMN paypal_webhook_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_credentials' AND column_name = 'paypal_mode'
  ) THEN
    ALTER TABLE api_credentials ADD COLUMN paypal_mode text DEFAULT 'sandbox';
  END IF;
END $$;