/*
  # Renomear Plano Standard para Prime — Aplicação DEFINITIVA

  1. Alterações no Plano
    - Renomeia "Standard" para "Prime" (nome de exibição)
    - Mantém plan_type como 'standard' (compatibilidade retroativa)
    - Atualiza descrição para refletir posicionamento premium
    - Preserva todas as assinaturas e configurações existentes

  2. Posicionamento de Marca
    - Prime: A porta de entrada para o clube com.rich
    - Reforça exclusividade e sofisticação
    - Alinhado ao conceito de clube digital de alto padrão

  3. Garantias
    - Zero impacto em assinaturas ativas
    - IDs internos preservados
    - Apenas atualização visual/textual
*/

-- Atualizar nome e descrição do plano Standard para Prime
UPDATE subscription_plans
SET
  plan_name = 'Prime',
  description = 'A porta de entrada para o clube com.rich. Presença digital exclusiva com elegância e sofisticação.',
  features = jsonb_build_array(
    'Licença exclusiva de domínio (seunome.com.rich)',
    'Página de perfil personalizável (pública ou privada)',
    'Editor completo: bio, avatar e links ilimitados',
    'Analytics profissional de acessos e cliques',
    'Acesso à coleção de nomes premium',
    'Integração com redes sociais',
    'Programa de afiliados: 25% de comissão recorrente em cada pagamento do cliente',
    'Suporte via plataforma'
  ),
  updated_at = now()
WHERE plan_type = 'standard' AND is_active = true;

-- Verificar se a atualização foi aplicada
DO $$
DECLARE
  v_plan_name text;
BEGIN
  SELECT plan_name INTO v_plan_name
  FROM subscription_plans
  WHERE plan_type = 'standard' AND is_active = true
  LIMIT 1;
  
  IF v_plan_name = 'Prime' THEN
    RAISE NOTICE 'SUCCESS: Plano renomeado para Prime com sucesso!';
  ELSE
    RAISE EXCEPTION 'ERRO: Plano não foi renomeado. Nome atual: %', v_plan_name;
  END IF;
END $$;