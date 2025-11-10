/*
  # Sistema Completo de Emails

  ## Descrição
  Sistema completo de templates e gerenciamento de emails para TheRichClub

  ## Tabelas Criadas
  
  ### `email_templates`
  - `id` - UUID primary key
  - `template_key` - Identificador único (ex: welcome_email, trial_expiring)
  - `subject` - Assunto do email (suporta variáveis)
  - `html_content` - Conteúdo HTML do email
  - `text_content` - Conteúdo texto puro (fallback)
  - `variables` - JSONB com variáveis disponíveis
  - `category` - Categoria (transactional, marketing, support)
  - `is_active` - Se o template está ativo
  - `created_at`, `updated_at`

  ### `email_logs`
  - `id` - UUID primary key
  - `recipient_email` - Email do destinatário
  - `template_key` - Template utilizado
  - `subject` - Assunto enviado
  - `status` - Status (sent, failed, bounced)
  - `provider_id` - ID do provedor (Resend)
  - `provider_response` - Resposta do provedor
  - `error_message` - Mensagem de erro (se houver)
  - `sent_at` - Timestamp do envio
  - `opened_at` - Timestamp da abertura
  - `clicked_at` - Timestamp do clique

  ## Segurança
  - RLS habilitado
  - Apenas admins podem gerenciar templates
  - Logs públicos apenas para próprio email
*/

-- Criar tabela de templates
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT UNIQUE NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  variables JSONB DEFAULT '[]'::jsonb,
  category TEXT NOT NULL CHECK (category IN ('transactional', 'marketing', 'support', 'system')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Criar tabela de logs
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email TEXT NOT NULL,
  template_key TEXT,
  subject TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'bounced', 'delivered', 'opened', 'clicked')),
  provider_id TEXT,
  provider_response JSONB,
  error_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT now(),
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_templates_key ON email_templates(template_key);
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at DESC);

-- RLS
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Policies: Templates (apenas admins)
CREATE POLICY "Admins manage templates"
  ON email_templates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = auth.uid()
      AND customers.role = 'admin'
    )
  );

-- Policies: Logs (admins veem tudo, users veem próprio email)
CREATE POLICY "Users view own email logs"
  ON email_logs FOR SELECT
  TO authenticated
  USING (
    recipient_email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = auth.uid()
      AND customers.role = 'admin'
    )
  );

CREATE POLICY "System insert email logs"
  ON email_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_email_template_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_email_template_updated_at();
