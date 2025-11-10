/*
  # Renomear Plano Standard para Prime — com.rich

  1. Alterações no Plano
    - Renomeia "Standard" para "Prime" (nome de exibição)
    - Mantém plan_type como 'standard' (compatibilidade retroativa)
    - Atualiza descrição para refletir posicionamento premium
    - Preserva todas as assinaturas e configurações existentes

  2. Posicionamento de Marca
    - Prime: A porta de entrada para o clube com.rich
    - Reforça exclusividade e sofisticação
    - Alinhado ao conceito de clube digital de alto padrão

  3. Notas de Segurança
    - Não altera plan_type (mantém 'standard' para compatibilidade)
    - Preserva todas as assinaturas ativas
    - Atualiza apenas nome de exibição e descrição
    - Zero impacto em clientes existentes
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
  commission_rate = 0.25
WHERE plan_type = 'standard' AND is_active = true;

-- Comentário de auditoria
COMMENT ON TABLE subscription_plans IS 'Planos de assinatura: Prime ($50), Elite ($70), Supreme (by request)';
