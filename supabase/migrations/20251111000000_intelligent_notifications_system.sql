/*
  # Intelligent Notifications & Alerts System

  This migration creates a comprehensive notification system that provides:
  - Unified notifications between dashboard and domain cards
  - Real-time alerts based on account/domain/payment status
  - Direct action routing (deep actions)
  - Smart auto-resolution when issues are fixed

  ## Notification Types

  - **payment_due**: Payment pending/overdue
  - **domain_grace**: Domain in grace period
  - **domain_redemption**: Domain in redemption (recovery required)
  - **domain_auction**: Domain entering auction
  - **trial_expiring**: Trial ending soon
  - **trial_expired**: Trial ended, rights revoked
  - **plan_blocked**: Plan suspended (unpaid_hold)
  - **fraud_detected**: Account flagged for fraud
  - **chargeback**: Chargeback detected
  - **affiliate_released**: Affiliates released due to non-payment
  - **upgrade_available**: Upgrade recommendation
  - **domain_limit_reached**: Hit domain limit for plan
  - **success**: Success message (payment confirmed, domain activated, etc.)

  ## Priority Levels

  - **critical**: Blocking issues (account suspended, fraud)
  - **high**: Urgent action needed (payment overdue, last day of grace)
  - **medium**: Important reminders (grace period, trial ending)
  - **low**: Informational (success messages, tips)

  ## Status Flow

  new → viewed → resolved (auto or manual)
*/

-- Step 1: Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain_id uuid REFERENCES domains(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES subscriptions(id) ON DELETE SET NULL,

  -- Notification details
  type text NOT NULL,
  priority text NOT NULL CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  title text NOT NULL,
  message text NOT NULL,

  -- Action routing
  action_label text, -- "Regularizar Pagamento", "Ver Detalhes", etc.
  action_url text, -- Where to navigate
  action_type text, -- 'navigate', 'modal', 'external'
  action_metadata jsonb DEFAULT '{}'::jsonb,

  -- State management
  status text DEFAULT 'new' CHECK (status IN ('new', 'viewed', 'resolved', 'dismissed')),
  viewed_at timestamptz,
  resolved_at timestamptz,
  resolved_by text, -- 'auto', 'user', 'admin'

  -- Display control
  display_mode text DEFAULT 'both' CHECK (display_mode IN ('dashboard', 'card', 'both', 'overlay')),
  expires_at timestamptz, -- Auto-dismiss after this date

  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Step 2: Create notification_templates table
CREATE TABLE IF NOT EXISTS notification_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL UNIQUE,
  priority text NOT NULL,
  title_template text NOT NULL, -- "Pagamento pendente: {{domain_name}}"
  message_template text NOT NULL,
  action_label text,
  action_url_template text,
  display_mode text DEFAULT 'both',
  icon text, -- Emoji or icon name
  color_scheme text, -- 'red', 'amber', 'green', 'blue'
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Step 3: Insert default notification templates
INSERT INTO notification_templates (type, priority, title_template, message_template, action_label, action_url_template, display_mode, icon, color_scheme) VALUES
  -- Payment related
  ('payment_due', 'high', 'Pagamento Pendente: {{domain_name}}', 'Seu pagamento vence em {{days_until}} dias. Regularize para manter seu domínio ativo.', 'Regularizar Pagamento', '/painel/billing', 'both', '⚠️', 'amber'),
  ('payment_overdue', 'critical', 'Pagamento Vencido: {{domain_name}}', 'Seu pagamento está vencido. Domínio entrará em período de graça em breve.', 'Pagar Agora', '/painel/billing', 'overlay', '🔴', 'red'),

  -- Domain lifecycle
  ('domain_grace', 'high', 'Domínio em Período de Graça', 'Seu domínio {{domain_name}} está em período de graça. {{days_remaining}} dias restantes para regularizar sem taxa adicional.', 'Pagar Agora', '/painel/domains/{{domain_id}}', 'both', '🟡', 'amber'),
  ('domain_redemption', 'critical', 'Domínio em Resgate: {{domain_name}}', 'Domínio suspenso. Recuperação requer pagamento + taxa de resgate (USD ${{recovery_fee}}). {{days_remaining}} dias restantes.', 'Recuperar Domínio', '/painel/domains/{{domain_id}}/recover', 'both', '🔴', 'red'),
  ('domain_auction', 'critical', 'Domínio Entrando em Leilão', 'Seu domínio {{domain_name}} entrará em leilão. Você tem prioridade até {{priority_until}} para recuperar.', 'Recuperar Agora', '/painel/domains/{{domain_id}}/recover', 'overlay', '🔨', 'red'),

  -- Trial & Plan
  ('trial_expiring', 'medium', 'Trial Terminando em {{days_remaining}} Dias', 'Seu período de teste termina em breve. Ative seu plano para manter domínios e afiliados.', 'Ativar Plano', '/valores', 'both', '⏰', 'blue'),
  ('trial_expired', 'critical', 'Trial Expirado - Direitos Revogados', 'Seu período de teste terminou sem pagamento. Todos os direitos e afiliados foram cancelados. {{recovery_days}} dias para recuperar.', 'Regularizar', '/painel/billing', 'overlay', '❌', 'red'),
  ('plan_blocked', 'critical', 'Conta Suspensa por Falta de Pagamento', 'Sua conta está suspensa. Todos os domínios e afiliados foram bloqueados. Regularize para reativar.', 'Ir para Pagamentos', '/painel/billing', 'overlay', '🚫', 'red'),

  -- Fraud
  ('fraud_detected', 'critical', 'Conta Bloqueada para Análise', 'Detectamos múltiplas tentativas de uso indevido. Sua conta foi bloqueada e todos os afiliados removidos.', 'Solicitar Revisão', '/support', 'overlay', '⛔', 'red'),
  ('chargeback', 'critical', 'Chargeback Detectado', 'Um chargeback foi registrado. Sua conta está em disputa até resolução. Entre em contato com suporte.', 'Falar com Suporte', '/support', 'overlay', '⚠️', 'red'),

  -- Limits
  ('domain_limit_reached', 'medium', 'Limite de Domínios Atingido', 'Você atingiu o limite de {{max_domains}} domínio(s) do plano {{plan_name}}. Faça upgrade para Elite para domínios ilimitados.', 'Fazer Upgrade', '/valores', 'both', '🚧', 'amber'),

  -- Success
  ('payment_success', 'low', 'Pagamento Confirmado', 'Seu pagamento foi processado com sucesso. Domínio {{domain_name}} está ativo!', 'Ver Domínio', '/painel/domains/{{domain_id}}', 'dashboard', '✅', 'green'),
  ('domain_activated', 'low', 'Domínio Ativado', 'Seu domínio {{domain_name}} foi ativado e está pronto para uso!', 'Gerenciar Domínio', '/painel/domains/{{domain_id}}', 'both', '🎉', 'green'),
  ('trial_converted', 'low', 'Trial Convertido com Sucesso', 'Seu trial foi convertido para plano pago. Todos os seus direitos estão confirmados!', 'Ver Painel', '/painel', 'dashboard', '🎊', 'green')
ON CONFLICT (type) DO NOTHING;

-- Step 4: Create function to generate notification from template
CREATE OR REPLACE FUNCTION create_notification_from_template(
  p_user_id uuid,
  p_type text,
  p_domain_id uuid DEFAULT NULL,
  p_subscription_id uuid DEFAULT NULL,
  p_variables jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_template notification_templates%ROWTYPE;
  v_notification_id uuid;
  v_title text;
  v_message text;
  v_action_url text;
BEGIN
  -- Get template
  SELECT * INTO v_template
  FROM notification_templates
  WHERE type = p_type AND is_active = true;

  IF v_template IS NULL THEN
    RAISE EXCEPTION 'Notification template not found: %', p_type;
  END IF;

  -- Replace variables in templates
  v_title := v_template.title_template;
  v_message := v_template.message_template;
  v_action_url := v_template.action_url_template;

  -- Simple variable replacement ({{variable_name}})
  FOR i IN 0..jsonb_object_keys(p_variables)::text[] LOOP
    v_title := replace(v_title, '{{' || i || '}}', p_variables->>i);
    v_message := replace(v_message, '{{' || i || '}}', p_variables->>i);
    v_action_url := replace(v_action_url, '{{' || i || '}}', p_variables->>i);
  END LOOP;

  -- Insert notification
  INSERT INTO notifications (
    user_id,
    domain_id,
    subscription_id,
    type,
    priority,
    title,
    message,
    action_label,
    action_url,
    display_mode,
    metadata
  ) VALUES (
    p_user_id,
    p_domain_id,
    p_subscription_id,
    p_type,
    v_template.priority,
    v_title,
    v_message,
    v_template.action_label,
    v_action_url,
    v_template.display_mode,
    p_variables
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$;

-- Step 5: Create function to auto-resolve notifications
CREATE OR REPLACE FUNCTION auto_resolve_notification(
  p_user_id uuid,
  p_type text,
  p_domain_id uuid DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_resolved_count integer;
BEGIN
  UPDATE notifications
  SET
    status = 'resolved',
    resolved_at = now(),
    resolved_by = 'auto'
  WHERE user_id = p_user_id
    AND type = p_type
    AND (p_domain_id IS NULL OR domain_id = p_domain_id)
    AND status NOT IN ('resolved', 'dismissed')
  RETURNING COUNT(*) INTO v_resolved_count;

  RETURN COALESCE(v_resolved_count, 0);
END;
$$;

-- Step 6: Create function to get user notifications
CREATE OR REPLACE FUNCTION get_my_notifications(
  p_status text DEFAULT NULL,
  p_display_mode text DEFAULT NULL,
  p_limit integer DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  type text,
  priority text,
  title text,
  message text,
  action_label text,
  action_url text,
  display_mode text,
  status text,
  domain_id uuid,
  domain_name text,
  created_at timestamptz,
  metadata jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    n.id,
    n.type,
    n.priority,
    n.title,
    n.message,
    n.action_label,
    n.action_url,
    n.display_mode,
    n.status,
    n.domain_id,
    d.fqdn as domain_name,
    n.created_at,
    n.metadata
  FROM notifications n
  LEFT JOIN domains d ON d.id = n.domain_id
  WHERE n.user_id = auth.uid()
    AND (p_status IS NULL OR n.status = p_status)
    AND (p_display_mode IS NULL OR n.display_mode = p_display_mode OR n.display_mode = 'both')
    AND (n.expires_at IS NULL OR n.expires_at > now())
  ORDER BY
    CASE n.priority
      WHEN 'critical' THEN 1
      WHEN 'high' THEN 2
      WHEN 'medium' THEN 3
      WHEN 'low' THEN 4
    END,
    n.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Step 7: Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, status);
CREATE INDEX IF NOT EXISTS idx_notifications_domain ON notifications(domain_id, status);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type, status);
CREATE INDEX IF NOT EXISTS idx_notifications_expires ON notifications(expires_at) WHERE expires_at IS NOT NULL;

-- Step 8: Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Everyone can view active templates"
  ON notification_templates FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Only admins can manage templates"
  ON notification_templates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = auth.uid()
      AND customers.role = 'admin'
    )
  );

-- Step 9: Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_notification_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_notification_timestamp
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_timestamp();

-- Step 10: Add comments
COMMENT ON TABLE notifications IS 'Unified notification system for dashboard and domain cards';
COMMENT ON TABLE notification_templates IS 'Reusable templates for generating notifications';
COMMENT ON FUNCTION create_notification_from_template IS 'Generates notification from template with variable substitution';
COMMENT ON FUNCTION auto_resolve_notification IS 'Auto-resolves notifications when issue is fixed';
COMMENT ON FUNCTION get_my_notifications IS 'Gets current user notifications with filters';

COMMENT ON COLUMN notifications.display_mode IS 'Where to show: dashboard, card, both, or overlay';
COMMENT ON COLUMN notifications.priority IS 'critical=blocking, high=urgent, medium=important, low=info';
COMMENT ON COLUMN notifications.action_url IS 'Deep link for direct action routing';
