/*
  # Sistema de Planos de Preços

  1. Nova Tabela
    - `pricing_plans`
      - `id` (uuid, primary key)
      - `code` (text, unique) - código do plano (basic, professional, enterprise)
      - `name` (text) - nome do plano
      - `description` (text) - descrição
      - `price_cents` (integer) - preço em centavos
      - `mailboxes_included` (integer) - caixas de email incluídas (0 para plano básico)
      - `mailbox_quota_mb` (integer) - quota de cada caixa em MB
      - `aliases_limit` (integer) - limite de aliases (-1 = ilimitado)
      - `features` (jsonb) - features adicionais
      - `is_active` (boolean) - se o plano está ativo
      - `sort_order` (integer) - ordem de exibição
      - `created_at` (timestamptz)

  2. Dados Iniciais
    - Inserir os 3 planos padrão

  3. Alterações
    - Adicionar coluna `plan_id` na tabela `orders` (nullable por compatibilidade)
    
  4. Segurança
    - Enable RLS
    - Planos são públicos para leitura
    - Apenas admins podem criar/modificar
*/

-- Criar tabela de planos
CREATE TABLE IF NOT EXISTS pricing_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  price_cents integer NOT NULL,
  mailboxes_included integer NOT NULL DEFAULT 0,
  mailbox_quota_mb integer NOT NULL DEFAULT 5120,
  aliases_limit integer NOT NULL DEFAULT -1,
  features jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Adicionar coluna plan_id na tabela orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'plan_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN plan_id uuid REFERENCES pricing_plans(id);
  END IF;
END $$;

-- Inserir planos padrão
INSERT INTO pricing_plans (code, name, description, price_cents, mailboxes_included, mailbox_quota_mb, aliases_limit, features, sort_order)
VALUES 
  (
    'basic',
    'Básico',
    'Apenas domínio .email com DNS gratuito',
    2999,
    0,
    0,
    10,
    '["Domínio .email", "DNS gratuito", "Proteção WHOIS", "Redirecionamento de email", "Suporte por email", "Painel de controle"]'::jsonb,
    1
  ),
  (
    'professional',
    'Profissional',
    'Domínio + caixas de email profissionais',
    7999,
    5,
    5120,
    50,
    '["Domínio .email", "5 caixas de email (5GB cada)", "50 aliases de email", "Webmail moderno", "Proteção anti-spam", "Suporte prioritário", "DNS avançado", "Backup automático"]'::jsonb,
    2
  ),
  (
    'enterprise',
    'Empresarial',
    'Solução completa para empresas',
    14999,
    25,
    10240,
    -1,
    '["Domínio .email", "25 caixas de email (10GB cada)", "Aliases ilimitados", "Webmail + IMAP/SMTP", "API de email", "Proteção avançada anti-spam", "Suporte 24/7", "DNS avançado com API", "SLA garantido", "Backup automático diário"]'::jsonb,
    3
  )
ON CONFLICT (code) DO NOTHING;

-- Habilitar RLS
ALTER TABLE pricing_plans ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: Todos podem ler planos ativos
CREATE POLICY "Anyone can view active pricing plans"
  ON pricing_plans FOR SELECT
  TO public
  USING (is_active = true);

-- Apenas admins podem inserir
CREATE POLICY "Only admins can insert pricing plans"
  ON pricing_plans FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = auth.uid()
      AND customers.role = 'admin'
    )
  );

-- Apenas admins podem atualizar
CREATE POLICY "Only admins can update pricing plans"
  ON pricing_plans FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = auth.uid()
      AND customers.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = auth.uid()
      AND customers.role = 'admin'
    )
  );

-- Apenas admins podem deletar
CREATE POLICY "Only admins can delete pricing plans"
  ON pricing_plans FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = auth.uid()
      AND customers.role = 'admin'
    )
  );

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_pricing_plans_code ON pricing_plans(code);
CREATE INDEX IF NOT EXISTS idx_pricing_plans_active ON pricing_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_plan_id ON orders(plan_id);