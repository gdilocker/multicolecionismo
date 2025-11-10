/*
  # Adicionar taxas de comissão aos planos

  1. Alterações
    - Adiciona coluna `commission_rate` à tabela `subscription_plans`
    - Define taxa padrão de 0.25 (25%)
    - Atualiza plano Standard para 25% de comissão
    - Atualiza plano Elite para 50% de comissão
    
  2. Notas
    - commission_rate é armazenado como decimal (0.25 = 25%, 0.50 = 50%)
    - Esta taxa é usada para calcular comissões de afiliados
    - As edge functions usarão este valor para processar comissões
*/

-- Adicionar coluna de taxa de comissão
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_plans' 
    AND column_name = 'commission_rate'
  ) THEN
    ALTER TABLE subscription_plans 
    ADD COLUMN commission_rate NUMERIC(3,2) NOT NULL DEFAULT 0.25;
  END IF;
END $$;

-- Atualizar taxa de comissão do plano Standard para 25%
UPDATE subscription_plans
SET commission_rate = 0.25
WHERE plan_type = 'standard';

-- Atualizar taxa de comissão do plano Elite para 50%
UPDATE subscription_plans
SET commission_rate = 0.50
WHERE plan_type = 'elite';

-- Comentário da coluna
COMMENT ON COLUMN subscription_plans.commission_rate IS 'Taxa de comissão de afiliados (0.25 = 25%, 0.50 = 50%)';
