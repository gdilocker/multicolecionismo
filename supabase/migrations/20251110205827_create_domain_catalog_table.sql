/*
  # Criar tabela domain_catalog

  ## Problema Identificado
  A Edge Function domains está falhando com HTTP 500 porque a tabela domain_catalog não existe.
  
  ## Solução
  Criar a tabela domain_catalog para catalogar todos os domínios disponíveis e premium.
  
  1. Nova Tabela
    - `domain_catalog`
      - `id` (uuid, primary key)
      - `fqdn` (text, unique) - Nome completo do domínio
      - `is_available` (boolean) - Se o domínio está disponível
      - `is_premium` (boolean) - Se é um domínio premium
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Segurança
    - Enable RLS na tabela
    - Policy para leitura pública (necessário para verificação de disponibilidade)
    - Policy restritiva para escrita (apenas admin)
*/

-- Create domain_catalog table
CREATE TABLE IF NOT EXISTS domain_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fqdn text UNIQUE NOT NULL,
  is_available boolean DEFAULT true NOT NULL,
  is_premium boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_domain_catalog_fqdn ON domain_catalog(fqdn);
CREATE INDEX IF NOT EXISTS idx_domain_catalog_available ON domain_catalog(is_available) WHERE is_available = true;

-- Enable RLS
ALTER TABLE domain_catalog ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access (necessary for domain availability checks)
CREATE POLICY "Allow public read access to domain catalog"
  ON domain_catalog
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Policy: Only admins can insert
CREATE POLICY "Only admins can insert domains"
  ON domain_catalog
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = auth.uid()
      AND customers.role = 'admin'
    )
  );

-- Policy: Only admins can update
CREATE POLICY "Only admins can update domains"
  ON domain_catalog
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

-- Policy: Only admins can delete
CREATE POLICY "Only admins can delete domains"
  ON domain_catalog
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = auth.uid()
      AND customers.role = 'admin'
    )
  );

-- Create trigger to update updated_at
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