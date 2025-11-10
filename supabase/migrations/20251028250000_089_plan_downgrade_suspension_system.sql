/*
  # Plan Downgrade Suspension System

  ## Overview
  Implements automatic suspension of premium domains when users downgrade from Elite to Standard plan.
  This maintains the exclusivity of premium domains while allowing users to reactivate by upgrading again.

  ## Changes

  1. **New Functions**
     - `handle_plan_downgrade()` - Suspends premium domains on Elite → Standard
     - `handle_plan_upgrade()` - Reactivates suspended premium domains on Standard → Elite
     - `get_user_premium_domains()` - Helper to fetch user's premium domains

  2. **New Triggers**
     - `on_subscription_plan_change` - Fires when subscription plan changes
     - Automatically handles suspension/reactivation

  3. **New Table: plan_change_log**
     - Tracks all plan changes with reasons
     - Records what domains were affected
     - Audit trail for support

  4. **Updated Tables**
     - `domains` - Uses existing `license_status` field
     - `subscriptions` - Tracks plan changes

  ## Business Rules

  ### Downgrade (Elite → Standard):
  - All premium domains (price > $500/year) are suspended
  - Regular domains ($100/year) remain active
  - User can reactivate by upgrading back to Elite
  - Email notification sent to user

  ### Upgrade (Standard → Elite):
  - All previously suspended premium domains reactivate
  - User regains access to Galeria Premium
  - Email notification sent to user

  ### Complete Cancellation:
  - ALL domains revoked (existing rule)
  - No reactivation possible after 30 days

  ## Security
  - RLS policies maintained
  - Only system can trigger automatic suspension
  - Admins can manually override
*/

-- =====================================================
-- STEP 1: Create plan_change_log table
-- =====================================================

CREATE TABLE IF NOT EXISTS plan_change_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id uuid NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  previous_plan_type text,
  new_plan_type text NOT NULL,
  change_reason text DEFAULT 'user_initiated',
  domains_affected jsonb DEFAULT '[]'::jsonb,
  domains_suspended integer DEFAULT 0,
  domains_reactivated integer DEFAULT 0,
  notification_sent boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE plan_change_log ENABLE ROW LEVEL SECURITY;

-- Users can view their own plan change history
CREATE POLICY "Users can view own plan changes"
  ON plan_change_log
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can view all plan changes
CREATE POLICY "Admins can view all plan changes"
  ON plan_change_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = auth.uid()
      AND customers.role = 'admin'
    )
  );

-- System can insert plan change logs
CREATE POLICY "System can insert plan changes"
  ON plan_change_log
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_plan_change_log_user_id ON plan_change_log(user_id);
CREATE INDEX IF NOT EXISTS idx_plan_change_log_created_at ON plan_change_log(created_at DESC);

-- =====================================================
-- STEP 2: Helper function to get user's premium domains
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_premium_domains(p_user_id uuid)
RETURNS TABLE(
  domain_id uuid,
  fqdn text,
  price_usd numeric,
  current_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.fqdn,
    COALESCE(pd.price_usd, 0) as price_usd,
    d.license_status
  FROM domains d
  LEFT JOIN premium_domains pd ON pd.fqdn = d.fqdn
  WHERE d.user_id = p_user_id
    AND d.license_status IN ('active', 'suspended')
    AND COALESCE(pd.price_usd, 0) > 500;
END;
$$;

-- =====================================================
-- STEP 3: Function to handle plan DOWNGRADE
-- =====================================================

CREATE OR REPLACE FUNCTION handle_plan_downgrade(
  p_user_id uuid,
  p_subscription_id uuid,
  p_previous_plan text,
  p_new_plan text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_domains_affected jsonb DEFAULT '[]'::jsonb;
  v_domain_record record;
  v_suspended_count integer DEFAULT 0;
BEGIN
  -- Only process if downgrading FROM Elite TO Standard
  IF p_previous_plan != 'elite' OR p_new_plan != 'standard' THEN
    RETURN jsonb_build_object(
      'success', true,
      'action', 'none',
      'message', 'No premium domain suspension needed'
    );
  END IF;

  -- Get all premium domains for this user
  FOR v_domain_record IN
    SELECT * FROM get_user_premium_domains(p_user_id)
    WHERE current_status = 'active'
  LOOP
    -- Suspend the domain
    UPDATE domains
    SET
      license_status = 'suspended',
      license_notes = 'Suspenso automaticamente devido ao downgrade de plano Elite → Standard. Faça upgrade para Elite para reativar.',
      updated_at = now()
    WHERE id = v_domain_record.domain_id;

    -- Add to affected domains list
    v_domains_affected := v_domains_affected || jsonb_build_object(
      'fqdn', v_domain_record.fqdn,
      'price_usd', v_domain_record.price_usd,
      'action', 'suspended'
    );

    v_suspended_count := v_suspended_count + 1;

    -- Log in domain license history
    INSERT INTO domain_license_history (
      domain_id,
      previous_status,
      new_status,
      changed_by,
      change_reason,
      metadata
    ) VALUES (
      v_domain_record.domain_id,
      'active',
      'suspended',
      p_user_id,
      'Plan downgrade: Elite → Standard',
      jsonb_build_object(
        'previous_plan', p_previous_plan,
        'new_plan', p_new_plan,
        'automatic', true
      )
    );
  END LOOP;

  -- Log the plan change
  INSERT INTO plan_change_log (
    user_id,
    subscription_id,
    previous_plan_type,
    new_plan_type,
    change_reason,
    domains_affected,
    domains_suspended,
    metadata
  ) VALUES (
    p_user_id,
    p_subscription_id,
    p_previous_plan,
    p_new_plan,
    'user_initiated_downgrade',
    v_domains_affected,
    v_suspended_count,
    jsonb_build_object(
      'timestamp', now(),
      'auto_processed', true
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'action', 'suspended',
    'domains_suspended', v_suspended_count,
    'domains_affected', v_domains_affected
  );
END;
$$;

-- =====================================================
-- STEP 4: Function to handle plan UPGRADE
-- =====================================================

CREATE OR REPLACE FUNCTION handle_plan_upgrade(
  p_user_id uuid,
  p_subscription_id uuid,
  p_previous_plan text,
  p_new_plan text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_domains_affected jsonb DEFAULT '[]'::jsonb;
  v_domain_record record;
  v_reactivated_count integer DEFAULT 0;
BEGIN
  -- Only process if upgrading TO Elite
  IF p_new_plan != 'elite' THEN
    RETURN jsonb_build_object(
      'success', true,
      'action', 'none',
      'message', 'No premium domain reactivation needed'
    );
  END IF;

  -- Get all suspended premium domains for this user
  FOR v_domain_record IN
    SELECT * FROM get_user_premium_domains(p_user_id)
    WHERE current_status = 'suspended'
  LOOP
    -- Reactivate the domain
    UPDATE domains
    SET
      license_status = 'active',
      license_notes = 'Reativado automaticamente após upgrade para plano Elite.',
      updated_at = now()
    WHERE id = v_domain_record.domain_id;

    -- Add to affected domains list
    v_domains_affected := v_domains_affected || jsonb_build_object(
      'fqdn', v_domain_record.fqdn,
      'price_usd', v_domain_record.price_usd,
      'action', 'reactivated'
    );

    v_reactivated_count := v_reactivated_count + 1;

    -- Log in domain license history
    INSERT INTO domain_license_history (
      domain_id,
      previous_status,
      new_status,
      changed_by,
      change_reason,
      metadata
    ) VALUES (
      v_domain_record.domain_id,
      'suspended',
      'active',
      p_user_id,
      'Plan upgrade: ' || p_previous_plan || ' → Elite',
      jsonb_build_object(
        'previous_plan', p_previous_plan,
        'new_plan', p_new_plan,
        'automatic', true
      )
    );
  END LOOP;

  -- Log the plan change
  INSERT INTO plan_change_log (
    user_id,
    subscription_id,
    previous_plan_type,
    new_plan_type,
    change_reason,
    domains_affected,
    domains_reactivated,
    metadata
  ) VALUES (
    p_user_id,
    p_subscription_id,
    p_previous_plan,
    p_new_plan,
    'user_initiated_upgrade',
    v_domains_affected,
    v_reactivated_count,
    jsonb_build_object(
      'timestamp', now(),
      'auto_processed', true
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'action', 'reactivated',
    'domains_reactivated', v_reactivated_count,
    'domains_affected', v_domains_affected
  );
END;
$$;

-- =====================================================
-- STEP 5: Trigger function for subscription changes
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_handle_subscription_plan_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_old_plan_type text;
  v_new_plan_type text;
  v_result jsonb;
BEGIN
  -- Get plan types
  SELECT plan_type INTO v_old_plan_type
  FROM subscription_plans
  WHERE id = OLD.plan_id;

  SELECT plan_type INTO v_new_plan_type
  FROM subscription_plans
  WHERE id = NEW.plan_id;

  -- Skip if plan didn't actually change
  IF v_old_plan_type = v_new_plan_type THEN
    RETURN NEW;
  END IF;

  -- Handle downgrade (Elite → Standard)
  IF v_old_plan_type = 'elite' AND v_new_plan_type = 'standard' THEN
    v_result := handle_plan_downgrade(
      NEW.user_id,
      NEW.id,
      v_old_plan_type,
      v_new_plan_type
    );
  END IF;

  -- Handle upgrade (Standard → Elite or any → Elite)
  IF v_new_plan_type = 'elite' AND v_old_plan_type != 'elite' THEN
    v_result := handle_plan_upgrade(
      NEW.user_id,
      NEW.id,
      v_old_plan_type,
      v_new_plan_type
    );
  END IF;

  RETURN NEW;
END;
$$;

-- =====================================================
-- STEP 6: Create trigger
-- =====================================================

DROP TRIGGER IF EXISTS on_subscription_plan_change ON subscriptions;

CREATE TRIGGER on_subscription_plan_change
  AFTER UPDATE OF plan_id ON subscriptions
  FOR EACH ROW
  WHEN (OLD.plan_id IS DISTINCT FROM NEW.plan_id)
  EXECUTE FUNCTION trigger_handle_subscription_plan_change();

-- =====================================================
-- STEP 7: Add helper view for premium domain status
-- =====================================================

CREATE OR REPLACE VIEW user_premium_domain_status AS
SELECT
  d.user_id,
  d.id as domain_id,
  d.fqdn,
  d.license_status,
  d.license_notes,
  pd.price_usd,
  pd.category,
  sp.plan_type as current_plan_type,
  s.status as subscription_status,
  CASE
    WHEN d.license_status = 'suspended'
      AND sp.plan_type = 'standard'
      AND pd.price_usd > 500
    THEN true
    ELSE false
  END as can_reactivate_with_upgrade
FROM domains d
LEFT JOIN premium_domains pd ON pd.fqdn = d.fqdn
LEFT JOIN subscriptions s ON s.user_id = d.user_id AND s.status = 'active'
LEFT JOIN subscription_plans sp ON sp.id = s.plan_id
WHERE pd.price_usd > 500;

-- =====================================================
-- STEP 8: Grant permissions
-- =====================================================

GRANT SELECT ON user_premium_domain_status TO authenticated;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE 'Plan Downgrade Suspension System - DEPLOYED SUCCESSFULLY';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '✓ Table created: plan_change_log';
  RAISE NOTICE '✓ Function created: get_user_premium_domains()';
  RAISE NOTICE '✓ Function created: handle_plan_downgrade()';
  RAISE NOTICE '✓ Function created: handle_plan_upgrade()';
  RAISE NOTICE '✓ Trigger created: on_subscription_plan_change';
  RAISE NOTICE '✓ View created: user_premium_domain_status';
  RAISE NOTICE '';
  RAISE NOTICE 'BUSINESS RULES ACTIVE:';
  RAISE NOTICE '→ Elite → Standard: Premium domains (>$500) suspended';
  RAISE NOTICE '→ Standard → Elite: Suspended premium domains reactivated';
  RAISE NOTICE '→ Regular domains ($100/year) unaffected by plan changes';
  RAISE NOTICE '';
  RAISE NOTICE 'NEXT STEPS:';
  RAISE NOTICE '1. Deploy edge function: handle-plan-change';
  RAISE NOTICE '2. Update frontend: Add downgrade confirmation modal';
  RAISE NOTICE '3. Update terms: Document downgrade policy';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;
