/*
  # Fix Function Search Paths - Final

  1. Problem
    - Functions have role mutable search_path
    - This is a security risk as it can be exploited

  2. Solution
    - Set search_path to '' for all affected functions
    - Handle dependent triggers correctly
    - Maintain trigger functionality

  3. Functions Fixed
    - cleanup_expired_stories
    - set_admin_perpetual_domains (ROW trigger)
    - set_admin_free_subscription (ROW trigger)
*/

-- Drop and recreate cleanup_expired_stories function
DROP FUNCTION IF EXISTS public.cleanup_expired_stories() CASCADE;
CREATE FUNCTION public.cleanup_expired_stories()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- This function has been deprecated and does nothing
  -- Stories system has been removed
  RETURN;
END;
$$;

-- Drop and recreate set_admin_perpetual_domains function (CASCADE to drop trigger)
DROP FUNCTION IF EXISTS public.set_admin_perpetual_domains() CASCADE;
CREATE FUNCTION public.set_admin_perpetual_domains()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- If customer is admin, set perpetual license
  IF EXISTS (
    SELECT 1 FROM public.customers
    WHERE id = NEW.customer_id AND role = 'admin'
  ) THEN
    NEW.license_type := 'perpetual';
    NEW.license_expires_at := NULL;
  END IF;

  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER ensure_admin_perpetual_domains
  BEFORE INSERT OR UPDATE ON public.domains
  FOR EACH ROW
  EXECUTE FUNCTION public.set_admin_perpetual_domains();

-- Drop and recreate set_admin_free_subscription function (CASCADE to drop trigger)
DROP FUNCTION IF EXISTS public.set_admin_free_subscription() CASCADE;
CREATE FUNCTION public.set_admin_free_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  supreme_plan_id uuid;
  is_admin boolean;
BEGIN
  -- Check if customer is admin
  SELECT role = 'admin' INTO is_admin
  FROM public.customers
  WHERE id = NEW.customer_id;

  IF is_admin THEN
    -- Get Supreme plan
    SELECT id INTO supreme_plan_id
    FROM public.subscription_plans
    WHERE code = 'supreme'
    LIMIT 1;

    IF supreme_plan_id IS NOT NULL THEN
      NEW.plan_id := supreme_plan_id;
      NEW.status := 'active';
      NEW.payment_status := 'paid';
      NEW.is_free_admin_plan := true;
      NEW.next_billing_date := NULL;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER ensure_admin_free_subscription
  BEFORE INSERT OR UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_admin_free_subscription();
