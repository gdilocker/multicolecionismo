/*
  # Reposicionamento Premium — com.rich

  1. Alterações nos Planos
    - Remove plano Starter ($19)
    - Mantém apenas Standard ($50) e Elite ($70, será $100 em jan/2025)
    - Supreme permanece (sob consulta)
    - Atualiza constraint de plan_type

  2. Sistema de "Acesso Exclusivo"
    - Renomeia conceito de "trial" para "acesso exclusivo"
    - Mantém 14 dias de experiência premium
    - Nomenclatura alinhada ao posicionamento de clube exclusivo

  3. Posicionamento de Marca
    - com.rich como clube digital de alto padrão
    - Foco em exclusividade, prestígio e reconhecimento
    - Valores refletem status e raridade dos domínios

  4. Notas de Segurança
    - Preserva assinaturas existentes
    - Remove apenas o plano da lista ativa
    - Usuários sem plano mantêm acesso social
*/

-- Desativar plano Starter (não deletar, para preservar histórico)
UPDATE subscription_plans
SET is_active = false
WHERE plan_type = 'starter';

-- Manter preço do Elite em $70 (será $100 a partir de janeiro/2025)
UPDATE subscription_plans
SET
  price_usd = 70,
  description = 'Identidade digital e física de alto padrão. Voltado para quem deseja ir além da imagem online e fazer parte de um clube exclusivo.',
  features = jsonb_build_array(
    'Tudo do plano Standard',
    'Cartão físico personalizado com QR Code dinâmico',
    'Design Black & Gold Edition exclusivo',
    'Selo Elite Member no painel e na página pública',
    'Destaque premium nas listagens e buscas',
    'Acesso antecipado à coleção de nomes premium',
    'Convites e benefícios exclusivos de membro',
    'Suporte prioritário dedicado',
    'Programa de afiliados: 50% de comissão recorrente em cada pagamento do cliente'
  ),
  commission_rate = 0.50
WHERE plan_type = 'elite' AND is_active = true;

-- Atualizar descrição do Standard para reforçar exclusividade
UPDATE subscription_plans
SET
  description = 'Presença digital premium. Ideal para empreendedores e criadores que desejam ter uma licença exclusiva de uso dentro do ecossistema .com.rich.',
  features = jsonb_build_array(
    'Licença exclusiva de domínio (seunome.com.rich)',
    'Página de perfil personalizável (pública ou privada)',
    'Editor completo: bio, avatar e links ilimitados',
    'Analytics profissional de acessos e cliques',
    'Acesso à coleção de nomes premium',
    'Integração com redes sociais',
    'Programa de afiliados: 25% de comissão recorrente em cada pagamento do cliente',
    'Suporte via plataforma'
  )
WHERE plan_type = 'standard' AND is_active = true;

-- Adicionar comentário sobre o novo posicionamento
COMMENT ON TABLE subscription_plans IS 'Planos de assinatura com.rich: Standard ($50), Elite ($100), Supreme (personalizado). Plataforma posicionada como clube digital de alto padrão para empreendedores e criadores.';

-- Adicionar coluna para controlar nomenclatura de "acesso exclusivo" vs "trial"
-- (mantém compatibilidade técnica, muda apenas apresentação)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'exclusive_access_label'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN exclusive_access_label text DEFAULT 'Acesso Exclusivo 14 Dias';
  END IF;
END $$;

COMMENT ON COLUMN subscriptions.exclusive_access_label IS 'Label de marketing para o período de acesso inicial (ex: "Acesso Exclusivo 14 Dias" ao invés de "trial")';

-- Atualizar função para refletir nomenclatura de "acesso exclusivo"
CREATE OR REPLACE FUNCTION get_exclusive_access_days_remaining(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  days_remaining integer;
BEGIN
  SELECT GREATEST(0, EXTRACT(DAY FROM (trial_ends_at - now())))::integer
  INTO days_remaining
  FROM subscriptions
  WHERE user_id = p_user_id
    AND is_trial = true
    AND trial_ends_at > now()
    AND status = 'active'
  ORDER BY trial_ends_at DESC
  LIMIT 1;

  RETURN COALESCE(days_remaining, 0);
END;
$$;

COMMENT ON FUNCTION get_exclusive_access_days_remaining IS 'Retorna dias restantes do período de Acesso Exclusivo (14 dias) para um usuário';
