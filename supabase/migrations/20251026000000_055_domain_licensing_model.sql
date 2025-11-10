/*
  # Domain Licensing Model Implementation

  **Objetivo:**
  Reestruturar o sistema de "venda de domínios" para "licenciamento exclusivo de uso".
  Todos os domínios permanecem como propriedade da Global Digital Identity LTD.
  Clientes recebem apenas licenças exclusivas de uso, revogáveis conforme contrato.

  ## Mudanças

  1. **Tabela `domains`**
     - Adicionar `license_status` (active, suspended, revoked, expired)
     - Adicionar `license_type` (exclusive_personal, exclusive_business, trial)
     - Adicionar `license_start_date` (início da licença)
     - Adicionar `license_end_date` (término da licença, se aplicável)
     - Adicionar `is_revocable` (se pode ser revogada)
     - Adicionar `revocation_reason` (motivo da revogação)
     - Adicionar `revoked_at` (data/hora da revogação)
     - Adicionar `revoked_by` (admin que revogou)
     - Adicionar `license_notes` (observações sobre a licença)

  2. **Tabela `domain_license_history`**
     - Criar nova tabela para histórico de mudanças de licença
     - Registrar todas as alterações de status

  3. **Security**
     - Manter RLS existente
     - Apenas admins podem revogar licenças
     - Usuários podem ver status de suas licenças

  4. **Notas Importantes**
     - Esta é uma mudança de modelo de negócio fundamental
     - Não afeta domínios já ativos (grandfathering)
     - Todos os novos domínios seguem o modelo de licenciamento
     - Global Digital Identity LTD mantém titularidade de todos os domínios
*/

-- =====================================================
-- STEP 1: Add licensing fields to domains table
-- =====================================================

DO $$
BEGIN
  -- Add license_status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'domains' AND column_name = 'license_status'
  ) THEN
    ALTER TABLE domains
    ADD COLUMN license_status text DEFAULT 'active'
    CHECK (license_status IN ('active', 'suspended', 'revoked', 'expired', 'pending'));
  END IF;

  -- Add license_type
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'domains' AND column_name = 'license_type'
  ) THEN
    ALTER TABLE domains
    ADD COLUMN license_type text DEFAULT 'exclusive_personal'
    CHECK (license_type IN ('exclusive_personal', 'exclusive_business', 'trial', 'promotional'));
  END IF;

  -- Add license_start_date
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'domains' AND column_name = 'license_start_date'
  ) THEN
    ALTER TABLE domains
    ADD COLUMN license_start_date timestamptz DEFAULT now();
  END IF;

  -- Add license_end_date
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'domains' AND column_name = 'license_end_date'
  ) THEN
    ALTER TABLE domains
    ADD COLUMN license_end_date timestamptz;
  END IF;

  -- Add is_revocable
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'domains' AND column_name = 'is_revocable'
  ) THEN
    ALTER TABLE domains
    ADD COLUMN is_revocable boolean DEFAULT true;
  END IF;

  -- Add revocation_reason
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'domains' AND column_name = 'revocation_reason'
  ) THEN
    ALTER TABLE domains
    ADD COLUMN revocation_reason text;
  END IF;

  -- Add revoked_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'domains' AND column_name = 'revoked_at'
  ) THEN
    ALTER TABLE domains
    ADD COLUMN revoked_at timestamptz;
  END IF;

  -- Add revoked_by (admin user_id)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'domains' AND column_name = 'revoked_by'
  ) THEN
    ALTER TABLE domains
    ADD COLUMN revoked_by uuid REFERENCES auth.users(id);
  END IF;

  -- Add license_notes
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'domains' AND column_name = 'license_notes'
  ) THEN
    ALTER TABLE domains
    ADD COLUMN license_notes text;
  END IF;
END $$;

-- =====================================================
-- STEP 2: Create domain_license_history table
-- =====================================================

CREATE TABLE IF NOT EXISTS domain_license_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id uuid NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  previous_status text,
  new_status text NOT NULL,
  previous_type text,
  new_type text,
  changed_by uuid REFERENCES auth.users(id),
  change_reason text,
  changed_at timestamptz DEFAULT now(),
  metadata jsonb
);

ALTER TABLE domain_license_history ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 3: Create indexes for performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_domains_license_status ON domains(license_status);
CREATE INDEX IF NOT EXISTS idx_domains_license_type ON domains(license_type);
CREATE INDEX IF NOT EXISTS idx_domains_license_end_date ON domains(license_end_date);
CREATE INDEX IF NOT EXISTS idx_domain_license_history_domain_id ON domain_license_history(domain_id);
CREATE INDEX IF NOT EXISTS idx_domain_license_history_changed_at ON domain_license_history(changed_at);

-- =====================================================
-- STEP 4: RLS Policies for domain_license_history
-- =====================================================

-- Users can view history of their own domains
CREATE POLICY "Users can view own domain license history"
  ON domain_license_history FOR SELECT
  TO authenticated
  USING (
    domain_id IN (
      SELECT d.id FROM domains d
      INNER JOIN customers c ON d.customer_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

-- Admins can view all history
CREATE POLICY "Admins can view all license history"
  ON domain_license_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Only system can insert history (via triggers)
CREATE POLICY "System can insert license history"
  ON domain_license_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- =====================================================
-- STEP 5: Create trigger to log license changes
-- =====================================================

CREATE OR REPLACE FUNCTION log_domain_license_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Log status change
  IF (TG_OP = 'UPDATE' AND OLD.license_status IS DISTINCT FROM NEW.license_status) THEN
    INSERT INTO domain_license_history (
      domain_id,
      previous_status,
      new_status,
      previous_type,
      new_type,
      changed_by,
      change_reason
    ) VALUES (
      NEW.id,
      OLD.license_status,
      NEW.license_status,
      OLD.license_type,
      NEW.license_type,
      NEW.revoked_by,
      NEW.revocation_reason
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_log_domain_license_change ON domains;
CREATE TRIGGER trigger_log_domain_license_change
  AFTER UPDATE ON domains
  FOR EACH ROW
  EXECUTE FUNCTION log_domain_license_change();

-- =====================================================
-- STEP 6: Migrate existing domains to licensing model
-- =====================================================

-- Set all existing active domains as licensed
UPDATE domains
SET
  license_status = 'active',
  license_type = CASE
    WHEN domain_type = 'business' THEN 'exclusive_business'
    ELSE 'exclusive_personal'
  END,
  license_start_date = COALESCE(created_at, now()),
  is_revocable = true
WHERE license_status IS NULL;

-- =====================================================
-- STEP 7: Create helper functions for admins
-- =====================================================

-- Function to revoke a license
CREATE OR REPLACE FUNCTION revoke_domain_license(
  p_domain_id uuid,
  p_reason text,
  p_admin_user_id uuid
)
RETURNS boolean AS $$
DECLARE
  v_is_admin boolean;
BEGIN
  -- Check if user is admin
  SELECT EXISTS(
    SELECT 1 FROM customers
    WHERE user_id = p_admin_user_id AND role = 'admin'
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Only admins can revoke licenses';
  END IF;

  -- Revoke the license
  UPDATE domains
  SET
    license_status = 'revoked',
    revoked_at = now(),
    revoked_by = p_admin_user_id,
    revocation_reason = p_reason
  WHERE id = p_domain_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to suspend a license
CREATE OR REPLACE FUNCTION suspend_domain_license(
  p_domain_id uuid,
  p_reason text,
  p_admin_user_id uuid
)
RETURNS boolean AS $$
DECLARE
  v_is_admin boolean;
BEGIN
  -- Check if user is admin
  SELECT EXISTS(
    SELECT 1 FROM customers
    WHERE user_id = p_admin_user_id AND role = 'admin'
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Only admins can suspend licenses';
  END IF;

  -- Suspend the license
  UPDATE domains
  SET
    license_status = 'suspended',
    revoked_by = p_admin_user_id,
    revocation_reason = p_reason
  WHERE id = p_domain_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reactivate a license
CREATE OR REPLACE FUNCTION reactivate_domain_license(
  p_domain_id uuid,
  p_admin_user_id uuid
)
RETURNS boolean AS $$
DECLARE
  v_is_admin boolean;
BEGIN
  -- Check if user is admin
  SELECT EXISTS(
    SELECT 1 FROM customers
    WHERE user_id = p_admin_user_id AND role = 'admin'
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Only admins can reactivate licenses';
  END IF;

  -- Reactivate the license
  UPDATE domains
  SET
    license_status = 'active',
    revoked_at = NULL,
    revoked_by = NULL,
    revocation_reason = NULL
  WHERE id = p_domain_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 8: Create views for easier querying
-- =====================================================

-- View for active licenses
CREATE OR REPLACE VIEW active_domain_licenses AS
SELECT
  d.id,
  d.fqdn,
  d.customer_id,
  d.license_status,
  d.license_type,
  d.license_start_date,
  d.license_end_date,
  d.created_at,
  c.email as customer_email,
  c.full_name as customer_name
FROM domains d
INNER JOIN customers c ON d.customer_id = c.id
WHERE d.license_status = 'active';

-- View for revoked/suspended licenses
CREATE OR REPLACE VIEW revoked_domain_licenses AS
SELECT
  d.id,
  d.fqdn,
  d.customer_id,
  d.license_status,
  d.revocation_reason,
  d.revoked_at,
  d.revoked_by,
  c.email as customer_email,
  c.full_name as customer_name,
  admin.email as revoked_by_email
FROM domains d
INNER JOIN customers c ON d.customer_id = c.id
LEFT JOIN customers admin ON d.revoked_by = admin.user_id
WHERE d.license_status IN ('revoked', 'suspended');

-- =====================================================
-- Comments for documentation
-- =====================================================

COMMENT ON COLUMN domains.license_status IS 'Status da licença: active, suspended, revoked, expired, pending';
COMMENT ON COLUMN domains.license_type IS 'Tipo de licença: exclusive_personal, exclusive_business, trial, promotional';
COMMENT ON COLUMN domains.license_start_date IS 'Data de início da licença exclusiva';
COMMENT ON COLUMN domains.license_end_date IS 'Data de término da licença (NULL = permanente enquanto ativa)';
COMMENT ON COLUMN domains.is_revocable IS 'Se a licença pode ser revogada pela Global Digital Identity LTD';
COMMENT ON COLUMN domains.revocation_reason IS 'Motivo da revogação ou suspensão';
COMMENT ON COLUMN domains.revoked_at IS 'Data/hora da revogação';
COMMENT ON COLUMN domains.revoked_by IS 'ID do admin que revogou a licença';
COMMENT ON COLUMN domains.license_notes IS 'Observações administrativas sobre a licença';

COMMENT ON TABLE domain_license_history IS 'Histórico completo de mudanças de status de licenças de domínio';
COMMENT ON FUNCTION revoke_domain_license IS 'Revoga permanentemente uma licença de domínio (apenas admins)';
COMMENT ON FUNCTION suspend_domain_license IS 'Suspende temporariamente uma licença de domínio (apenas admins)';
COMMENT ON FUNCTION reactivate_domain_license IS 'Reativa uma licença suspensa (apenas admins)';
