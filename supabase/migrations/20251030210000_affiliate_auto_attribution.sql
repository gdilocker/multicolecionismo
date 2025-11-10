/*
  # Sistema de Afiliação Automática

  1. Alterações nas Tabelas
    - `user_profiles`
      - `is_affiliate` (boolean) - Indica se o usuário é afiliado
      - `affiliate_terms_accepted_at` (timestamp) - Data de aceite dos termos

    - `customers`
      - `referred_by` (uuid) - FK para auth.users, quem referiu
      - `referral_source` (text) - origem: profile_footer, login_modal, direct, etc
      - `referral_tracked_at` (timestamp) - quando foi trackado

  2. Nova Tabela
    - `referrals` (para auditoria e relatórios)
      - `id` (uuid, primary key)
      - `affiliate_user_id` (uuid) - quem referiu
      - `referred_user_id` (uuid) - quem foi referido
      - `source` (text) - origem do referral
      - `affiliate_code` (text) - código usado
      - `cookie_id` (text) - ID do cookie de tracking
      - `created_at` (timestamp)

  3. Segurança
    - RLS ativado em todas as tabelas
    - Políticas para afiliados verem seus referrals
    - Proteção anti-abuso (self-referral)
*/

-- Adicionar campos de afiliado em user_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'is_affiliate'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN is_affiliate boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'affiliate_terms_accepted_at'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN affiliate_terms_accepted_at timestamptz;
  END IF;
END $$;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_affiliate ON user_profiles(is_affiliate) WHERE is_affiliate = true;

-- Adicionar campos de referral em customers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'referred_by'
  ) THEN
    ALTER TABLE customers ADD COLUMN referred_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'referral_source'
  ) THEN
    ALTER TABLE customers ADD COLUMN referral_source text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'referral_tracked_at'
  ) THEN
    ALTER TABLE customers ADD COLUMN referral_tracked_at timestamptz;
  END IF;
END $$;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_customers_referred_by ON customers(referred_by);
CREATE INDEX IF NOT EXISTS idx_customers_referral_source ON customers(referral_source);

-- Tabela de referrals para auditoria
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source text NOT NULL,
  affiliate_code text,
  cookie_id text,
  ip_address text,
  user_agent text,
  referrer_url text,
  created_at timestamptz DEFAULT now(),

  -- Prevenir duplicatas
  UNIQUE(affiliate_user_id, referred_user_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_referrals_affiliate ON referrals(affiliate_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_created ON referrals(created_at);
CREATE INDEX IF NOT EXISTS idx_referrals_cookie ON referrals(cookie_id);

-- RLS para referrals
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Afiliados podem ver seus referrals
CREATE POLICY "Afiliados podem ver seus referrals"
  ON referrals FOR SELECT
  TO authenticated
  USING (auth.uid() = affiliate_user_id);

-- Sistema pode criar referrals
CREATE POLICY "Sistema pode criar referrals"
  ON referrals FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Prevenir self-referral
    auth.uid() != affiliate_user_id
    AND affiliate_user_id != referred_user_id
  );

-- Admins podem ver todos os referrals
CREATE POLICY "Admins podem ver todos os referrals"
  ON referrals FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = auth.uid()
      AND customers.role = 'admin'
    )
  );

-- Função para obter affiliate_code de um user_id
CREATE OR REPLACE FUNCTION get_affiliate_code_by_user_id(p_user_id uuid)
RETURNS text AS $$
DECLARE
  v_code text;
BEGIN
  SELECT affiliate_code INTO v_code
  FROM affiliates
  WHERE user_id = p_user_id
    AND status = 'active';

  RETURN v_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se um usuário é afiliado ativo
CREATE OR REPLACE FUNCTION is_active_affiliate(p_user_id uuid)
RETURNS boolean AS $$
DECLARE
  v_is_active boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM user_profiles up
    INNER JOIN affiliates a ON a.user_id = up.user_id
    WHERE up.user_id = p_user_id
      AND up.is_affiliate = true
      AND up.affiliate_terms_accepted_at IS NOT NULL
      AND a.status = 'active'
  ) INTO v_is_active;

  RETURN COALESCE(v_is_active, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para processar atribuição de referral
CREATE OR REPLACE FUNCTION process_referral_attribution(
  p_affiliate_code text,
  p_referred_user_id uuid,
  p_source text DEFAULT 'unknown',
  p_cookie_id text DEFAULT NULL,
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_referrer_url text DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
  v_affiliate_user_id uuid;
  v_already_referred boolean;
BEGIN
  -- Buscar user_id do afiliado pelo código
  SELECT user_id INTO v_affiliate_user_id
  FROM affiliates
  WHERE affiliate_code = p_affiliate_code
    AND status = 'active';

  -- Se não encontrou afiliado ativo, retorna false
  IF v_affiliate_user_id IS NULL THEN
    RETURN false;
  END IF;

  -- Verificar self-referral
  IF v_affiliate_user_id = p_referred_user_id THEN
    RETURN false;
  END IF;

  -- Verificar se já foi referido por alguém (first-touch attribution)
  SELECT EXISTS(
    SELECT 1 FROM customers
    WHERE user_id = p_referred_user_id
      AND referred_by IS NOT NULL
  ) INTO v_already_referred;

  -- Se já foi referido, não sobrescrever (first-touch)
  IF v_already_referred THEN
    RETURN false;
  END IF;

  -- Atualizar customer com referral
  UPDATE customers
  SET
    referred_by = v_affiliate_user_id,
    referral_source = p_source,
    referral_tracked_at = now()
  WHERE user_id = p_referred_user_id;

  -- Inserir registro na tabela de referrals (para auditoria)
  INSERT INTO referrals (
    affiliate_user_id,
    referred_user_id,
    source,
    affiliate_code,
    cookie_id,
    ip_address,
    user_agent,
    referrer_url
  ) VALUES (
    v_affiliate_user_id,
    p_referred_user_id,
    p_source,
    p_affiliate_code,
    p_cookie_id,
    p_ip_address,
    p_user_agent,
    p_referrer_url
  )
  ON CONFLICT (affiliate_user_id, referred_user_id) DO NOTHING;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Sincronizar is_affiliate com affiliates existentes
UPDATE user_profiles up
SET is_affiliate = true
FROM affiliates a
WHERE up.user_id = a.user_id
  AND a.status = 'active'
  AND up.is_affiliate = false;
