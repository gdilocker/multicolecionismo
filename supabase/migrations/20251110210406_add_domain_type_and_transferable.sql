/*
  # Adicionar colunas domain_type e is_transferable

  ## Problema
  O código de registro de domínio está tentando inserir as colunas domain_type e is_transferable
  que não existem na tabela domains.

  ## Solução
  Adicionar as colunas necessárias:
  - domain_type: tipo do domínio (personal, business, etc)
  - is_transferable: se o domínio pode ser transferido
*/

-- Add domain_type column
ALTER TABLE domains 
ADD COLUMN IF NOT EXISTS domain_type text DEFAULT 'personal';

-- Add is_transferable column
ALTER TABLE domains 
ADD COLUMN IF NOT EXISTS is_transferable boolean DEFAULT true;

-- Add constraint for domain_type
ALTER TABLE domains 
ADD CONSTRAINT domains_domain_type_check 
CHECK (domain_type IN ('personal', 'business', 'premium'));

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_domains_type ON domains(domain_type);
CREATE INDEX IF NOT EXISTS idx_domains_transferable ON domains(is_transferable);