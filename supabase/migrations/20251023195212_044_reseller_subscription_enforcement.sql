/*
  # Enforce Reseller Subscription Requirements

  1. Security Enhancements
    - Add RLS policies to ensure resellers have active subscriptions
    - Protect affiliate data access based on subscription status
    - Admin bypass for support and QA

  2. Changes
    - Update RLS policies on `affiliates` table
    - Update RLS policies on `affiliate_commissions` table
    - Update RLS policies on `affiliate_clicks` table
    - Create helper function to check reseller subscription status

  3. Important Notes
    - Only users with role 'reseller' or 'admin' can access affiliate data
    - Resellers MUST have active subscription (status: 'active' or 'trialing')
    - Admins can bypass subscription requirement
*/

-- Helper function to check if user is reseller with active subscription
CREATE OR REPLACE FUNCTION is_reseller_with_active_subscription(check_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role text;
  has_active_sub boolean;
BEGIN
  -- Get user role
  SELECT role INTO user_role
  FROM customers
  WHERE user_id = check_user_id;

  -- Admin bypass
  IF user_role = 'admin' THEN
    RETURN true;
  END IF;

  -- Check if user has reseller role
  IF user_role != 'reseller' THEN
    RETURN false;
  END IF;

  -- Check if reseller has active subscription
  SELECT EXISTS (
    SELECT 1
    FROM subscriptions
    WHERE user_id = check_user_id
      AND status IN ('active', 'trialing')
      AND (next_billing_date IS NULL OR next_billing_date > NOW())
  ) INTO has_active_sub;

  RETURN has_active_sub;
END;
$$;

-- Drop existing policies on affiliates table
DROP POLICY IF EXISTS "Users can view own affiliate data" ON affiliates;
DROP POLICY IF EXISTS "Users can update own affiliate data" ON affiliates;
DROP POLICY IF EXISTS "Users can insert own affiliate data" ON affiliates;

-- Create new policies for affiliates table with subscription check
CREATE POLICY "Resellers with subscription can view own affiliate data"
  ON affiliates
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() AND
    is_reseller_with_active_subscription(auth.uid())
  );

CREATE POLICY "Resellers with subscription can update own affiliate data"
  ON affiliates
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() AND
    is_reseller_with_active_subscription(auth.uid())
  )
  WITH CHECK (
    user_id = auth.uid() AND
    is_reseller_with_active_subscription(auth.uid())
  );

CREATE POLICY "Resellers with subscription can insert own affiliate data"
  ON affiliates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    is_reseller_with_active_subscription(auth.uid())
  );

-- Drop existing policies on affiliate_commissions table
DROP POLICY IF EXISTS "Affiliates can view own commissions" ON affiliate_commissions;

-- Create new policy for affiliate_commissions with subscription check
CREATE POLICY "Resellers with subscription can view own commissions"
  ON affiliate_commissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM affiliates
      WHERE affiliates.id = affiliate_commissions.affiliate_id
        AND affiliates.user_id = auth.uid()
    ) AND
    is_reseller_with_active_subscription(auth.uid())
  );

-- Drop existing policies on affiliate_clicks table
DROP POLICY IF EXISTS "Affiliates can view own clicks" ON affiliate_clicks;

-- Create new policy for affiliate_clicks with subscription check
CREATE POLICY "Resellers with subscription can view own clicks"
  ON affiliate_clicks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM affiliates
      WHERE affiliates.id = affiliate_clicks.affiliate_id
        AND affiliates.user_id = auth.uid()
    ) AND
    is_reseller_with_active_subscription(auth.uid())
  );

-- Add index to improve subscription lookup performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status
  ON subscriptions(user_id, status, next_billing_date)
  WHERE status IN ('active', 'trialing');
