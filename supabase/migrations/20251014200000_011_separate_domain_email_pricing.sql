/*
  # Separar Preços de Domínio e Email

  1. Nova Estrutura
    - Domínio: Produto separado, cobrado anualmente
    - Planos de Email: Mensalidades com diferentes caixas/quotas

  2. Tabelas Atualizadas
    - `pricing_plans` → renomeada para focar apenas em email
    - Nova coluna `product_type` (domain, email)

  3. Produtos
    - Domínio .email: $29.99/ano (registro anual obrigatório)
    - Plano Starter: $0/mês (sem caixas, apenas aliases)
    - Plano Basic: $4.99/mês (2 caixas de 5GB)
    - Plano Professional: $9.99/mês (5 caixas de 10GB)
    - Plano Business: $19.99/mês (15 caixas de 20GB)
    - Plano Enterprise: $49.99/mês (50 caixas de 50GB)

  4. Segurança
    - Manter RLS existente
*/

-- Adicionar coluna product_type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pricing_plans' AND column_name = 'product_type'
  ) THEN
    ALTER TABLE pricing_plans ADD COLUMN product_type text DEFAULT 'email';
  END IF;
END $$;

-- Limpar planos antigos para recriar estrutura limpa
DELETE FROM pricing_plans;

-- Inserir produto de domínio
INSERT INTO pricing_plans (
  code,
  name,
  description,
  price_cents,
  mailboxes_included,
  mailbox_quota_mb,
  aliases_limit,
  features,
  billing_period,
  includes_domain,
  product_type,
  is_active,
  sort_order
) VALUES (
  'domain-email',
  'Domínio .email',
  'Registro anual de domínio .email',
  2999,
  0,
  0,
  0,
  '[
    "Domínio .email personalizado",
    "Registro anual",
    "DNS gratuito (Cloudflare)",
    "Proteção WHOIS",
    "Renovação automática",
    "Painel de controle"
  ]'::jsonb,
  'annually',
  true,
  'domain',
  true,
  1
);

-- Plano Starter (Grátis - sem caixas)
INSERT INTO pricing_plans (
  code,
  name,
  description,
  price_cents,
  mailboxes_included,
  mailbox_quota_mb,
  aliases_limit,
  features,
  billing_period,
  includes_domain,
  product_type,
  is_active,
  sort_order
) VALUES (
  'starter',
  'Starter',
  'Apenas redirecionamentos e aliases',
  0,
  0,
  0,
  10,
  '[
    "10 aliases de email",
    "Redirecionamento ilimitado",
    "Painel de controle",
    "Suporte por email"
  ]'::jsonb,
  'monthly',
  false,
  'email',
  true,
  2
);

-- Plano Basic
INSERT INTO pricing_plans (
  code,
  name,
  description,
  price_cents,
  mailboxes_included,
  mailbox_quota_mb,
  aliases_limit,
  features,
  billing_period,
  includes_domain,
  product_type,
  is_active,
  sort_order
) VALUES (
  'basic',
  'Basic',
  'Ideal para uso pessoal',
  499,
  2,
  5120,
  25,
  '[
    "2 caixas de email (5GB cada)",
    "25 aliases de email",
    "Webmail moderno",
    "IMAP/SMTP",
    "Proteção anti-spam",
    "Suporte por email"
  ]'::jsonb,
  'monthly',
  false,
  'email',
  true,
  3
);

-- Plano Professional
INSERT INTO pricing_plans (
  code,
  name,
  description,
  price_cents,
  mailboxes_included,
  mailbox_quota_mb,
  aliases_limit,
  features,
  billing_period,
  includes_domain,
  product_type,
  is_active,
  sort_order
) VALUES (
  'professional',
  'Professional',
  'Perfeito para profissionais e pequenas equipes',
  999,
  5,
  10240,
  100,
  '[
    "5 caixas de email (10GB cada)",
    "100 aliases de email",
    "Webmail moderno",
    "IMAP/SMTP",
    "Proteção anti-spam avançada",
    "Suporte prioritário",
    "Backup automático"
  ]'::jsonb,
  'monthly',
  false,
  'email',
  true,
  4
);

-- Plano Business
INSERT INTO pricing_plans (
  code,
  name,
  description,
  price_cents,
  mailboxes_included,
  mailbox_quota_mb,
  aliases_limit,
  features,
  billing_period,
  includes_domain,
  product_type,
  is_active,
  sort_order
) VALUES (
  'business',
  'Business',
  'Solução completa para empresas',
  1999,
  15,
  20480,
  500,
  '[
    "15 caixas de email (20GB cada)",
    "500 aliases de email",
    "Webmail + IMAP/SMTP",
    "Proteção anti-spam avançada",
    "Filtros personalizados",
    "Suporte prioritário",
    "Backup automático diário",
    "DNS avançado"
  ]'::jsonb,
  'monthly',
  false,
  'email',
  true,
  5
);

-- Plano Enterprise
INSERT INTO pricing_plans (
  code,
  name,
  description,
  price_cents,
  mailboxes_included,
  mailbox_quota_mb,
  aliases_limit,
  features,
  billing_period,
  includes_domain,
  product_type,
  is_active,
  sort_order
) VALUES (
  'enterprise',
  'Enterprise',
  'Máxima capacidade e recursos',
  4999,
  50,
  51200,
  -1,
  '[
    "50 caixas de email (50GB cada)",
    "Aliases ilimitados",
    "Webmail + IMAP/SMTP",
    "API de email",
    "Proteção avançada anti-spam e anti-vírus",
    "Filtros personalizados",
    "Suporte 24/7",
    "DNS avançado com API",
    "SLA garantido 99.9%",
    "Backup automático com retenção estendida",
    "Gerente de conta dedicado"
  ]'::jsonb,
  'monthly',
  false,
  'email',
  true,
  6
);

-- Criar índice para product_type
CREATE INDEX IF NOT EXISTS idx_pricing_plans_product_type ON pricing_plans(product_type);

-- Comentário explicativo
COMMENT ON COLUMN pricing_plans.product_type IS 'Tipo de produto: domain (domínio anual) ou email (plano mensal de email)';
COMMENT ON COLUMN pricing_plans.includes_domain IS 'Deprecated: usar product_type em vez disso';
