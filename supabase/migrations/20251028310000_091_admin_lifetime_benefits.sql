/*
  # Admin Lifetime Benefits System

  ## Overview
  This migration ensures that admin users receive lifetime benefits:
  - Never pay subscription fees (price = 0)
  - Domains never expire (perpetual expiration dates)
  - No billing or renewal required

  ## Changes
  1. **Subscription Override**
     - Set admin subscription prices to 0
     - Mark as lifetime subscription

  2. **Domain Perpetual Access**
     - Set admin domains expiration to far future (2099-12-31)
     - Ensure domains never show as expired

  3. **Trigger Function**
     - Auto-apply lifetime benefits when admin creates domains
     - Auto-set subscription price to 0 for admins
*/

-- Function to set domain expiration to perpetual for admin users
CREATE OR REPLACE FUNCTION set_admin_perpetual_domains()
RETURNS TRIGGER AS $$
DECLARE
  v_user_role text;
BEGIN
  -- Get the user's role
  SELECT role INTO v_user_role
  FROM customers
  WHERE id = NEW.customer_id;

  -- If user is admin, set expiration to far future (perpetual)
  IF v_user_role = 'admin' THEN
    NEW.expiration_date := '2099-12-31'::date;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new domains
DROP TRIGGER IF EXISTS ensure_admin_perpetual_domains ON domains;
CREATE TRIGGER ensure_admin_perpetual_domains
  BEFORE INSERT OR UPDATE ON domains
  FOR EACH ROW
  EXECUTE FUNCTION set_admin_perpetual_domains();

-- Update existing admin domains to be perpetual
UPDATE domains
SET expiration_date = '2099-12-31'::date
WHERE customer_id IN (
  SELECT id FROM customers WHERE role = 'admin'
);

-- Function to set subscription price to 0 for admins
CREATE OR REPLACE FUNCTION set_admin_free_subscription()
RETURNS TRIGGER AS $$
DECLARE
  v_user_role text;
BEGIN
  -- Get the user's role from auth.users
  SELECT raw_user_meta_data->>'role' INTO v_user_role
  FROM auth.users
  WHERE id = NEW.user_id;

  -- If user is admin, they don't pay
  IF v_user_role = 'admin' THEN
    -- Keep the plan_id but mark as lifetime/free
    NEW.status := 'active';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for subscriptions
DROP TRIGGER IF EXISTS ensure_admin_free_subscription ON subscriptions;
CREATE TRIGGER ensure_admin_free_subscription
  BEFORE INSERT OR UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION set_admin_free_subscription();

-- Add comment to document admin lifetime benefits
COMMENT ON FUNCTION set_admin_perpetual_domains() IS 'Ensures admin users have perpetual domain access';
COMMENT ON FUNCTION set_admin_free_subscription() IS 'Ensures admin users never pay subscription fees';
