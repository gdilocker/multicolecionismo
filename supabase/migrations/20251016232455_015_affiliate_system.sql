/*
  # Sistema de Afiliados - .com.rich

  1. Novas Tabelas
    - `affiliates`
      - `id` (uuid, primary key)
      - `user_id` (uuid, FK para auth.users)
      - `affiliate_code` (text, único)
      - `status` (text: pending, active, suspended, terminated)
      - `commission_rate` (decimal, padrão 0.20 = 20%)
      - `total_sales` (integer, contador)
      - `total_earnings` (decimal)
      - `available_balance` (decimal)
      - `withdrawn_balance` (decimal)
      - `payment_method` (text: wise, paypal, payoneer, stripe, bank)
      - `payment_details` (jsonb)
      - `approved_at` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `affiliate_clicks`
      - `id` (uuid, primary key)
      - `affiliate_id` (uuid, FK)
      - `ip_address` (text)
      - `user_agent` (text)
      - `referrer` (text)
      - `cookie_id` (text, único)
      - `clicked_at` (timestamptz)
      - `expires_at` (timestamptz)
    
    - `affiliate_commissions`
      - `id` (uuid, primary key)
      - `affiliate_id` (uuid, FK)
      - `order_id` (uuid, FK para orders)
      - `sale_amount` (decimal)
      - `commission_rate` (decimal)
      - `commission_amount` (decimal)
      - `status` (text: pending, confirmed, paid, cancelled)
      - `is_recurring` (boolean)
      - `confirmed_at` (timestamptz)
      - `paid_at` (timestamptz)
      - `created_at` (timestamptz)
    
    - `affiliate_withdrawals`
      - `id` (uuid, primary key)
      - `affiliate_id` (uuid, FK)
      - `amount` (decimal)
      - `payment_method` (text)
      - `payment_details` (jsonb)
      - `status` (text: pending, processing, completed, rejected)
      - `processed_at` (timestamptz)
      - `created_at` (timestamptz)
      - `notes` (text)

  2. Segurança
    - Habilitar RLS em todas as tabelas
    - Políticas restritivas para afiliados verem apenas seus próprios dados
    - Admins podem ver todos os dados
    - Usuários podem se candidatar a afiliados
*/

-- Tabela de afiliados
CREATE TABLE IF NOT EXISTS affiliates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  affiliate_code text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'terminated')),
  commission_rate decimal NOT NULL DEFAULT 0.20,
  total_sales integer NOT NULL DEFAULT 0,
  total_earnings decimal NOT NULL DEFAULT 0,
  available_balance decimal NOT NULL DEFAULT 0,
  withdrawn_balance decimal NOT NULL DEFAULT 0,
  payment_method text CHECK (payment_method IN ('wise', 'paypal', 'payoneer', 'stripe', 'bank')),
  payment_details jsonb DEFAULT '{}'::jsonb,
  approved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_affiliates_user_id ON affiliates(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliates_code ON affiliates(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_affiliates_status ON affiliates(status);

-- Tabela de cliques em links de afiliados
CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  ip_address text,
  user_agent text,
  referrer text,
  cookie_id text UNIQUE NOT NULL,
  clicked_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '30 days')
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_affiliate ON affiliate_clicks(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_cookie ON affiliate_clicks(cookie_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_expires ON affiliate_clicks(expires_at);

-- Tabela de comissões
CREATE TABLE IF NOT EXISTS affiliate_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  sale_amount decimal NOT NULL,
  commission_rate decimal NOT NULL,
  commission_amount decimal NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'paid', 'cancelled')),
  is_recurring boolean DEFAULT false,
  confirmed_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_commissions_affiliate ON affiliate_commissions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_commissions_order ON affiliate_commissions(order_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON affiliate_commissions(status);

-- Tabela de saques
CREATE TABLE IF NOT EXISTS affiliate_withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  amount decimal NOT NULL CHECK (amount >= 50),
  payment_method text NOT NULL,
  payment_details jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  processed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  notes text
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_withdrawals_affiliate ON affiliate_withdrawals(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON affiliate_withdrawals(status);

-- Adicionar coluna affiliate_code na tabela orders (para rastreamento)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'affiliate_code'
  ) THEN
    ALTER TABLE orders ADD COLUMN affiliate_code text;
    CREATE INDEX IF NOT EXISTS idx_orders_affiliate_code ON orders(affiliate_code);
  END IF;
END $$;

-- RLS Policies para affiliates
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Afiliados podem ver seus próprios dados"
  ON affiliates FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem se candidatar a afiliado"
  ON affiliates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Afiliados podem atualizar seus dados"
  ON affiliates FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins podem ver todos os afiliados"
  ON affiliates FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = auth.uid()
      AND customers.role = 'admin'
    )
  );

CREATE POLICY "Admins podem gerenciar afiliados"
  ON affiliates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = auth.uid()
      AND customers.role = 'admin'
    )
  );

-- RLS Policies para affiliate_clicks
ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Afiliados podem ver seus cliques"
  ON affiliate_clicks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM affiliates
      WHERE affiliates.id = affiliate_clicks.affiliate_id
      AND affiliates.user_id = auth.uid()
    )
  );

CREATE POLICY "Sistema pode registrar cliques"
  ON affiliate_clicks FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins podem ver todos os cliques"
  ON affiliate_clicks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = auth.uid()
      AND customers.role = 'admin'
    )
  );

-- RLS Policies para affiliate_commissions
ALTER TABLE affiliate_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Afiliados podem ver suas comissões"
  ON affiliate_commissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM affiliates
      WHERE affiliates.id = affiliate_commissions.affiliate_id
      AND affiliates.user_id = auth.uid()
    )
  );

CREATE POLICY "Sistema pode criar comissões"
  ON affiliate_commissions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins podem gerenciar comissões"
  ON affiliate_commissions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = auth.uid()
      AND customers.role = 'admin'
    )
  );

-- RLS Policies para affiliate_withdrawals
ALTER TABLE affiliate_withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Afiliados podem ver seus saques"
  ON affiliate_withdrawals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM affiliates
      WHERE affiliates.id = affiliate_withdrawals.affiliate_id
      AND affiliates.user_id = auth.uid()
    )
  );

CREATE POLICY "Afiliados podem solicitar saques"
  ON affiliate_withdrawals FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM affiliates
      WHERE affiliates.id = affiliate_withdrawals.affiliate_id
      AND affiliates.user_id = auth.uid()
      AND affiliates.status = 'active'
    )
  );

CREATE POLICY "Admins podem gerenciar saques"
  ON affiliate_withdrawals FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = auth.uid()
      AND customers.role = 'admin'
    )
  );

-- Função para gerar código de afiliado único
CREATE OR REPLACE FUNCTION generate_affiliate_code()
RETURNS text AS $$
DECLARE
  new_code text;
  code_exists boolean;
BEGIN
  LOOP
    -- Gera código de 8 caracteres alfanuméricos
    new_code := upper(substring(md5(random()::text) from 1 for 8));
    
    -- Verifica se já existe
    SELECT EXISTS(SELECT 1 FROM affiliates WHERE affiliate_code = new_code) INTO code_exists;
    
    -- Se não existe, retorna
    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_affiliates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER affiliates_updated_at
  BEFORE UPDATE ON affiliates
  FOR EACH ROW
  EXECUTE FUNCTION update_affiliates_updated_at();
