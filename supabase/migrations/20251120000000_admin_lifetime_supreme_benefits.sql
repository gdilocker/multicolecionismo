/*
  # Admin Lifetime Supreme Benefits

  1. Garantir que admins têm:
    - Plano Supreme vitalício
    - Domínios ilimitados
    - Todas as funcionalidades

  2. Alterações:
    - Update função para verificar admin tem sempre supreme
    - Policy para admin ter acesso ilimitado
*/

-- Função para verificar se usuário é admin
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM customers
    WHERE user_id = auth.uid()
    AND role = 'admin'
  );
END;
$$;

-- Função para obter plano do usuário (admin sempre retorna supreme)
CREATE OR REPLACE FUNCTION get_user_plan()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
  user_plan TEXT;
BEGIN
  -- Pegar role e plano
  SELECT role, subscription_plan
  INTO user_role, user_plan
  FROM customers
  WHERE user_id = auth.uid();

  -- Se é admin, retorna supreme
  IF user_role = 'admin' THEN
    RETURN 'supreme';
  END IF;

  -- Senão retorna o plano atual ou 'free'
  RETURN COALESCE(user_plan, 'free');
END;
$$;

-- Atualizar política de subscriptions para admin ter acesso total
DROP POLICY IF EXISTS "Users can view their own subscription" ON subscriptions;
CREATE POLICY "Users can view their own subscription"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR is_admin_user()
  );

-- Comentário explicativo
COMMENT ON FUNCTION is_admin_user() IS 'Verifica se o usuário autenticado é admin';
COMMENT ON FUNCTION get_user_plan() IS 'Retorna o plano do usuário (admin sempre retorna supreme)';
