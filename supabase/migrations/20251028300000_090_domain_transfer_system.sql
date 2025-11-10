/*
  # Sistema de Transferência de Domínios .com.rich

  1. Nova Tabela
    - `domain_transfers` - histórico de transferências
      - `id` (uuid, primary key)
      - `domain_id` (uuid, FK para domains)
      - `from_user_id` (uuid, titular anterior)
      - `to_user_id` (uuid, novo titular)
      - `transfer_fee` (numeric, taxa de transferência - US$50)
      - `new_annual_fee` (numeric, nova anuidade paga)
      - `status` (text, pending/completed/cancelled)
      - `payment_id` (uuid, FK opcional para orders)
      - `created_at` (timestamptz)
      - `completed_at` (timestamptz)

  2. Regras de Negócio
    - Taxa fixa de transferência: US$50
    - Nova anuidade integral obrigatória
    - Sem reembolso em qualquer circunstância
    - Uso exclusivo dentro da plataforma

  3. Segurança
    - RLS habilitado
    - Usuários podem ver apenas suas próprias transferências
    - Admins têm acesso completo
*/

-- Criar tabela de transferências
CREATE TABLE IF NOT EXISTS domain_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id uuid NOT NULL REFERENCES domains(id) ON DELETE RESTRICT,
  from_customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  to_customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  transfer_fee numeric(10,2) NOT NULL DEFAULT 50.00,
  new_annual_fee numeric(10,2) NOT NULL DEFAULT 100.00,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled', 'failed')),
  payment_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  completed_at timestamptz,
  cancelled_at timestamptz,
  CONSTRAINT different_customers CHECK (from_customer_id != to_customer_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_domain_transfers_domain_id ON domain_transfers(domain_id);
CREATE INDEX IF NOT EXISTS idx_domain_transfers_from_customer ON domain_transfers(from_customer_id);
CREATE INDEX IF NOT EXISTS idx_domain_transfers_to_customer ON domain_transfers(to_customer_id);
CREATE INDEX IF NOT EXISTS idx_domain_transfers_status ON domain_transfers(status);
CREATE INDEX IF NOT EXISTS idx_domain_transfers_created_at ON domain_transfers(created_at DESC);

-- Habilitar RLS
ALTER TABLE domain_transfers ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view own transfers (from)"
  ON domain_transfers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = from_customer_id
      AND customers.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own transfers (to)"
  ON domain_transfers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = to_customer_id
      AND customers.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can initiate transfers for owned domains"
  ON domain_transfers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers c
      INNER JOIN domains d ON d.customer_id = c.id
      WHERE c.user_id = auth.uid()
      AND c.id = from_customer_id
      AND d.id = domain_id
      AND d.registrar_status = 'active'
    )
  );

CREATE POLICY "Admins have full access to transfers"
  ON domain_transfers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Adicionar coluna para rastrear transferibilidade nos domínios
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'domains' AND column_name = 'is_transferable'
  ) THEN
    ALTER TABLE domains ADD COLUMN is_transferable boolean DEFAULT true NOT NULL;
  END IF;
END $$;

-- Adicionar comentário na coluna
COMMENT ON COLUMN domains.is_transferable IS 'Indica se o domínio pode ser transferido para outro titular';

-- Função para processar transferência de domínio
CREATE OR REPLACE FUNCTION process_domain_transfer(
  p_transfer_id uuid,
  p_payment_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transfer domain_transfers;
  v_domain domains;
BEGIN
  -- Buscar transferência
  SELECT * INTO v_transfer
  FROM domain_transfers
  WHERE id = p_transfer_id
  AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transfer not found or already processed';
  END IF;

  -- Buscar domínio
  SELECT * INTO v_domain
  FROM domains
  WHERE id = v_transfer.domain_id
  AND customer_id = v_transfer.from_customer_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Domain not found or not owned by seller';
  END IF;

  -- Verificar se domínio é transferível
  IF NOT v_domain.is_transferable THEN
    RAISE EXCEPTION 'Domain is not transferable';
  END IF;

  -- Atualizar titular do domínio
  UPDATE domains
  SET
    customer_id = v_transfer.to_customer_id
  WHERE id = v_transfer.domain_id;

  -- Marcar transferência como concluída
  UPDATE domain_transfers
  SET
    status = 'completed',
    payment_id = p_payment_id,
    completed_at = now()
  WHERE id = p_transfer_id;

  -- Registrar no log de auditoria
  INSERT INTO audit_logs (
    event_type,
    user_id,
    resource_type,
    resource_id,
    metadata
  )
  SELECT
    'domain_transfer_completed',
    c.user_id,
    'domain',
    v_transfer.domain_id,
    jsonb_build_object(
      'transfer_id', p_transfer_id,
      'from_customer_id', v_transfer.from_customer_id,
      'to_customer_id', v_transfer.to_customer_id,
      'transfer_fee', v_transfer.transfer_fee,
      'new_annual_fee', v_transfer.new_annual_fee
    )
  FROM customers c
  WHERE c.id = v_transfer.to_customer_id;

  RETURN true;
END;
$$;

-- Função para cancelar transferência
CREATE OR REPLACE FUNCTION cancel_domain_transfer(p_transfer_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE domain_transfers
  SET
    status = 'cancelled',
    cancelled_at = now()
  WHERE id = p_transfer_id
  AND status = 'pending';

  RETURN FOUND;
END;
$$;

-- Adicionar configuração de taxa de transferência na tabela admin_settings
INSERT INTO admin_settings (setting_key, setting_value, description)
VALUES (
  'domain_transfer_fee',
  '50.00',
  'Taxa fixa para transferência de domínio entre titulares (em USD)'
) ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  description = EXCLUDED.description,
  updated_at = now();

INSERT INTO admin_settings (setting_key, setting_value, description)
VALUES (
  'domain_annual_fee_on_transfer',
  '100.00',
  'Anuidade obrigatória na transferência de domínio (em USD)'
) ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  description = EXCLUDED.description,
  updated_at = now();
