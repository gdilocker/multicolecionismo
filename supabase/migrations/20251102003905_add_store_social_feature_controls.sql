/*
  # Sistema de Controle de Funcionalidades Loja e Social

  1. Alterações
    - Adiciona colunas de controle para funcionalidades Loja e Social na tabela `user_profiles`
    - Adiciona colunas de controle admin para bloquear funcionalidades por perfil
    - Permite ativar/desativar Loja e Social tanto pelo usuário quanto pelo admin
    
  2. Novas Colunas em `user_profiles`
    - `store_enabled` (boolean): Controle do usuário para ativar/desativar Loja
    - `social_enabled` (boolean): Controle do usuário para ativar/desativar Social
    - `store_allowed_by_admin` (boolean): Controle admin - permite/bloqueia Loja
    - `social_allowed_by_admin` (boolean): Controle admin - permite/bloqueia Social
    
  3. Comportamento
    - Usuário só pode ativar se admin permitir
    - Admin tem controle total sobre permitir/bloquear
    - Padrão: funcionalidades ativadas e permitidas
    - Quando desativadas, conteúdo é ocultado mas não deletado
    
  4. Segurança
    - RLS garante que usuários só modificam seus próprios controles
    - Admins podem modificar controles de qualquer perfil
*/

-- Adicionar colunas de controle de funcionalidades
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS store_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS social_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS store_allowed_by_admin boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS social_allowed_by_admin boolean DEFAULT true;

-- Comentários explicativos
COMMENT ON COLUMN user_profiles.store_enabled IS 
'Controle do usuário: ativa/desativa funcionalidade de Loja na sua página';

COMMENT ON COLUMN user_profiles.social_enabled IS 
'Controle do usuário: ativa/desativa funcionalidade de Rede Social na sua página';

COMMENT ON COLUMN user_profiles.store_allowed_by_admin IS 
'Controle admin: permite/bloqueia funcionalidade de Loja para este perfil';

COMMENT ON COLUMN user_profiles.social_allowed_by_admin IS 
'Controle admin: permite/bloqueia funcionalidade de Rede Social para este perfil';

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_store_enabled 
ON user_profiles(store_enabled) WHERE store_enabled = true;

CREATE INDEX IF NOT EXISTS idx_user_profiles_social_enabled 
ON user_profiles(social_enabled) WHERE social_enabled = true;

-- Função para verificar se funcionalidade está realmente ativa
CREATE OR REPLACE FUNCTION is_store_active(profile_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  store_on boolean;
  admin_allows boolean;
BEGIN
  SELECT store_enabled, store_allowed_by_admin 
  INTO store_on, admin_allows
  FROM user_profiles 
  WHERE id = profile_id;
  
  RETURN COALESCE(store_on, false) AND COALESCE(admin_allows, true);
END;
$$;

CREATE OR REPLACE FUNCTION is_social_active(profile_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  social_on boolean;
  admin_allows boolean;
BEGIN
  SELECT social_enabled, social_allowed_by_admin 
  INTO social_on, admin_allows
  FROM user_profiles 
  WHERE id = profile_id;
  
  RETURN COALESCE(social_on, false) AND COALESCE(admin_allows, true);
END;
$$;

-- Policy para usuários atualizarem seus próprios controles
CREATE POLICY "Users can update own feature controls"
ON user_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  -- Usuários não podem modificar colunas *_allowed_by_admin
  AND store_allowed_by_admin = (SELECT store_allowed_by_admin FROM user_profiles WHERE id = user_profiles.id)
  AND social_allowed_by_admin = (SELECT social_allowed_by_admin FROM user_profiles WHERE id = user_profiles.id)
);

-- Policy para admins controlarem permissões
CREATE POLICY "Admins can control feature permissions"
ON user_profiles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM customers 
    WHERE customers.user_id = auth.uid() 
    AND customers.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM customers 
    WHERE customers.user_id = auth.uid() 
    AND customers.role = 'admin'
  )
);