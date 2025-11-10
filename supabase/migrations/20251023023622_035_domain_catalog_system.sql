/*
  # Sistema de Catálogo de Domínios .com.rich

  ## Objetivo
  Gerenciar automaticamente a disponibilidade e tipo de cada domínio .com.rich
  com regras automáticas de compra, exibição e associação aos planos Standard e Elite.

  ## Novas Tabelas
  - `domain_catalog` - Catálogo de domínios disponíveis para venda
    - `id` (uuid, PK)
    - `domain_name` (text, único) - Nome do domínio sem extensão (ex: "teste")
    - `fqdn` (text, único) - Domínio completo (ex: "teste.com.rich")
    - `is_available` (boolean) - Se está disponível para compra
    - `is_premium` (boolean) - Se é domínio premium (apenas Elite)
    - `price_usd` (numeric) - Preço individual (NULL para premium)
    - `description` (text) - Descrição do domínio
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)
    - `sold_at` (timestamptz) - Quando foi vendido
    - `sold_to_customer_id` (uuid) - ID do cliente que comprou

  ## Regras de Negócio
  1. Domínios standard (is_premium=false): Podem ser usados em qualquer plano
  2. Domínios premium (is_premium=true): Apenas no plano Elite
  3. Ao ser vendido, is_available=false e sold_at é preenchido
  4. Preço de domínios premium é sempre vinculado ao plano Elite

  ## Segurança
  - RLS habilitado
  - Leitura pública (busca de domínios)
  - Escrita apenas para admins
*/

-- Criar tabela de catálogo de domínios
CREATE TABLE IF NOT EXISTS domain_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_name text NOT NULL,
  fqdn text NOT NULL UNIQUE,
  is_available boolean NOT NULL DEFAULT true,
  is_premium boolean NOT NULL DEFAULT false,
  price_usd numeric(10,2),
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  sold_at timestamptz,
  sold_to_customer_id uuid REFERENCES customers(id),
  CONSTRAINT domain_name_format CHECK (domain_name ~ '^[a-z0-9-]+$'),
  CONSTRAINT fqdn_format CHECK (fqdn ~ '^[a-z0-9-]+\.com\.rich$')
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_domain_catalog_available ON domain_catalog(is_available);
CREATE INDEX IF NOT EXISTS idx_domain_catalog_premium ON domain_catalog(is_premium);
CREATE INDEX IF NOT EXISTS idx_domain_catalog_fqdn ON domain_catalog(fqdn);
CREATE INDEX IF NOT EXISTS idx_domain_catalog_domain_name ON domain_catalog(domain_name);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_domain_catalog_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER domain_catalog_updated_at
  BEFORE UPDATE ON domain_catalog
  FOR EACH ROW
  EXECUTE FUNCTION update_domain_catalog_updated_at();

-- Habilitar RLS
ALTER TABLE domain_catalog ENABLE ROW LEVEL SECURITY;

-- Política: Todos podem ler (para buscar domínios)
CREATE POLICY "Anyone can read domain catalog"
  ON domain_catalog FOR SELECT
  TO authenticated, anon
  USING (true);

-- Política: Apenas admins podem inserir
CREATE POLICY "Admins can insert domains"
  ON domain_catalog FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = auth.uid()
      AND customers.role = 'admin'
    )
  );

-- Política: Apenas admins podem atualizar
CREATE POLICY "Admins can update domains"
  ON domain_catalog FOR UPDATE
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

-- Política: Apenas admins podem deletar
CREATE POLICY "Admins can delete domains"
  ON domain_catalog FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = auth.uid()
      AND customers.role = 'admin'
    )
  );

-- Inserir alguns domínios de exemplo
INSERT INTO domain_catalog (domain_name, fqdn, is_available, is_premium, price_usd, description)
VALUES 
  ('premium', 'premium.com.rich', true, true, NULL, 'Domínio premium - Apenas plano Elite'),
  ('luxury', 'luxury.com.rich', true, true, NULL, 'Domínio premium - Apenas plano Elite'),
  ('elite', 'elite.com.rich', true, true, NULL, 'Domínio premium - Apenas plano Elite'),
  ('vip', 'vip.com.rich', true, true, NULL, 'Domínio premium - Apenas plano Elite'),
  ('gold', 'gold.com.rich', true, true, NULL, 'Domínio premium - Apenas plano Elite'),
  ('teste', 'teste.com.rich', true, false, 50.00, 'Domínio disponível - Qualquer plano'),
  ('exemplo', 'exemplo.com.rich', true, false, 50.00, 'Domínio disponível - Qualquer plano'),
  ('meusite', 'meusite.com.rich', true, false, 50.00, 'Domínio disponível - Qualquer plano'),
  ('admin', 'admin.com.rich', false, false, NULL, 'Domínio já registrado'),
  ('root', 'root.com.rich', false, false, NULL, 'Domínio já registrado'),
  ('system', 'system.com.rich', false, false, NULL, 'Domínio já registrado')
ON CONFLICT (fqdn) DO NOTHING;