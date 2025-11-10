/*
  # Admin Unlimited Access Bypass

  ## Objetivo
  Dar ao admin acesso REALMENTE ilimitado a todas as funcionalidades,
  ignorando todos os limites de plano.

  ## Alterações
  1. Atualizar check_user_plan_limit() - ignorar admin
  2. Atualizar enforce_content_limit() - ignorar admin
  3. Atualizar triggers de domínio - ignorar admin
  4. Admin sempre tem acesso supreme sem precisar subscription
*/

-- 1. Atualizar check_user_plan_limit para ignorar admin
CREATE OR REPLACE FUNCTION check_user_plan_limit(
  p_user_id uuid,
  p_content_type text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_plan_code text;
  v_current_count int;
  v_limit int;
  v_is_admin boolean;
BEGIN
  -- Verificar se é admin
  SELECT EXISTS (
    SELECT 1 FROM customers
    WHERE user_id = p_user_id AND role = 'admin'
  ) INTO v_is_admin;

  -- Admin sempre pode criar
  IF v_is_admin THEN
    RETURN true;
  END IF;

  -- Resto da lógica normal para não-admin
  SELECT sp.code INTO v_plan_code
  FROM subscriptions s
  JOIN subscription_plans sp ON sp.id = s.plan_id
  WHERE s.user_id = p_user_id
    AND s.status = 'active'
  ORDER BY s.created_at DESC
  LIMIT 1;

  v_plan_code := COALESCE(v_plan_code, 'starter');

  EXECUTE format('SELECT max_%s FROM plan_limits WHERE plan_code = $1', p_content_type)
  INTO v_limit
  USING v_plan_code;

  CASE p_content_type
    WHEN 'links' THEN
      SELECT COUNT(*) INTO v_current_count
      FROM profile_links
      WHERE user_id = p_user_id AND deleted_at IS NULL;

    WHEN 'products' THEN
      SELECT COUNT(*) INTO v_current_count
      FROM store_products
      WHERE user_id = p_user_id AND deleted_at IS NULL;

    ELSE
      RETURN true;
  END CASE;

  RETURN v_current_count < v_limit;
END;
$$;

-- 2. Atualizar enforce_content_limit para ignorar admin
CREATE OR REPLACE FUNCTION enforce_content_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_content_type text;
  v_can_create boolean;
  v_is_admin boolean;
BEGIN
  -- Verificar se é admin
  SELECT EXISTS (
    SELECT 1 FROM customers
    WHERE user_id = NEW.user_id AND role = 'admin'
  ) INTO v_is_admin;

  -- Admin sempre pode criar
  IF v_is_admin THEN
    RETURN NEW;
  END IF;

  -- Resto da lógica normal
  v_content_type := CASE TG_TABLE_NAME
    WHEN 'profile_links' THEN 'links'
    WHEN 'store_products' THEN 'products'
    ELSE 'unknown'
  END;

  IF v_content_type = 'unknown' THEN
    RETURN NEW;
  END IF;

  v_can_create := check_user_plan_limit(NEW.user_id, v_content_type);

  IF NOT v_can_create THEN
    RAISE EXCEPTION 'Content limit exceeded for %. Upgrade your plan to add more.', v_content_type
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Criar função para validar limite de domínios (com exceção admin)
CREATE OR REPLACE FUNCTION validate_domain_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_customer_id uuid;
  v_user_id uuid;
  v_is_admin boolean;
  v_plan_code text;
  v_max_domains int;
  v_current_count int;
BEGIN
  -- Pegar customer_id e user_id
  v_customer_id := NEW.customer_id;

  SELECT user_id INTO v_user_id
  FROM customers
  WHERE id = v_customer_id;

  -- Verificar se é admin
  SELECT EXISTS (
    SELECT 1 FROM customers
    WHERE user_id = v_user_id AND role = 'admin'
  ) INTO v_is_admin;

  -- Admin sempre pode adicionar domínios
  IF v_is_admin THEN
    RETURN NEW;
  END IF;

  -- Buscar plano ativo do usuário
  SELECT sp.code, sp.max_domains
  INTO v_plan_code, v_max_domains
  FROM subscriptions s
  JOIN subscription_plans sp ON sp.id = s.plan_id
  WHERE s.user_id = v_user_id
    AND s.status IN ('active', 'trialing')
  ORDER BY s.created_at DESC
  LIMIT 1;

  -- Se não tem plano ou max_domains é NULL (ilimitado), permite
  IF v_max_domains IS NULL THEN
    RETURN NEW;
  END IF;

  -- Contar domínios atuais
  SELECT COUNT(*)
  INTO v_current_count
  FROM domains
  WHERE customer_id = v_customer_id;

  -- Se exceder limite, bloquear
  IF v_current_count >= v_max_domains THEN
    RAISE EXCEPTION 'Domain limit exceeded. Your plan allows % domain(s). Upgrade to Elite for unlimited domains.', v_max_domains
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar trigger de domínios
DROP TRIGGER IF EXISTS check_domain_limit_on_insert ON domains;
CREATE TRIGGER check_domain_limit_on_insert
  BEFORE INSERT ON domains
  FOR EACH ROW
  EXECUTE FUNCTION validate_domain_limit();

-- 4. Comentários explicativos
COMMENT ON FUNCTION check_user_plan_limit IS 'Verifica limites de conteúdo (admin sempre retorna true)';
COMMENT ON FUNCTION enforce_content_limit IS 'Enforce content limits via trigger (admin bypassed)';
COMMENT ON FUNCTION validate_domain_limit IS 'Valida limite de domínios (admin bypassed)';
