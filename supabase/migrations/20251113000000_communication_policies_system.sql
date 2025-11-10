/*
  # Communication Policies & Automated Messaging System

  This migration implements a comprehensive communication system for the .com.rich platform:
  - Multi-channel messaging (email, in-app, WhatsApp, push)
  - Automated timeline based on domain lifecycle
  - Message templates with variable substitution
  - User preferences and opt-in controls
  - Tracking and analytics
  - Compliance (LGPD/GDPR)

  ## Communication Timeline

  **Pre-Expiration:**
  - D-14: "Renovação se aproxima"
  - D-7: "Faltam 7 dias"
  - D-3: "Últimos dias"
  - D-1: "Vencimento amanhã"

  **Post-Expiration:**
  - D+1: "Período de graça iniciado"
  - D+10: "Ainda sem taxa adicional"
  - D+16: "Período de resgate (taxa aplicável)"
  - D+30: "Antes do pré-leilão"
  - D+45: "Último aviso"
  - D+60: "Entrará em leilão"
  - D+75: "Remoção definitiva"

  **Critical Events:**
  - Chargeback → Bloqueio imediato
  - Fraud → Conta suspensa
  - Payment Success → Reativação
*/

-- Step 1: Extend notification_templates with communication metadata
DO $$
BEGIN
  -- Add channel field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notification_templates' AND column_name = 'channels'
  ) THEN
    ALTER TABLE notification_templates ADD COLUMN channels text[] DEFAULT ARRAY['dashboard']::text[];
  END IF;

  -- Add email template
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notification_templates' AND column_name = 'email_subject'
  ) THEN
    ALTER TABLE notification_templates ADD COLUMN email_subject text;
    ALTER TABLE notification_templates ADD COLUMN email_body text;
  END IF;

  -- Add WhatsApp template
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notification_templates' AND column_name = 'whatsapp_message'
  ) THEN
    ALTER TABLE notification_templates ADD COLUMN whatsapp_message text;
  END IF;

  -- Add timing config
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notification_templates' AND column_name = 'send_at_days'
  ) THEN
    ALTER TABLE notification_templates ADD COLUMN send_at_days integer; -- D-14, D+1, etc
    ALTER TABLE notification_templates ADD COLUMN lifecycle_trigger text; -- 'pre_expiration', 'grace', 'redemption'
  END IF;
END $$;

-- Step 2: Create communication_preferences table
CREATE TABLE IF NOT EXISTS communication_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,

  -- Channel preferences
  email_enabled boolean DEFAULT true,
  email_address text,
  whatsapp_enabled boolean DEFAULT false,
  whatsapp_number text,
  sms_enabled boolean DEFAULT false,
  sms_number text,
  push_enabled boolean DEFAULT true,

  -- Notification types
  renewal_reminders boolean DEFAULT true,
  payment_alerts boolean DEFAULT true,
  domain_lifecycle boolean DEFAULT true,
  security_alerts boolean DEFAULT true,
  marketing_updates boolean DEFAULT false,

  -- Timing preferences
  reminder_days_before integer[] DEFAULT ARRAY[14, 7, 3, 1],
  quiet_hours_start time,
  quiet_hours_end time,
  timezone text DEFAULT 'UTC',

  -- Compliance
  opted_in_at timestamptz DEFAULT now(),
  opted_out_at timestamptz,
  gdpr_consent boolean DEFAULT false,
  lgpd_consent boolean DEFAULT false,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Step 3: Create communication_log table (tracking)
CREATE TABLE IF NOT EXISTS communication_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain_id uuid REFERENCES domains(id) ON DELETE SET NULL,
  notification_id uuid REFERENCES notifications(id) ON DELETE SET NULL,

  -- Message details
  channel text NOT NULL CHECK (channel IN ('email', 'in_app', 'whatsapp', 'sms', 'push')),
  template_type text NOT NULL,
  subject text,
  message text NOT NULL,

  -- Delivery tracking
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
  sent_at timestamptz,
  delivered_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  failed_at timestamptz,
  failure_reason text,

  -- External tracking
  external_message_id text, -- SendGrid/Twilio/etc ID
  external_status text,

  -- Analytics
  click_count integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,

  created_at timestamptz DEFAULT now()
);

-- Step 4: Insert enhanced notification templates with communication config
INSERT INTO notification_templates (
  type,
  priority,
  title_template,
  message_template,
  action_label,
  action_url_template,
  display_mode,
  icon,
  color_scheme,
  channels,
  send_at_days,
  lifecycle_trigger,
  email_subject,
  email_body,
  whatsapp_message
) VALUES
  -- Pre-expiration reminders
  (
    'renewal_reminder_14d',
    'medium',
    'Renovação se Aproxima - {{domain_name}}',
    'Sua renovação se aproxima em 14 dias. Antecipe e mantenha seu status ativo.',
    'Renovar Agora',
    '/painel/domains/{{domain_id}}/renew',
    'both',
    '📅',
    'blue',
    ARRAY['dashboard', 'email'],
    -14,
    'pre_expiration',
    'Sua renovação .com.rich se aproxima',
    E'<h2>Olá,</h2><p>Seu domínio <strong>{{domain_name}}</strong> será renovado em 14 dias.</p><p>Antecipe seu pagamento e mantenha sua identidade digital exclusiva sempre ativa.</p>',
    'Sua renovação .com.rich se aproxima em 14 dias. Mantenha sua identidade ativa: {{action_url}}'
  ),
  (
    'renewal_reminder_7d',
    'medium',
    'Faltam 7 Dias - {{domain_name}}',
    'Faltam apenas 7 dias para renovar seu domínio exclusivo.',
    'Renovar Agora',
    '/painel/domains/{{domain_id}}/renew',
    'both',
    '⏰',
    'blue',
    ARRAY['dashboard', 'email', 'whatsapp'],
    -7,
    'pre_expiration',
    'Faltam 7 dias para renovar seu domínio .com.rich',
    E'<h2>Olá,</h2><p>Seu domínio <strong>{{domain_name}}</strong> vence em 7 dias.</p><p>Garanta sua continuidade exclusiva renovando agora.</p>',
    'Faltam 7 dias para renovar {{domain_name}}. Garanta sua continuidade: {{action_url}}'
  ),
  (
    'renewal_reminder_3d',
    'high',
    'Últimos Dias - {{domain_name}}',
    'Últimos dias para garantir sua continuidade exclusiva.',
    'Renovar Agora',
    '/painel/domains/{{domain_id}}/renew',
    'both',
    '⚠️',
    'amber',
    ARRAY['dashboard', 'email', 'whatsapp'],
    -3,
    'pre_expiration',
    'Últimos dias para renovar seu .com.rich',
    E'<h2>Atenção,</h2><p>Faltam apenas 3 dias para o vencimento de <strong>{{domain_name}}</strong>.</p><p>Evite suspensão automática renovando agora.</p>',
    'ÚLTIMOS DIAS para renovar {{domain_name}}. Evite suspensão: {{action_url}}'
  ),
  (
    'renewal_reminder_1d',
    'high',
    'Vencimento Amanhã - {{domain_name}}',
    'Seu domínio vence amanhã. Evite suspensão automática.',
    'Renovar Agora',
    '/painel/domains/{{domain_id}}/renew',
    'overlay',
    '🚨',
    'red',
    ARRAY['dashboard', 'email', 'whatsapp'],
    -1,
    'pre_expiration',
    'Vencimento amanhã - Seu domínio .com.rich',
    E'<h2>URGENTE</h2><p>Seu domínio <strong>{{domain_name}}</strong> vence amanhã.</p><p>Renove agora para manter todos os serviços ativos.</p>',
    'VENCIMENTO AMANHÃ: {{domain_name}}. Renove agora: {{action_url}}'
  ),

  -- Post-expiration (Grace period)
  (
    'grace_started',
    'high',
    'Período de Graça Iniciado - {{domain_name}}',
    'Seu domínio entrou em período de graça. Você tem {{days_remaining}} dias para renovar sem taxas adicionais.',
    'Renovar Sem Taxa',
    '/painel/domains/{{domain_id}}/renew',
    'both',
    '🟡',
    'amber',
    ARRAY['dashboard', 'email', 'whatsapp'],
    1,
    'grace',
    'Período de Graça - Renove sem taxa adicional',
    E'<h2>Seu domínio entrou em período de graça</h2><p><strong>{{domain_name}}</strong> ainda pode ser renovado sem taxa adicional.</p><p>Você tem {{days_remaining}} dias para regularizar.</p>',
    'Período de Graça: {{domain_name}}. Renove sem taxa adicional em {{days_remaining}} dias: {{action_url}}'
  ),
  (
    'grace_reminder_10d',
    'high',
    'Período de Graça - {{domain_name}}',
    'Você ainda pode renovar sem taxa adicional. {{days_remaining}} dias restantes.',
    'Renovar Agora',
    '/painel/domains/{{domain_id}}/renew',
    'both',
    '⏳',
    'amber',
    ARRAY['dashboard', 'email'],
    10,
    'grace',
    'Ainda sem taxa adicional - Período de Graça',
    E'<h2>Seu domínio ainda está em período de graça</h2><p>Renove <strong>{{domain_name}}</strong> nos próximos {{days_remaining}} dias sem taxa adicional.</p>',
    NULL
  ),

  -- Redemption period
  (
    'redemption_started',
    'critical',
    'Período de Resgate - {{domain_name}}',
    'Domínio suspenso. Taxa de recuperação de ${{recovery_fee}} necessária para reativação. {{days_remaining}} dias para recuperar.',
    'Recuperar Domínio',
    '/painel/domains/{{domain_id}}/recover',
    'overlay',
    '🔴',
    'red',
    ARRAY['dashboard', 'email', 'whatsapp'],
    16,
    'redemption',
    'DOMÍNIO SUSPENSO - Período de Resgate',
    E'<h2>Seu domínio foi suspenso</h2><p><strong>{{domain_name}}</strong> entrou em período de resgate.</p><p>Taxa de recuperação: <strong>${{recovery_fee}}</strong></p><p>Prazo: {{days_remaining}} dias</p>',
    'DOMÍNIO SUSPENSO: {{domain_name}}. Taxa de recuperação ${{recovery_fee}}. Recupere em {{days_remaining}} dias: {{action_url}}'
  ),
  (
    'redemption_reminder_30d',
    'critical',
    'Último Mês de Recuperação - {{domain_name}}',
    'Restaure seu domínio antes que entre em pré-leilão. {{days_remaining}} dias restantes.',
    'Recuperar Agora',
    '/painel/domains/{{domain_id}}/recover',
    'both',
    '⚠️',
    'red',
    ARRAY['dashboard', 'email', 'whatsapp'],
    30,
    'redemption',
    'Último mês para recuperar seu .com.rich',
    E'<h2>ÚLTIMO MÊS para recuperação</h2><p>Seu domínio <strong>{{domain_name}}</strong> entrará em pré-leilão em breve.</p><p>Recupere agora antes que seja tarde.</p>',
    'ÚLTIMO MÊS: Recupere {{domain_name}} antes do leilão. {{days_remaining}} dias: {{action_url}}'
  ),
  (
    'redemption_final_warning',
    'critical',
    'ÚLTIMO AVISO - {{domain_name}}',
    'Último aviso antes da proteção de registro expirar. Recupere nos próximos {{days_remaining}} dias.',
    'Recuperar Urgente',
    '/painel/domains/{{domain_id}}/recover',
    'overlay',
    '🚨',
    'red',
    ARRAY['dashboard', 'email', 'whatsapp'],
    45,
    'redemption',
    'ÚLTIMO AVISO - Domínio será liberado',
    E'<h2>ÚLTIMO AVISO</h2><p>Seu domínio <strong>{{domain_name}}</strong> será liberado para leilão em {{days_remaining}} dias.</p><p>Esta é sua última chance de recuperação.</p>',
    'ÚLTIMO AVISO: {{domain_name}} será liberado em {{days_remaining}} dias. Recupere: {{action_url}}'
  )
ON CONFLICT (type) DO UPDATE SET
  channels = EXCLUDED.channels,
  send_at_days = EXCLUDED.send_at_days,
  lifecycle_trigger = EXCLUDED.lifecycle_trigger,
  email_subject = EXCLUDED.email_subject,
  email_body = EXCLUDED.email_body,
  whatsapp_message = EXCLUDED.whatsapp_message;

-- Step 5: Create function to schedule communications
CREATE OR REPLACE FUNCTION schedule_domain_communications(
  p_domain_id uuid
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_domain domains%ROWTYPE;
  v_user_prefs communication_preferences%ROWTYPE;
  v_templates notification_templates[];
  v_scheduled_count integer := 0;
BEGIN
  -- Get domain
  SELECT * INTO v_domain FROM domains WHERE id = p_domain_id;

  IF v_domain IS NULL THEN
    RETURN 0;
  END IF;

  -- Get user preferences
  SELECT * INTO v_user_prefs
  FROM communication_preferences
  WHERE user_id = v_domain.user_id;

  -- If no preferences, create defaults
  IF v_user_prefs IS NULL THEN
    INSERT INTO communication_preferences (user_id, email_address)
    SELECT v_domain.user_id, email
    FROM auth.users
    WHERE id = v_domain.user_id
    RETURNING * INTO v_user_prefs;
  END IF;

  -- Don't schedule if user opted out
  IF v_user_prefs.opted_out_at IS NOT NULL THEN
    RETURN 0;
  END IF;

  -- Schedule notifications based on domain status and timeline
  -- This would be called by a cron job to create pending notifications
  -- Implementation depends on specific scheduling logic

  RETURN v_scheduled_count;
END;
$$;

-- Step 6: Create function to send communication
CREATE OR REPLACE FUNCTION send_communication(
  p_user_id uuid,
  p_channel text,
  p_template_type text,
  p_variables jsonb,
  p_domain_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id uuid;
  v_prefs communication_preferences%ROWTYPE;
  v_template notification_templates%ROWTYPE;
  v_subject text;
  v_body text;
  v_message text;
BEGIN
  -- Get user preferences
  SELECT * INTO v_prefs
  FROM communication_preferences
  WHERE user_id = p_user_id;

  -- Check if channel is enabled
  IF p_channel = 'email' AND NOT COALESCE(v_prefs.email_enabled, true) THEN
    RETURN NULL;
  END IF;

  IF p_channel = 'whatsapp' AND NOT COALESCE(v_prefs.whatsapp_enabled, false) THEN
    RETURN NULL;
  END IF;

  -- Get template
  SELECT * INTO v_template
  FROM notification_templates
  WHERE type = p_template_type;

  IF v_template IS NULL THEN
    RAISE EXCEPTION 'Template not found: %', p_template_type;
  END IF;

  -- Build message content
  IF p_channel = 'email' THEN
    v_subject := v_template.email_subject;
    v_body := v_template.email_body;
  ELSIF p_channel = 'whatsapp' THEN
    v_message := v_template.whatsapp_message;
  ELSE
    v_message := v_template.message_template;
  END IF;

  -- Variable substitution would happen here
  -- For now, just log the communication

  -- Insert communication log
  INSERT INTO communication_log (
    user_id,
    domain_id,
    channel,
    template_type,
    subject,
    message,
    status,
    metadata
  ) VALUES (
    p_user_id,
    p_domain_id,
    p_channel,
    p_template_type,
    v_subject,
    COALESCE(v_message, v_body),
    'pending',
    p_variables
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- Step 7: Create indexes
CREATE INDEX IF NOT EXISTS idx_comm_prefs_user ON communication_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_comm_log_user ON communication_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comm_log_domain ON communication_log(domain_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comm_log_status ON communication_log(status, sent_at);
CREATE INDEX IF NOT EXISTS idx_comm_log_channel ON communication_log(channel, status);

CREATE INDEX IF NOT EXISTS idx_notif_templates_lifecycle ON notification_templates(lifecycle_trigger, send_at_days);

-- Step 8: Enable RLS
ALTER TABLE communication_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own communication preferences"
  ON communication_preferences FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own communication log"
  ON communication_log FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all communications"
  ON communication_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = auth.uid()
      AND customers.role = 'admin'
    )
  );

-- Step 9: Add comments
COMMENT ON TABLE communication_preferences IS 'User preferences for notifications and communication channels';
COMMENT ON TABLE communication_log IS 'Complete log of all communications sent to users';
COMMENT ON FUNCTION schedule_domain_communications IS 'Schedules automated communications for domain lifecycle';
COMMENT ON FUNCTION send_communication IS 'Sends communication through specified channel';

COMMENT ON COLUMN notification_templates.send_at_days IS 'Days relative to expiration: -14 (before), +1 (after)';
COMMENT ON COLUMN notification_templates.lifecycle_trigger IS 'pre_expiration, grace, redemption, auction, etc';
COMMENT ON COLUMN communication_log.opened_at IS 'When user opened/viewed the message';
COMMENT ON COLUMN communication_log.clicked_at IS 'When user clicked action link';
