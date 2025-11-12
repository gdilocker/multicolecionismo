/*
  # Fix: Permitir UPDATE em customers.active_domain_id

  ## Problema
  A tabela customers não tem política RLS para UPDATE.
  Quando o usuário tenta ativar/desativar um domínio, o UPDATE falha silenciosamente.

  ## Solução
  Criar política RLS para permitir que usuários atualizem seus próprios dados em customers.

  ## Segurança
  - Apenas o próprio usuário pode atualizar seus dados
  - Verificação: auth.uid() = user_id
*/

-- Criar política de UPDATE para customers
CREATE POLICY "Users can update own customer data"
  ON customers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Comentário
COMMENT ON POLICY "Users can update own customer data" ON customers IS
'Permite que usuários atualizem seus próprios dados (ex: active_domain_id, phone, etc)';
