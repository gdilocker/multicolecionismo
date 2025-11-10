/*
  # Add Free Trial System

  1. Changes
    - Add `trial_ends_at` to subscriptions table
    - Add `is_trial` boolean to subscriptions
    - Add function to check if user is in trial period
    - Add trigger to automatically set trial period (14 days) on new paid subscriptions

  2. Business Logic
    - All new paid subscriptions get 14 days free trial
    - Trial countdown shows in UI
    - After trial, payment is processed
    - Users can cancel during trial without charge

  3. Notes
    - Trial only applies to first subscription
    - Upgrading/downgrading doesn't reset trial
    - Free plan doesn't have trial (already free)
*/

-- Add trial columns to subscriptions if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'trial_ends_at'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN trial_ends_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'is_trial'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN is_trial boolean DEFAULT false;
  END IF;
END $$;

-- Function to check if subscription is in trial period
CREATE OR REPLACE FUNCTION is_subscription_in_trial(subscription_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  trial_end timestamptz;
  is_trial_sub boolean;
BEGIN
  SELECT trial_ends_at, is_trial
  INTO trial_end, is_trial_sub
  FROM subscriptions
  WHERE id = subscription_id;

  IF is_trial_sub AND trial_end IS NOT NULL AND trial_end > now() THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

-- Function to set trial period on new subscriptions
CREATE OR REPLACE FUNCTION set_trial_period()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only set trial for paid plans (not free)
  IF NEW.plan_type != 'free' AND NEW.is_trial IS NULL THEN
    NEW.is_trial := true;
    NEW.trial_ends_at := now() + interval '14 days';
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger to automatically set trial on subscription creation
DROP TRIGGER IF EXISTS set_subscription_trial ON subscriptions;
CREATE TRIGGER set_subscription_trial
  BEFORE INSERT ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION set_trial_period();

-- Add index for trial queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_trial 
  ON subscriptions(user_id, is_trial, trial_ends_at) 
  WHERE is_trial = true;

-- Function to get days remaining in trial
CREATE OR REPLACE FUNCTION get_trial_days_remaining(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  days_remaining integer;
BEGIN
  SELECT GREATEST(0, EXTRACT(DAY FROM (trial_ends_at - now())))::integer
  INTO days_remaining
  FROM subscriptions
  WHERE user_id = p_user_id
    AND is_trial = true
    AND trial_ends_at > now()
    AND status = 'active'
  ORDER BY trial_ends_at DESC
  LIMIT 1;

  RETURN COALESCE(days_remaining, 0);
END;
$$;

COMMENT ON FUNCTION is_subscription_in_trial IS 'Check if a subscription is currently in trial period';
COMMENT ON FUNCTION get_trial_days_remaining IS 'Get number of days remaining in trial for a user';
COMMENT ON FUNCTION set_trial_period IS 'Automatically set 14-day trial period for new paid subscriptions';
