/*
  # Domain Limits by Subscription Plan

  This migration implements domain acquisition limits based on subscription plan type:

  - **Trial (Prime)**: 1 domain only (included with trial activation)
  - **Prime (Paid)**: 1 domain only (included with plan)
  - **Elite**: Unlimited domains (first one included with plan)
  - **Supreme**: Unlimited domains (first one included with plan)

  ## Business Rules

  1. Trial/Prime users can ONLY have 1 domain at a time
  2. Elite/Supreme users can purchase additional domains after activation
  3. First domain is always included with plan purchase
  4. Attempting to register a 2nd domain on Trial/Prime = blocked with clear message
  5. Domain transfer counts toward limit

  ## Changes

  1. Add `max_domains` field to subscription_plans table
  2. Add `domain_limit_enforced` flag to subscription_plans
  3. Create validation function `check_domain_purchase_eligibility()`
  4. Add indexes for performance
  5. Update existing plans with limits
*/

-- Step 1: Add domain limit fields to subscription_plans
DO $$
BEGIN
  -- max_domains (NULL = unlimited)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_plans' AND column_name = 'max_domains'
  ) THEN
    ALTER TABLE subscription_plans ADD COLUMN max_domains integer;
  END IF;

  -- domain_limit_enforced
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_plans' AND column_name = 'domain_limit_enforced'
  ) THEN
    ALTER TABLE subscription_plans ADD COLUMN domain_limit_enforced boolean DEFAULT true;
  END IF;

  -- first_domain_included
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_plans' AND column_name = 'first_domain_included'
  ) THEN
    ALTER TABLE subscription_plans ADD COLUMN first_domain_included boolean DEFAULT true;
  END IF;
END $$;

-- Step 2: Update existing plans with domain limits
UPDATE subscription_plans
SET
  max_domains = 1,
  domain_limit_enforced = true,
  first_domain_included = true
WHERE plan_type IN ('starter', 'prime')
  AND max_domains IS NULL;

UPDATE subscription_plans
SET
  max_domains = NULL, -- NULL means unlimited
  domain_limit_enforced = true,
  first_domain_included = true
WHERE plan_type IN ('elite', 'supreme')
  AND max_domains IS NULL;

-- Step 3: Create function to check domain purchase eligibility
CREATE OR REPLACE FUNCTION check_domain_purchase_eligibility(
  p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscription subscriptions%ROWTYPE;
  v_plan subscription_plans%ROWTYPE;
  v_current_domains_count integer;
  v_max_allowed integer;
  v_can_purchase boolean;
  v_reason text;
BEGIN
  -- Get user's active subscription
  SELECT s.* INTO v_subscription
  FROM subscriptions s
  WHERE s.user_id = p_user_id
    AND s.status IN ('active', 'trialing')
  ORDER BY s.created_at DESC
  LIMIT 1;

  -- No subscription = cannot purchase
  IF v_subscription IS NULL THEN
    RETURN jsonb_build_object(
      'eligible', false,
      'reason', 'NO_SUBSCRIPTION',
      'message', 'Você precisa de um plano ativo para adquirir domínios.',
      'current_domains', 0,
      'max_domains', 0
    );
  END IF;

  -- Get plan details
  SELECT * INTO v_plan
  FROM subscription_plans
  WHERE id = v_subscription.plan_id;

  IF v_plan IS NULL THEN
    RETURN jsonb_build_object(
      'eligible', false,
      'reason', 'PLAN_NOT_FOUND',
      'message', 'Plano não encontrado.',
      'current_domains', 0,
      'max_domains', 0
    );
  END IF;

  -- Count current domains (active, parked, grace, redemption)
  SELECT COUNT(*) INTO v_current_domains_count
  FROM domains
  WHERE user_id = p_user_id
    AND registrar_status NOT IN ('released', 'pending_delete', 'cancelled');

  -- Get max allowed (NULL = unlimited)
  v_max_allowed := v_plan.max_domains;

  -- Check eligibility
  IF v_max_allowed IS NULL THEN
    -- Unlimited domains (Elite/Supreme)
    v_can_purchase := true;
    v_reason := 'UNLIMITED';
  ELSIF v_current_domains_count >= v_max_allowed THEN
    -- Hit the limit
    v_can_purchase := false;
    v_reason := 'LIMIT_REACHED';
  ELSE
    -- Still has capacity
    v_can_purchase := true;
    v_reason := 'WITHIN_LIMIT';
  END IF;

  -- Build response
  RETURN jsonb_build_object(
    'eligible', v_can_purchase,
    'reason', v_reason,
    'message', CASE
      WHEN v_reason = 'UNLIMITED' THEN 'Seu plano ' || v_plan.plan_name || ' permite domínios ilimitados.'
      WHEN v_reason = 'LIMIT_REACHED' THEN 'Você atingiu o limite de ' || v_max_allowed || ' domínio(s) do plano ' || v_plan.plan_name || '. Faça upgrade para Elite para domínios ilimitados.'
      WHEN v_reason = 'WITHIN_LIMIT' THEN 'Você pode adquirir mais ' || (v_max_allowed - v_current_domains_count) || ' domínio(s) no seu plano atual.'
      ELSE 'Status desconhecido'
    END,
    'current_domains', v_current_domains_count,
    'max_domains', v_max_allowed,
    'plan_name', v_plan.plan_name,
    'plan_type', v_plan.plan_type,
    'is_trial', v_subscription.status = 'trialing',
    'can_upgrade', v_max_allowed IS NOT NULL AND v_current_domains_count >= v_max_allowed
  );
END;
$$;

-- Step 4: Create function to validate domain registration
CREATE OR REPLACE FUNCTION validate_domain_registration(
  p_user_id uuid,
  p_domain_name text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_eligibility jsonb;
  v_domain_exists boolean;
BEGIN
  -- Check if domain already exists
  SELECT EXISTS (
    SELECT 1 FROM domains
    WHERE fqdn = p_domain_name
      AND registrar_status NOT IN ('released', 'cancelled')
  ) INTO v_domain_exists;

  IF v_domain_exists THEN
    RETURN jsonb_build_object(
      'valid', false,
      'reason', 'DOMAIN_TAKEN',
      'message', 'Este domínio já está registrado por outro usuário.'
    );
  END IF;

  -- Check purchase eligibility
  v_eligibility := check_domain_purchase_eligibility(p_user_id);

  IF NOT (v_eligibility->>'eligible')::boolean THEN
    RETURN jsonb_build_object(
      'valid', false,
      'reason', v_eligibility->>'reason',
      'message', v_eligibility->>'message',
      'eligibility', v_eligibility
    );
  END IF;

  -- All checks passed
  RETURN jsonb_build_object(
    'valid', true,
    'message', 'Domínio disponível para registro.',
    'eligibility', v_eligibility
  );
END;
$$;

-- Step 5: Create view for user domain limits
CREATE OR REPLACE VIEW user_domain_limits AS
SELECT
  u.id as user_id,
  u.email,
  c.role,
  s.status as subscription_status,
  sp.plan_name,
  sp.plan_type,
  sp.max_domains,
  sp.first_domain_included,
  COUNT(d.id) FILTER (WHERE d.registrar_status NOT IN ('released', 'pending_delete', 'cancelled')) as current_domains,
  CASE
    WHEN sp.max_domains IS NULL THEN true
    WHEN COUNT(d.id) FILTER (WHERE d.registrar_status NOT IN ('released', 'pending_delete', 'cancelled')) < sp.max_domains THEN true
    ELSE false
  END as can_purchase_more,
  CASE
    WHEN sp.max_domains IS NULL THEN NULL
    ELSE sp.max_domains - COUNT(d.id) FILTER (WHERE d.registrar_status NOT IN ('released', 'pending_delete', 'cancelled'))
  END as remaining_domains
FROM auth.users u
LEFT JOIN customers c ON c.user_id = u.id
LEFT JOIN subscriptions s ON s.user_id = u.id
  AND s.status IN ('active', 'trialing')
LEFT JOIN subscription_plans sp ON sp.id = s.plan_id
LEFT JOIN domains d ON d.user_id = u.id
GROUP BY u.id, u.email, c.role, s.status, sp.plan_name, sp.plan_type, sp.max_domains, sp.first_domain_included;

-- Step 6: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_domains_user_status
ON domains(user_id, registrar_status)
WHERE registrar_status NOT IN ('released', 'pending_delete', 'cancelled');

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_active
ON subscriptions(user_id, status)
WHERE status IN ('active', 'trialing');

-- Step 7: Add trigger to prevent domain registration beyond limit
CREATE OR REPLACE FUNCTION prevent_domain_over_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_eligibility jsonb;
BEGIN
  -- Only check on INSERT
  IF TG_OP = 'INSERT' THEN
    v_eligibility := check_domain_purchase_eligibility(NEW.user_id);

    IF NOT (v_eligibility->>'eligible')::boolean THEN
      RAISE EXCEPTION 'Domain registration blocked: %', v_eligibility->>'message'
        USING HINT = v_eligibility->>'reason';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS check_domain_limit_on_insert ON domains;
CREATE TRIGGER check_domain_limit_on_insert
  BEFORE INSERT ON domains
  FOR EACH ROW
  EXECUTE FUNCTION prevent_domain_over_limit();

-- Step 8: Add comments for documentation
COMMENT ON COLUMN subscription_plans.max_domains IS 'Maximum domains allowed (NULL = unlimited). Trial/Prime = 1, Elite/Supreme = unlimited';
COMMENT ON COLUMN subscription_plans.first_domain_included IS 'First domain included with plan purchase';
COMMENT ON COLUMN subscription_plans.domain_limit_enforced IS 'Whether to enforce domain limits';

COMMENT ON FUNCTION check_domain_purchase_eligibility IS 'Checks if user can purchase additional domains based on their plan';
COMMENT ON FUNCTION validate_domain_registration IS 'Validates domain registration including availability and user eligibility';
COMMENT ON VIEW user_domain_limits IS 'Shows domain limits and usage for all users';

-- Step 9: Grant permissions on view
GRANT SELECT ON user_domain_limits TO authenticated;

-- Step 10: Create helper function to get user's domain limit info
CREATE OR REPLACE FUNCTION get_my_domain_limits()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'plan_name', plan_name,
    'plan_type', plan_type,
    'max_domains', max_domains,
    'current_domains', current_domains,
    'can_purchase_more', can_purchase_more,
    'remaining_domains', remaining_domains,
    'is_unlimited', max_domains IS NULL
  ) INTO v_result
  FROM user_domain_limits
  WHERE user_id = auth.uid();

  RETURN COALESCE(v_result, jsonb_build_object(
    'error', 'No subscription found',
    'can_purchase_more', false
  ));
END;
$$;

COMMENT ON FUNCTION get_my_domain_limits IS 'Returns current user domain limit information';
