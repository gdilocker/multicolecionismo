/*
  # Adicionar coluna active_domain_id à tabela customers

  ## Problema
  O código está tentando acessar a coluna active_domain_id na tabela customers,
  mas ela não existe.

  ## Solução
  Adicionar a coluna active_domain_id como referência ao domínio ativo do usuário.
*/

-- Add active_domain_id column
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS active_domain_id uuid REFERENCES domains(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_customers_active_domain ON customers(active_domain_id);

-- Add comment for documentation
COMMENT ON COLUMN customers.active_domain_id IS 'O domínio ativo/principal do cliente para exibição de perfil';