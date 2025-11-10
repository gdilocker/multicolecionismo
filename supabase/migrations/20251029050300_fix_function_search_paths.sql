/*
  # Fix Function Search Paths

  1. Security Fix
    - Sets SECURITY DEFINER functions to use immutable search_path
    - Prevents search_path manipulation attacks
    - Ensures functions always use correct schema

  2. Functions affected:
    - cleanup_expired_stories
    - set_admin_perpetual_domains
    - set_admin_free_subscription

  3. Security Impact
    - Prevents privilege escalation attacks
    - Ensures predictable function behavior
    - Follows PostgreSQL security best practices
*/

-- Fix cleanup_expired_stories function
CREATE OR REPLACE FUNCTION public.cleanup_expired_stories()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  DELETE FROM public.profile_stories
  WHERE expires_at < NOW()
  AND is_active = true;
END;
$$;

-- Fix set_admin_perpetual_domains function
CREATE OR REPLACE FUNCTION public.set_admin_perpetual_domains()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Set all admin domains to perpetual (never expire)
  UPDATE public.domains
  SET expiration_date = NULL
  WHERE customer_id IN (
    SELECT id FROM public.customers WHERE role = 'admin'
  );
END;
$$;

-- Fix set_admin_free_subscription function
CREATE OR REPLACE FUNCTION public.set_admin_free_subscription()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_id uuid;
  v_elite_plan_id uuid;
BEGIN
  -- Get admin user ID
  SELECT id INTO v_admin_id
  FROM public.customers
  WHERE role = 'admin'
  LIMIT 1;

  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'No admin user found';
  END IF;

  -- Get Elite plan ID
  SELECT id INTO v_elite_plan_id
  FROM public.subscription_plans
  WHERE plan_type = 'elite'
  LIMIT 1;

  IF v_elite_plan_id IS NULL THEN
    RAISE EXCEPTION 'Elite plan not found';
  END IF;

  -- Insert or update subscription
  INSERT INTO public.subscriptions (
    user_id,
    plan_id,
    status,
    start_date,
    next_billing_date,
    payment_status
  )
  VALUES (
    v_admin_id,
    v_elite_plan_id,
    'active',
    NOW(),
    NULL, -- No billing for admin
    'paid'
  )
  ON CONFLICT (user_id, plan_id)
  DO UPDATE SET
    status = 'active',
    payment_status = 'paid',
    next_billing_date = NULL;
END;
$$;
