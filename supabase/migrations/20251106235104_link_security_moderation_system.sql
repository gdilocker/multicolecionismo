/*
  # Sistema de Verificação e Moderação de Links Maliciosos

  1. Novas Tabelas
    - `link_security_checks`: Armazena histórico de verificações de segurança
      - `id` (uuid, primary key)
      - `link_id` (uuid, FK para profile_links)
      - `url` (text, URL verificada)
      - `status` (enum: safe, suspicious, malicious, pending)
      - `check_type` (enum: automatic, manual, periodic, user_request)
      - `threat_types` (jsonb, tipos de ameaças detectadas)
      - `provider` (text, ex: google_safe_browsing, virustotal)
      - `raw_response` (jsonb, resposta completa da API)
      - `checked_at` (timestamptz)
      - `checked_by` (uuid, FK para auth.users - null se automático)
      - `notes` (text, observações do admin)
    
    - `link_moderation_actions`: Histórico de ações administrativas
      - `id` (uuid, primary key)
      - `link_id` (uuid, FK para profile_links)
      - `security_check_id` (uuid, FK para link_security_checks)
      - `action_type` (enum: approved, blocked, review_requested, recheck, restored)
      - `reason` (text)
      - `performed_by` (uuid, FK para auth.users)
      - `performed_at` (timestamptz)
      - `metadata` (jsonb)

  2. Alterações em Tabelas Existentes
    - `profile_links`: Adicionar colunas de segurança
      - `security_status` (enum: safe, suspicious, malicious, pending, under_review)
      - `is_blocked` (boolean, default false)
      - `last_security_check` (timestamptz)
      - `security_check_count` (integer, default 0)
      - `block_reason` (text)

  3. Índices
    - Índices para otimizar queries de moderação e histórico

  4. Security
    - RLS policies para proteger dados sensíveis
    - Admins podem ver tudo
    - Usuários podem ver apenas seus próprios links
*/

-- Criar ENUM types
DO $$ BEGIN
  CREATE TYPE link_security_status AS ENUM ('safe', 'suspicious', 'malicious', 'pending', 'under_review');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE link_check_type AS ENUM ('automatic', 'manual', 'periodic', 'user_request');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE link_moderation_action_type AS ENUM ('approved', 'blocked', 'review_requested', 'recheck', 'restored', 'force_safe');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Adicionar colunas de segurança em profile_links
ALTER TABLE profile_links 
ADD COLUMN IF NOT EXISTS security_status link_security_status DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS is_blocked boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS last_security_check timestamptz,
ADD COLUMN IF NOT EXISTS security_check_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS block_reason text;

-- Criar tabela de verificações de segurança
CREATE TABLE IF NOT EXISTS link_security_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id uuid NOT NULL REFERENCES profile_links(id) ON DELETE CASCADE,
  url text NOT NULL,
  status link_security_status NOT NULL DEFAULT 'pending',
  check_type link_check_type NOT NULL DEFAULT 'automatic',
  threat_types jsonb DEFAULT '[]'::jsonb,
  provider text,
  raw_response jsonb,
  checked_at timestamptz DEFAULT now(),
  checked_by uuid REFERENCES auth.users(id),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Criar tabela de ações de moderação
CREATE TABLE IF NOT EXISTS link_moderation_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id uuid NOT NULL REFERENCES profile_links(id) ON DELETE CASCADE,
  security_check_id uuid REFERENCES link_security_checks(id) ON DELETE SET NULL,
  action_type link_moderation_action_type NOT NULL,
  reason text,
  performed_by uuid NOT NULL REFERENCES auth.users(id),
  performed_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_link_security_checks_link_id ON link_security_checks(link_id);
CREATE INDEX IF NOT EXISTS idx_link_security_checks_status ON link_security_checks(status);
CREATE INDEX IF NOT EXISTS idx_link_security_checks_checked_at ON link_security_checks(checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_link_security_checks_check_type ON link_security_checks(check_type);

CREATE INDEX IF NOT EXISTS idx_link_moderation_actions_link_id ON link_moderation_actions(link_id);
CREATE INDEX IF NOT EXISTS idx_link_moderation_actions_performed_at ON link_moderation_actions(performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_link_moderation_actions_action_type ON link_moderation_actions(action_type);

CREATE INDEX IF NOT EXISTS idx_profile_links_security_status ON profile_links(security_status);
CREATE INDEX IF NOT EXISTS idx_profile_links_is_blocked ON profile_links(is_blocked);
CREATE INDEX IF NOT EXISTS idx_profile_links_last_security_check ON profile_links(last_security_check);

-- RLS Policies para link_security_checks

ALTER TABLE link_security_checks ENABLE ROW LEVEL SECURITY;

-- Admins podem ver tudo
CREATE POLICY "Admins can view all security checks"
  ON link_security_checks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = auth.uid()
      AND customers.role = 'admin'
    )
  );

-- Usuários podem ver checks de seus próprios links
CREATE POLICY "Users can view their own link checks"
  ON link_security_checks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profile_links
      WHERE profile_links.id = link_security_checks.link_id
      AND profile_links.profile_id IN (
        SELECT id FROM user_profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Sistema pode inserir checks
CREATE POLICY "System can insert security checks"
  ON link_security_checks FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Admins podem atualizar checks
CREATE POLICY "Admins can update security checks"
  ON link_security_checks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = auth.uid()
      AND customers.role = 'admin'
    )
  );

-- RLS Policies para link_moderation_actions

ALTER TABLE link_moderation_actions ENABLE ROW LEVEL SECURITY;

-- Admins podem ver todas as ações
CREATE POLICY "Admins can view all moderation actions"
  ON link_moderation_actions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = auth.uid()
      AND customers.role = 'admin'
    )
  );

-- Usuários podem ver ações em seus próprios links
CREATE POLICY "Users can view moderation actions on their links"
  ON link_moderation_actions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profile_links
      WHERE profile_links.id = link_moderation_actions.link_id
      AND profile_links.profile_id IN (
        SELECT id FROM user_profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Admins podem inserir ações
CREATE POLICY "Admins can insert moderation actions"
  ON link_moderation_actions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = auth.uid()
      AND customers.role = 'admin'
    )
  );

-- Criar função para atualizar status de segurança do link
CREATE OR REPLACE FUNCTION update_link_security_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar profile_links com o resultado do check
  UPDATE profile_links
  SET 
    security_status = NEW.status,
    is_blocked = CASE 
      WHEN NEW.status = 'malicious' THEN true
      WHEN NEW.status = 'safe' THEN false
      ELSE is_blocked
    END,
    last_security_check = NEW.checked_at,
    security_check_count = security_check_count + 1,
    block_reason = CASE 
      WHEN NEW.status = 'malicious' THEN 
        COALESCE(NEW.notes, 'Link identificado como malicioso por verificação automática de segurança')
      WHEN NEW.status = 'safe' THEN NULL
      ELSE block_reason
    END
  WHERE id = NEW.link_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para atualizar status automaticamente
DROP TRIGGER IF EXISTS trigger_update_link_security_status ON link_security_checks;
CREATE TRIGGER trigger_update_link_security_status
  AFTER INSERT ON link_security_checks
  FOR EACH ROW
  EXECUTE FUNCTION update_link_security_status();

-- Criar função para solicitar revisão manual
CREATE OR REPLACE FUNCTION request_link_review(
  p_link_id uuid,
  p_user_message text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid;
  v_action_id uuid;
  v_profile_owner uuid;
BEGIN
  -- Verificar se o usuário é o dono do link
  SELECT up.user_id INTO v_profile_owner
  FROM profile_links pl
  JOIN user_profiles up ON up.id = pl.profile_id
  WHERE pl.id = p_link_id;
  
  IF v_profile_owner != auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Acesso negado');
  END IF;
  
  -- Atualizar status do link
  UPDATE profile_links
  SET security_status = 'under_review'
  WHERE id = p_link_id;
  
  -- Registrar ação
  INSERT INTO link_moderation_actions (
    link_id,
    action_type,
    reason,
    performed_by,
    metadata
  ) VALUES (
    p_link_id,
    'review_requested',
    p_user_message,
    auth.uid(),
    jsonb_build_object('user_message', p_user_message)
  ) RETURNING id INTO v_action_id;
  
  RETURN jsonb_build_object(
    'success', true, 
    'action_id', v_action_id,
    'message', 'Revisão solicitada com sucesso'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar função para buscar links que precisam de verificação periódica
CREATE OR REPLACE FUNCTION get_links_for_periodic_check(
  p_hours_since_last_check integer DEFAULT 24
)
RETURNS TABLE (
  link_id uuid,
  url text,
  profile_id uuid,
  last_check timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pl.id as link_id,
    pl.url,
    pl.profile_id,
    pl.last_security_check as last_check
  FROM profile_links pl
  WHERE pl.is_active = true
    AND pl.url IS NOT NULL
    AND pl.url != ''
    AND (
      pl.last_security_check IS NULL 
      OR pl.last_security_check < (now() - (p_hours_since_last_check || ' hours')::interval)
    )
  ORDER BY pl.last_security_check ASC NULLS FIRST
  LIMIT 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Inicializar links existentes com status 'pending'
UPDATE profile_links
SET security_status = 'pending'
WHERE security_status IS NULL
  AND url IS NOT NULL
  AND url != '';

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE 'Sistema de verificação e moderação de links criado com sucesso';
  RAISE NOTICE '- Tabelas: link_security_checks, link_moderation_actions';
  RAISE NOTICE '- Colunas adicionadas em profile_links';
  RAISE NOTICE '- RLS policies configuradas';
  RAISE NOTICE '- Funções auxiliares criadas';
END $$;