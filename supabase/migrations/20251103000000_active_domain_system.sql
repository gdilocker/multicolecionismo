/*
  # Sistema de Domínio Ativo no Dashboard

  1. Alterações
    - Adiciona coluna `active_domain_id` na tabela `customers` para rastrear qual domínio está ativo
    - Permite que o usuário alterne entre seus domínios
    - Dashboard mostra atalhos apenas do domínio ativo
    - Cards de módulos (Página, Loja, Social) aparecem apenas se estiverem ativos para aquele domínio

  2. Nova Coluna em `customers`
    - `active_domain_id` (uuid): ID do domínio atualmente ativo para visualização no dashboard
    - Por padrão, será o primeiro domínio do usuário (mais antigo)

  3. Comportamento
    - Usuário pode alternar o domínio ativo na interface
    - Dashboard reflete apenas o domínio ativo selecionado
    - Atalhos rápidos mostram apenas módulos ativos para aquele domínio
    - Se módulo está desativado (store_enabled=false ou social_enabled=false), não aparece

  4. Segurança
    - RLS garante que usuários só modificam seu próprio active_domain_id
    - Validação para garantir que o domínio pertence ao usuário
*/

-- Adicionar coluna active_domain_id à tabela customers
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS active_domain_id uuid REFERENCES domains(id) ON DELETE SET NULL;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_customers_active_domain_id
ON customers(active_domain_id);

-- Comentário explicativo
COMMENT ON COLUMN customers.active_domain_id IS
'ID do domínio atualmente ativo para visualização no dashboard. O usuário pode alternar entre seus domínios.';

-- Função para definir automaticamente o primeiro domínio como ativo
CREATE OR REPLACE FUNCTION set_first_domain_as_active()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_id uuid;
  v_first_domain_id uuid;
BEGIN
  -- Buscar o customer_id do domínio recém-criado
  v_customer_id := NEW.customer_id;

  -- Verificar se o customer já tem um active_domain_id
  IF NOT EXISTS (
    SELECT 1 FROM customers
    WHERE id = v_customer_id
    AND active_domain_id IS NOT NULL
  ) THEN
    -- Buscar o primeiro domínio do customer (mais antigo)
    SELECT id INTO v_first_domain_id
    FROM domains
    WHERE customer_id = v_customer_id
    ORDER BY created_at ASC
    LIMIT 1;

    -- Definir como ativo
    IF v_first_domain_id IS NOT NULL THEN
      UPDATE customers
      SET active_domain_id = v_first_domain_id
      WHERE id = v_customer_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger para definir o primeiro domínio como ativo automaticamente
DROP TRIGGER IF EXISTS trigger_set_first_domain_active ON domains;
CREATE TRIGGER trigger_set_first_domain_active
AFTER INSERT ON domains
FOR EACH ROW
EXECUTE FUNCTION set_first_domain_as_active();

-- Função para validar se o domínio pertence ao usuário antes de atualizar
CREATE OR REPLACE FUNCTION validate_active_domain_ownership()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se active_domain_id for NULL, permitir
  IF NEW.active_domain_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Verificar se o domínio pertence ao customer
  IF NOT EXISTS (
    SELECT 1 FROM domains
    WHERE id = NEW.active_domain_id
    AND customer_id = NEW.id
  ) THEN
    RAISE EXCEPTION 'O domínio selecionado não pertence a este usuário';
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger para validar ownership antes de atualizar active_domain_id
DROP TRIGGER IF EXISTS trigger_validate_active_domain ON customers;
CREATE TRIGGER trigger_validate_active_domain
BEFORE UPDATE OF active_domain_id ON customers
FOR EACH ROW
EXECUTE FUNCTION validate_active_domain_ownership();

-- Atualizar customers existentes para definir o primeiro domínio como ativo
DO $$
DECLARE
  customer_record RECORD;
  first_domain_id uuid;
BEGIN
  FOR customer_record IN
    SELECT id FROM customers WHERE active_domain_id IS NULL
  LOOP
    SELECT id INTO first_domain_id
    FROM domains
    WHERE customer_id = customer_record.id
    ORDER BY created_at ASC
    LIMIT 1;

    IF first_domain_id IS NOT NULL THEN
      UPDATE customers
      SET active_domain_id = first_domain_id
      WHERE id = customer_record.id;
    END IF;
  END LOOP;
END $$;

-- Policy para permitir que usuários atualizem seu próprio active_domain_id
CREATE POLICY "Users can update own active_domain_id"
ON customers
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
