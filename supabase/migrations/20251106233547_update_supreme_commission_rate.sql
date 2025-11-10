/*
  # Atualizar Plano Supreme - Comissão 50%

  1. Mudanças
    - Atualiza commission_rate do plano Supreme de 0 para 0.50 (50%)
    - Atualiza descrição para refletir estrutura financeira completa
    - Adiciona features detalhadas sobre taxa operacional e Exclusive License Fee

  2. Estrutura de Pagamento Supreme
    - Mensalidade base (plano Elite): 50% comissionável
    - Taxa operacional mensal: NÃO comissionável (varia por domínio)
    - Exclusive License Fee: NÃO comissionável (taxa única)

  3. Notas
    - Mantém is_active = true
    - Preserva billing_cycle = 'monthly'
    - Commission_rate aplica-se apenas à mensalidade base
*/

-- Atualizar o plano Supreme com a nova estrutura
UPDATE subscription_plans
SET 
  commission_rate = 0.50,
  description = 'Estrutura completa e personalizada: licenciamento exclusivo de domínios premium com infraestrutura dedicada, suporte corporativo e termos sob medida.',
  features = jsonb_build_array(
    'Licenciamento exclusivo global de domínio premium',
    'Infraestrutura técnica completa e personalizada',
    'Plataforma digital independente com identidade própria',
    'Exclusive License Fee (taxa única de licenciamento)',
    'Taxa operacional mensal (varia por domínio premium)',
    'Mensalidade base (plano Elite) - 50% comissionável',
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
  v_commission_rate numeric;
BEGIN
  SELECT commission_rate INTO v_commission_rate
  FROM subscription_plans
  WHERE plan_type = 'supreme';
  
  IF v_commission_rate = 0.50 THEN
    RAISE NOTICE 'Plano Supreme atualizado com sucesso: commission_rate = 50%%';
  ELSE
    RAISE WARNING 'Erro ao atualizar commission_rate do plano Supreme';
  END IF;
END $$;