/*
  # Adicionar Política de UPDATE para Customers

  1. Problema
    - A tabela `customers` tinha apenas políticas de SELECT e INSERT
    - Faltava política de UPDATE para permitir atualizar `active_domain_id`
    - Isso causava erro 400 ao tentar trocar de domínio ativo no dashboard

  2. Solução
    - Adicionar política de UPDATE que permite usuário atualizar seus próprios dados
    - Validação garante que usuário só pode modificar seu próprio registro

  3. Segurança
    - USING: verifica que o registro pertence ao usuário (auth.uid() = user_id)
    - WITH CHECK: verifica que após o update, o registro ainda pertence ao usuário
*/

-- Adicionar política de UPDATE para a tabela customers
CREATE POLICY "Users can update own customer data"
  ON customers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
