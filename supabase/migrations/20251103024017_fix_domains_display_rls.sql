/*
  # Correção de RLS para Exibição de Domínios

  1. Problema Identificado
    - Usuários não conseguem visualizar seus próprios domínios
    - Erro de RLS na tabela customers impedindo acesso
    - A coluna active_domain_id pode estar causando recursão

  2. Solução
    - Simplificar políticas RLS da tabela customers
    - Garantir que usuários possam ler e atualizar seus próprios dados
    - Remover políticas que causam recursão

  3. Segurança
    - Manter restrição: usuários só acessam seus próprios dados
    - Permitir leitura e atualização do active_domain_id
*/

-- Remover políticas existentes que podem estar causando problemas
DROP POLICY IF EXISTS "Users can read own customer data" ON customers;
DROP POLICY IF EXISTS "Users can update own active_domain_id" ON customers;
DROP POLICY IF EXISTS "Users can view own customer record" ON customers;
DROP POLICY IF EXISTS "Users can update own customer record" ON customers;

-- Criar política simples e direta para leitura
CREATE POLICY "Users can read own customer data"
ON customers
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Criar política simples para atualização (incluindo active_domain_id)
CREATE POLICY "Users can update own customer data"
ON customers
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Garantir que a política de domains também está correta
DROP POLICY IF EXISTS "Users can view own domains" ON domains;
DROP POLICY IF EXISTS "Users can view their domains" ON domains;

CREATE POLICY "Users can view own domains"
ON domains
FOR SELECT
TO authenticated
USING (
  customer_id IN (
    SELECT id FROM customers WHERE user_id = auth.uid()
  )
);

-- Adicionar índice se não existir para melhorar performance
CREATE INDEX IF NOT EXISTS idx_customers_user_id_fast ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_domains_customer_id_fast ON domains(customer_id);
