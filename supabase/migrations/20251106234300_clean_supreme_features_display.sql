/*
  # Limpar Features do Plano Supreme - Remover Linha Técnica

  1. Mudanças
    - Remove a feature "Mensalidade base (plano Elite) - 50% comissionável"
    - Mantém apenas informações relevantes para o cliente final
    - Preserva a informação sobre programa de afiliados de forma mais clara

  2. Notas
    - A comissão de 50% permanece no campo commission_rate
    - A informação técnica sobre estrutura de pagamento é removida do card
    - Features focam nos benefícios, não na estrutura financeira interna
*/

-- Atualizar features do plano Supreme removendo linha técnica confusa
UPDATE subscription_plans
SET features = jsonb_build_array(
  'Licenciamento exclusivo global de domínio premium',
  'Infraestrutura técnica completa e personalizada',
  'Plataforma digital independente com identidade própria',
  'Exclusive License Fee (taxa única de licenciamento)',
  'Taxa operacional mensal (varia por domínio premium)',
  'Gerente de conta dedicado 24/7',
  'Suporte corporativo white-glove',
  'Garantias contratuais de SLA',
  'Onboarding personalizado e consultoria estratégica',
  'Acesso VIP a eventos e networking exclusivo',
  'Programa de afiliados: 50% sobre mensalidade base'
)
WHERE plan_type = 'supreme';

-- Verificar atualização
DO $$
DECLARE
  v_feature_count int;
BEGIN
  SELECT jsonb_array_length(features) INTO v_feature_count
  FROM subscription_plans
  WHERE plan_type = 'supreme';
  
  IF v_feature_count = 11 THEN
    RAISE NOTICE 'Features do plano Supreme atualizadas: % itens (linha técnica removida)', v_feature_count;
  ELSE
    RAISE WARNING 'Número inesperado de features: %', v_feature_count;
  END IF;
END $$;