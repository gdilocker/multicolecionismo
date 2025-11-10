/*
  # Add PayPal Plan IDs to Subscription Plans

  1. Changes
    - Add `paypal_plan_id_sandbox` column to subscription_plans
    - Add `paypal_plan_id_live` column to subscription_plans
    - These will store the PayPal Billing Plan IDs from PayPal Dashboard

  2. Notes
    - Sandbox and Live environments have different Plan IDs
    - Admin must configure these in PayPal Dashboard first
    - Then update these fields via Admin Panel
*/

-- Add PayPal Plan ID columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_plans' AND column_name = 'paypal_plan_id_sandbox'
  ) THEN
    ALTER TABLE subscription_plans
    ADD COLUMN paypal_plan_id_sandbox text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_plans' AND column_name = 'paypal_plan_id_live'
  ) THEN
    ALTER TABLE subscription_plans
    ADD COLUMN paypal_plan_id_live text;
  END IF;
END $$;

-- Add comments
COMMENT ON COLUMN subscription_plans.paypal_plan_id_sandbox IS 'PayPal Billing Plan ID for Sandbox environment';
COMMENT ON COLUMN subscription_plans.paypal_plan_id_live IS 'PayPal Billing Plan ID for Live/Production environment';
