/*
  # Corrigir lógica de domínios .com.rich - Tri-estado

  ## Objetivo
  Implementar sistema correto de verificação de domínios com 3 estados:
  1. OUT_OF_CATALOG - Não existe no catálogo
  2. UNAVAILABLE - Existe mas foi vendido (is_available=false)
  3. AVAILABLE - Existe e está disponível (is_available=true)

  ## Alterações na Tabela domain_catalog
  - Remover campos desnecessários
  - Adicionar owner_user_id para rastrear vendas
  - Adicionar meta JSONB para dados extras
  - Manter estrutura simples e clara

  ## Regras de Negócio
  1. Premium (is_premium=true): Apenas plano Elite, sem preço individual
  2. Standard (is_premium=false): Planos Standard ou Elite, preço US$ 50/mês
  3. Vendido (is_available=false): Mostra sugestões
  4. Não catalogado: Mostra botão de contato

  ## Segurança
  - RLS habilitado
  - Trigger para updated_at
  - Constraints para integridade
*/

-- Verificar e ajustar tabela domain_catalog
DO $$
BEGIN
  -- Adicionar owner_user_id se não existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'domain_catalog' AND column_name = 'owner_user_id'
  ) THEN
    ALTER TABLE domain_catalog ADD COLUMN owner_user_id uuid REFERENCES auth.users(id);
  END IF;

  -- Adicionar meta se não existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'domain_catalog' AND column_name = 'meta'
  ) THEN
    ALTER TABLE domain_catalog ADD COLUMN meta jsonb DEFAULT '{}'::jsonb;
  END IF;

  -- Remover sold_to_customer_id se existe (vamos usar owner_user_id)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'domain_catalog' AND column_name = 'sold_to_customer_id'
  ) THEN
    ALTER TABLE domain_catalog DROP COLUMN sold_to_customer_id;
  END IF;

  -- Remover sold_at se existe (usaremos updated_at quando is_available mudar)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'domain_catalog' AND column_name = 'sold_at'
  ) THEN
    ALTER TABLE domain_catalog DROP COLUMN sold_at;
  END IF;

  -- Remover domain_name se existe (FQDN é suficiente)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'domain_catalog' AND column_name = 'domain_name'
  ) THEN
    ALTER TABLE domain_catalog DROP COLUMN domain_name;
  END IF;
END $$;

-- Garantir constraints corretos
ALTER TABLE domain_catalog 
  ALTER COLUMN fqdn SET NOT NULL,
  ALTER COLUMN is_available SET NOT NULL,
  ALTER COLUMN is_available SET DEFAULT true,
  ALTER COLUMN is_premium SET NOT NULL,
  ALTER COLUMN is_premium SET DEFAULT false;

-- Adicionar constraint de formato FQDN
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'domain_catalog_fqdn_format'
  ) THEN
    ALTER TABLE domain_catalog 
      ADD CONSTRAINT domain_catalog_fqdn_format 
      CHECK (fqdn ~ '^[a-z0-9-]+\.com\.rich$');
  END IF;
END $$;

-- Garantir índices para performance
CREATE INDEX IF NOT EXISTS idx_domain_catalog_fqdn_lower 
  ON domain_catalog(LOWER(fqdn));

CREATE INDEX IF NOT EXISTS idx_domain_catalog_available_premium 
  ON domain_catalog(is_available, is_premium);

CREATE INDEX IF NOT EXISTS idx_domain_catalog_owner 
  ON domain_catalog(owner_user_id) WHERE owner_user_id IS NOT NULL;

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_domain_catalog_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_domain_catalog_timestamp ON domain_catalog;
CREATE TRIGGER trg_domain_catalog_timestamp
  BEFORE UPDATE ON domain_catalog
  FOR EACH ROW
  EXECUTE FUNCTION update_domain_catalog_timestamp();

-- Limpar e inserir dados de seed para testes
DELETE FROM domain_catalog WHERE fqdn IN (
  'ola.com.rich',
  'lux.com.rich', 
  'maria.com.rich',
  'teste.com.rich',
  'exemplo.com.rich',
  'premium.com.rich',
  'luxury.com.rich',
  'elite.com.rich',
  'vip.com.rich',
  'gold.com.rich',
  'admin.com.rich',
  'root.com.rich',
  'system.com.rich',
  'meusite.com.rich'
);

INSERT INTO domain_catalog (fqdn, is_available, is_premium, description) VALUES
  -- Domínios disponíveis (standard)
  ('ola.com.rich', true, false, 'Domínio disponível - Planos Standard ou Elite'),
  ('teste.com.rich', true, false, 'Domínio disponível - Planos Standard ou Elite'),
  ('exemplo.com.rich', true, false, 'Domínio disponível - Planos Standard ou Elite'),
  ('meusite.com.rich', true, false, 'Domínio disponível - Planos Standard ou Elite'),
  
  -- Domínios premium (apenas Elite)
  ('lux.com.rich', true, true, 'Domínio Premium - Apenas plano Elite'),
  ('premium.com.rich', true, true, 'Domínio Premium - Apenas plano Elite'),
  ('luxury.com.rich', true, true, 'Domínio Premium - Apenas plano Elite'),
  ('elite.com.rich', true, true, 'Domínio Premium - Apenas plano Elite'),
  ('vip.com.rich', true, true, 'Domínio Premium - Apenas plano Elite'),
  ('gold.com.rich', true, true, 'Domínio Premium - Apenas plano Elite'),
  
  -- Domínios indisponíveis (já vendidos)
  ('maria.com.rich', false, false, 'Domínio já registrado'),
  ('admin.com.rich', false, false, 'Domínio já registrado'),
  ('root.com.rich', false, false, 'Domínio já registrado'),
  ('system.com.rich', false, false, 'Domínio já registrado')
ON CONFLICT (fqdn) DO UPDATE SET
  is_available = EXCLUDED.is_available,
  is_premium = EXCLUDED.is_premium,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Comentário explicativo
COMMENT ON TABLE domain_catalog IS 'Catálogo de domínios .com.rich - 3 estados: OUT_OF_CATALOG (não existe), UNAVAILABLE (exists + is_available=false), AVAILABLE (exists + is_available=true)';
COMMENT ON COLUMN domain_catalog.is_available IS 'TRUE = disponível para venda, FALSE = já vendido/registrado';
COMMENT ON COLUMN domain_catalog.is_premium IS 'TRUE = requer plano Elite (sem preço individual), FALSE = Standard ou Elite (US$ 50/mês)';
COMMENT ON COLUMN domain_catalog.owner_user_id IS 'ID do usuário que comprou o domínio (quando is_available=false)';