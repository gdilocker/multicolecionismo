/*
  # FIX DEFINITIVO: Admin Dashboard Access

  ## Problema
  A função get_user_role_and_subscription está:
  1. Buscando coluna plan_type que não existe (é "name")
  2. Buscando tabela subscriptions que não existe (é "user_subscriptions")
  3. Fazendo fallback que não detecta admin corretamente

  ## Solução
  Recriar a função com:
  - ✅ Detecção de admin PRIMEIRO (bypass total)
  - ✅ Usar tabela correta: user_subscriptions
  - ✅ Usar coluna correta: sp.name (não plan_type)
  - ✅ Admin SEMPRE retorna has_active_subscription = true
  - ✅ Admin SEMPRE retorna subscription_plan = 'Supreme'
*/

-- Drop função antiga
DROP FUNCTION IF EXISTS get_user_role_and_subscription(uuid);

-- Criar função correta e otimizada
CREATE OR REPLACE FUNCTION get_user_role_and_subscription(user_uuid uuid)
RETURNS TABLE(
  role text,
  has_active_subscription boolean,
  subscription_plan text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET statement_timeout = '5s'
AS $$
DECLARE
  v_role text;
  v_has_sub boolean;
  v_plan text;
BEGIN
  -- STEP 1: Get customer role (FASTEST QUERY)
  SELECT COALESCE(c.role, 'user')
  INTO v_role
  FROM customers c
  WHERE c.user_id = user_uuid
  LIMIT 1;

  -- STEP 2: CHECK IF ADMIN - BYPASS EVERYTHING
  IF v_role = 'admin' THEN
    RETURN QUERY SELECT
      'admin'::text,
      true,  -- Admin SEMPRE tem subscription ativa
      'Supreme'::text;  -- Admin SEMPRE tem Supreme
    RETURN;
  END IF;

  -- STEP 3: For non-admin, check real subscription
  SELECT
    true,
    sp.name  -- ← CORRETO: usar sp.name, não plan_type
  INTO v_has_sub, v_plan
  FROM user_subscriptions us  -- ← CORRETO: usar user_subscriptions, não subscriptions
  INNER JOIN subscription_plans sp ON sp.id = us.plan_id
  WHERE us.user_id = user_uuid
    AND us.status = 'active'
  ORDER BY us.created_at DESC
  LIMIT 1;

  -- STEP 4: Return result
  RETURN QUERY SELECT
    COALESCE(v_role, 'user')::text,
    COALESCE(v_has_sub, false),
    v_plan;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_user_role_and_subscription(uuid) TO authenticated, anon;

-- Add helpful comment
COMMENT ON FUNCTION get_user_role_and_subscription IS
'Returns user role and subscription status. ADMIN ALWAYS GETS BYPASS with has_active_subscription=true and subscription_plan=Supreme.';

-- Test the function for admin user
DO $$
DECLARE
  test_result record;
BEGIN
  SELECT * INTO test_result
  FROM get_user_role_and_subscription('13611733-0bb9-4668-9941-5a76fbbc8c2b');
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TEST: Admin User Access';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Role: %', test_result.role;
  RAISE NOTICE 'Has Active Sub: %', test_result.has_active_subscription;
  RAISE NOTICE 'Plan: %', test_result.subscription_plan;
  RAISE NOTICE '========================================';
  
  IF test_result.role != 'admin' OR test_result.has_active_subscription != true THEN
    RAISE EXCEPTION 'ADMIN ACCESS TEST FAILED!';
  END IF;
  
  RAISE NOTICE '✅ ADMIN ACCESS TEST PASSED!';
END $$;
