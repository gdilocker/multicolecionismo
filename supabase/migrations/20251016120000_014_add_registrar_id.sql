/*
  # Adicionar campo registrar_id à tabela domains

  1. Mudança
    - Adicionar coluna `registrar_id` à tabela `domains`
    - Este campo armazena o ID do pedido/domínio retornado pela Dynadot

  2. Motivo
    - O webhook do PayPal estava falhando ao tentar atualizar este campo
    - Necessário para rastrear o ID do domínio no registrador externo
    - Permite vincular o domínio no nosso sistema com o domínio na Dynadot

  3. Impacto
    - Correção crítica: permite que o registro de domínio funcione corretamente
    - Sem este campo, o provisionamento de domínio falha silenciosamente
*/

-- Adicionar campo registrar_id à tabela domains
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'domains' AND column_name = 'registrar_id'
  ) THEN
    ALTER TABLE domains ADD COLUMN registrar_id text;
  END IF;
END $$;

-- Criar índice para performance em buscas por registrar_id
CREATE INDEX IF NOT EXISTS idx_domains_registrar_id ON domains(registrar_id);

-- Comentário explicativo
COMMENT ON COLUMN domains.registrar_id IS 'ID do pedido/domínio retornado pelo registrador (Dynadot OrderId)';
