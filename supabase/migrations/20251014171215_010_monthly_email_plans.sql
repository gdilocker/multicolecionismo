/*
  # Atualizar Planos para Mensalidade de Email

  1. Alterações
    - Atualizar preços dos planos para valores mensais
    - Adicionar campo billing_period (monthly, annually)
    - Separar custo do domínio do custo do email
    
  2. Novos Preços
    - Básico: $0/mês (só domínio)
    - Profissional: $6.99/mês (email)
    - Empresarial: $19.99/mês (email)
    
  3. Observações
    - Domínio sempre cobrado anualmente: $29.99/ano
    - Planos de email cobrados mensalmente
*/

-- Adicionar coluna para período de cobrança
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pricing_plans' AND column_name = 'billing_period'
  ) THEN
    ALTER TABLE pricing_plans ADD COLUMN billing_period text DEFAULT 'monthly';
  END IF;
END $$;

-- Adicionar coluna para indicar se inclui domínio
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pricing_plans' AND column_name = 'includes_domain'
  ) THEN
    ALTER TABLE pricing_plans ADD COLUMN includes_domain boolean DEFAULT false;
  END IF;
END $$;

-- Atualizar planos existentes com novos preços mensais
UPDATE pricing_plans
SET 
  price_cents = 0,
  billing_period = 'included',
  includes_domain = true,
  description = 'Domínio .email sem caixas de email',
  features = '[
    "Domínio .email",
    "DNS gratuito",
    "Proteção WHOIS",
    "Redirecionamento de email",
    "10 aliases de email",
    "Suporte por email",
    "Painel de controle"
  ]'::jsonb
WHERE code = 'basic';

UPDATE pricing_plans
SET 
  price_cents = 699,
  billing_period = 'monthly',
  includes_domain = true,
  description = 'Domínio + email profissional',
  features = '[
    "Domínio .email incluído",
    "5 caixas de email (5GB cada)",
    "50 aliases de email",
    "Webmail moderno",
    "Proteção anti-spam",
    "Suporte prioritário",
    "DNS avançado",
    "Backup automático"
  ]'::jsonb
WHERE code = 'professional';

UPDATE pricing_plans
SET 
  price_cents = 1999,
  billing_period = 'monthly',
  includes_domain = true,
  description = 'Solução completa para empresas',
  features = '[
    "Domínio .email incluído",
    "25 caixas de email (10GB cada)",
    "Aliases ilimitados",
    "Webmail + IMAP/SMTP",
    "API de email",
    "Proteção avançada anti-spam",
    "Suporte 24/7",
    "DNS avançado com API",
    "SLA garantido",
    "Backup automático diário"
  ]'::jsonb
WHERE code = 'enterprise';

-- Adicionar índice para billing_period
CREATE INDEX IF NOT EXISTS idx_pricing_plans_billing_period ON pricing_plans(billing_period);