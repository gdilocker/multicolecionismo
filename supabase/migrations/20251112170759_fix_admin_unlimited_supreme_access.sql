/*
  # Admin Supreme Vitalício - Acesso Ilimitado

  ## Objetivo
  Garantir que o admin tenha:
  - ✅ Plano Supreme vitalício (já criado)
  - ✅ Bypass total de limites de domínios
  - ✅ Bypass total de limites de links/produtos
  - ✅ Bypass total de limites de posts sociais
  - ✅ Acesso a todas as features premium

  ## Implementação
  1. Função para verificar se user é admin
  2. Bypass em todas as validações de limite
  3. Comentários explicativos
*/

-- Função auxiliar para verificar se é admin
CREATE OR REPLACE FUNCTION is_admin(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM customers
    WHERE user_id = p_user_id AND role = 'admin'
  );
$$;

-- Função para validar limite de domínios (com bypass admin)
CREATE OR REPLACE FUNCTION validate_domain_limit_for_customer(p_customer_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_user_id uuid;
  v_max_domains int;
  v_current_count int;
BEGIN
  -- Pegar user_id do customer
  SELECT user_id INTO v_user_id
  FROM customers
  WHERE id = p_customer_id;

  -- Admin sempre pode
  IF is_admin(v_user_id) THEN
    RETURN true;
  END IF;

  -- Buscar limite do plano
  SELECT sp.max_domains
  INTO v_max_domains
  FROM user_subscriptions us
  JOIN subscription_plans sp ON sp.id = us.plan_id
  WHERE us.user_id = v_user_id
    AND us.status = 'active'
  ORDER BY us.created_at DESC
  LIMIT 1;

  -- Se não tem plano ativo, usar limite starter (1)
  v_max_domains := COALESCE(v_max_domains, 1);

  -- Contar domínios atuais
  SELECT COUNT(*)
  INTO v_current_count
  FROM domains
  WHERE customer_id = p_customer_id;

  -- Retornar se pode criar mais
  RETURN v_current_count < v_max_domains;
END;
$$;

-- Função para validar limite de links (com bypass admin)
CREATE OR REPLACE FUNCTION validate_link_limit_for_user(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_max_links int;
  v_current_count int;
BEGIN
  -- Admin sempre pode
  IF is_admin(p_user_id) THEN
    RETURN true;
  END IF;

  -- Buscar limite do plano
  SELECT sp.max_links
  INTO v_max_links
  FROM user_subscriptions us
  JOIN subscription_plans sp ON sp.id = us.plan_id
  WHERE us.user_id = p_user_id
    AND us.status = 'active'
  ORDER BY us.created_at DESC
  LIMIT 1;

  -- Se não tem plano, limite starter padrão
  v_max_links := COALESCE(v_max_links, 5);

  -- Contar links atuais
  SELECT COUNT(*)
  INTO v_current_count
  FROM profile_links
  WHERE user_id = p_user_id;

  RETURN v_current_count < v_max_links;
END;
$$;

-- Função para validar limite de posts (com bypass admin)
CREATE OR REPLACE FUNCTION validate_post_limit_for_user(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  -- Admin sempre pode
  IF is_admin(p_user_id) THEN
    RETURN true;
  END IF;

  -- Usuários normais também podem (sem limite de posts por ora)
  RETURN true;
END;
$$;

-- Trigger para validar limite de domínios no INSERT
CREATE OR REPLACE FUNCTION check_domain_limit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT validate_domain_limit_for_customer(NEW.customer_id) THEN
    RAISE EXCEPTION 'Domain limit exceeded for your plan'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_domain_limit ON domains;
CREATE TRIGGER enforce_domain_limit
  BEFORE INSERT ON domains
  FOR EACH ROW
  EXECUTE FUNCTION check_domain_limit_trigger();

-- Trigger para validar limite de links no INSERT
CREATE OR REPLACE FUNCTION check_link_limit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT validate_link_limit_for_user(NEW.user_id) THEN
    RAISE EXCEPTION 'Link limit exceeded for your plan'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_link_limit ON profile_links;
CREATE TRIGGER enforce_link_limit
  BEFORE INSERT ON profile_links
  FOR EACH ROW
  EXECUTE FUNCTION check_link_limit_trigger();

-- Comentários
COMMENT ON FUNCTION is_admin IS 'Verifica se um user_id é admin';
COMMENT ON FUNCTION validate_domain_limit_for_customer IS 'Valida limite de domínios (admin tem bypass)';
COMMENT ON FUNCTION validate_link_limit_for_user IS 'Valida limite de links (admin tem bypass)';
COMMENT ON FUNCTION validate_post_limit_for_user IS 'Valida limite de posts (admin tem bypass)';
