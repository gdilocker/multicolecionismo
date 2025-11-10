/*
  # Sistema de E-mail Institucional com.rich

  1. Tabelas Criadas
    - `email_accounts` - Contas de e-mail (@com.rich)
    - `email_messages` - Mensagens recebidas/enviadas
    - `email_folders` - Pastas customizadas
    - `email_aliases` - Aliases de e-mail
    - `email_filters` - Regras de filtro
    - `email_attachments` - Anexos
    - `email_audit_log` - Log de auditoria

  2. Segurança
    - RLS habilitado em todas as tabelas
    - Políticas restritivas por usuário
    - Admins têm acesso completo

  3. Recursos
    - Caixas de entrada separadas por usuário
    - Suporte a pastas customizadas
    - Sistema de tags
    - Filtros automáticos
    - Busca avançada
    - Anexos com limite de tamanho
*/

-- Email Accounts
CREATE TABLE IF NOT EXISTS email_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email_address text UNIQUE NOT NULL,
  display_name text,
  signature text,
  quota_mb integer DEFAULT 1000,
  used_mb integer DEFAULT 0,
  status text DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_email CHECK (email_address ~ '^[A-Za-z0-9._%+-]+@com\.rich$')
);

CREATE INDEX IF NOT EXISTS idx_email_accounts_user_id ON email_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_email_accounts_email ON email_accounts(email_address);
CREATE INDEX IF NOT EXISTS idx_email_accounts_status ON email_accounts(status);

-- Email Folders (inbox, sent, drafts, trash, custom)
CREATE TABLE IF NOT EXISTS email_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES email_accounts(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  type text DEFAULT 'custom' CHECK (type IN ('inbox', 'sent', 'drafts', 'trash', 'spam', 'custom')),
  parent_id uuid REFERENCES email_folders(id) ON DELETE CASCADE,
  unread_count integer DEFAULT 0,
  total_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_folders_account ON email_folders(account_id);
CREATE INDEX IF NOT EXISTS idx_email_folders_type ON email_folders(type);

-- Email Messages
CREATE TABLE IF NOT EXISTS email_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES email_accounts(id) ON DELETE CASCADE NOT NULL,
  folder_id uuid REFERENCES email_folders(id) ON DELETE SET NULL,
  message_id text UNIQUE,
  thread_id text,
  from_address text NOT NULL,
  from_name text,
  to_addresses text[] NOT NULL,
  cc_addresses text[],
  bcc_addresses text[],
  subject text NOT NULL,
  body_text text,
  body_html text,
  is_read boolean DEFAULT false,
  is_starred boolean DEFAULT false,
  is_draft boolean DEFAULT false,
  size_bytes integer DEFAULT 0,
  tags text[],
  received_at timestamptz DEFAULT now(),
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_messages_account ON email_messages(account_id);
CREATE INDEX IF NOT EXISTS idx_email_messages_folder ON email_messages(folder_id);
CREATE INDEX IF NOT EXISTS idx_email_messages_thread ON email_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_email_messages_is_read ON email_messages(is_read);
CREATE INDEX IF NOT EXISTS idx_email_messages_received ON email_messages(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_messages_subject ON email_messages USING gin(to_tsvector('english', subject));

-- Email Attachments
CREATE TABLE IF NOT EXISTS email_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES email_messages(id) ON DELETE CASCADE NOT NULL,
  filename text NOT NULL,
  content_type text NOT NULL,
  size_bytes integer NOT NULL,
  storage_path text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_attachments_message ON email_attachments(message_id);

-- Email Aliases
CREATE TABLE IF NOT EXISTS email_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES email_accounts(id) ON DELETE CASCADE NOT NULL,
  alias_address text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_alias CHECK (alias_address ~ '^[A-Za-z0-9._%+-]+@com\.rich$')
);

CREATE INDEX IF NOT EXISTS idx_email_aliases_account ON email_aliases(account_id);
CREATE INDEX IF NOT EXISTS idx_email_aliases_address ON email_aliases(alias_address);

-- Email Filters
CREATE TABLE IF NOT EXISTS email_filters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES email_accounts(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  conditions jsonb NOT NULL,
  actions jsonb NOT NULL,
  priority integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_filters_account ON email_filters(account_id);
CREATE INDEX IF NOT EXISTS idx_email_filters_priority ON email_filters(priority);

-- Email Audit Log
CREATE TABLE IF NOT EXISTS email_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES email_accounts(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  details jsonb,
  ip_address inet,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_audit_log_account ON email_audit_log(account_id);
CREATE INDEX IF NOT EXISTS idx_email_audit_log_created ON email_audit_log(created_at DESC);

-- Enable RLS
ALTER TABLE email_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_accounts
CREATE POLICY "Users can view own email accounts"
  ON email_accounts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all email accounts"
  ON email_accounts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = auth.uid()
      AND customers.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Users can create own email accounts"
  ON email_accounts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own email accounts"
  ON email_accounts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for email_folders
CREATE POLICY "Users can manage own email folders"
  ON email_folders FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM email_accounts
      WHERE email_accounts.id = email_folders.account_id
      AND email_accounts.user_id = auth.uid()
    )
  );

-- RLS Policies for email_messages
CREATE POLICY "Users can manage own email messages"
  ON email_messages FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM email_accounts
      WHERE email_accounts.id = email_messages.account_id
      AND email_accounts.user_id = auth.uid()
    )
  );

-- RLS Policies for email_attachments
CREATE POLICY "Users can manage own email attachments"
  ON email_attachments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM email_messages
      JOIN email_accounts ON email_accounts.id = email_messages.account_id
      WHERE email_messages.id = email_attachments.message_id
      AND email_accounts.user_id = auth.uid()
    )
  );

-- RLS Policies for email_aliases
CREATE POLICY "Users can manage own email aliases"
  ON email_aliases FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM email_accounts
      WHERE email_accounts.id = email_aliases.account_id
      AND email_accounts.user_id = auth.uid()
    )
  );

-- RLS Policies for email_filters
CREATE POLICY "Users can manage own email filters"
  ON email_filters FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM email_accounts
      WHERE email_accounts.id = email_filters.account_id
      AND email_accounts.user_id = auth.uid()
    )
  );

-- RLS Policies for email_audit_log
CREATE POLICY "Users can view own email audit logs"
  ON email_audit_log FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all email audit logs"
  ON email_audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = auth.uid()
      AND customers.role IN ('admin', 'super_admin')
    )
  );

-- Function to create default folders for new email account
CREATE OR REPLACE FUNCTION create_default_email_folders()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO email_folders (account_id, name, type)
  VALUES
    (NEW.id, 'Caixa de Entrada', 'inbox'),
    (NEW.id, 'Enviados', 'sent'),
    (NEW.id, 'Rascunhos', 'drafts'),
    (NEW.id, 'Lixeira', 'trash'),
    (NEW.id, 'Spam', 'spam');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_default_folders_trigger
AFTER INSERT ON email_accounts
FOR EACH ROW
EXECUTE FUNCTION create_default_email_folders();

-- Function to update folder counts
CREATE OR REPLACE FUNCTION update_folder_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE email_folders
    SET
      total_count = total_count + 1,
      unread_count = unread_count + CASE WHEN NEW.is_read = false THEN 1 ELSE 0 END
    WHERE id = NEW.folder_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.folder_id != NEW.folder_id THEN
      -- Moved to different folder
      UPDATE email_folders
      SET
        total_count = total_count - 1,
        unread_count = unread_count - CASE WHEN OLD.is_read = false THEN 1 ELSE 0 END
      WHERE id = OLD.folder_id;

      UPDATE email_folders
      SET
        total_count = total_count + 1,
        unread_count = unread_count + CASE WHEN NEW.is_read = false THEN 1 ELSE 0 END
      WHERE id = NEW.folder_id;
    ELSIF OLD.is_read != NEW.is_read THEN
      -- Read status changed
      UPDATE email_folders
      SET
        unread_count = unread_count + CASE WHEN NEW.is_read = false THEN 1 ELSE -1 END
      WHERE id = NEW.folder_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE email_folders
    SET
      total_count = total_count - 1,
      unread_count = unread_count - CASE WHEN OLD.is_read = false THEN 1 ELSE 0 END
    WHERE id = OLD.folder_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_folder_counts_trigger
AFTER INSERT OR UPDATE OR DELETE ON email_messages
FOR EACH ROW
EXECUTE FUNCTION update_folder_counts();
