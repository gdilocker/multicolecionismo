/*
  # Sistema de Suporte e Base de Conhecimento

  ## 1. Nova Tabela: support_articles
    Artigos da base de conhecimento com busca e categorização
    - `id` (uuid, primary key)
    - `slug` (text, unique - URL amigável)
    - `title` (text - título do artigo)
    - `description` (text - resumo curto)
    - `content` (text - conteúdo completo em markdown)
    - `category` (text - Domínios, E-mails, Faturamento, Suporte)
    - `view_count` (integer - contador de visualizações)
    - `is_popular` (boolean - destacar como popular)
    - `is_published` (boolean - controle de publicação)
    - `meta_title` (text - SEO)
    - `meta_description` (text - SEO)
    - `created_at`, `updated_at`

  ## 2. Nova Tabela: support_tickets
    Sistema de chamados/tickets de suporte
    - `id` (uuid, primary key)
    - `ticket_number` (text, unique - número do ticket legível)
    - `customer_id` (uuid, FK para customers)
    - `email` (text - email de contato)
    - `name` (text - nome do solicitante)
    - `domain` (text - domínio relacionado, opcional)
    - `category` (text - Domínios, E-mails, Faturamento, Outro)
    - `subject` (text - assunto)
    - `description` (text - descrição do problema)
    - `status` (text - open, in_progress, resolved, closed)
    - `priority` (text - low, medium, high, urgent)
    - `attachments` (jsonb - array de URLs de anexos)
    - `created_at`, `updated_at`, `resolved_at`

  ## 3. Nova Tabela: ticket_messages
    Mensagens/respostas dentro de cada ticket
    - `id` (uuid, primary key)
    - `ticket_id` (uuid, FK para support_tickets)
    - `user_id` (uuid, FK para auth.users, nullable - pode ser staff)
    - `message` (text - conteúdo da mensagem)
    - `is_staff_reply` (boolean - true se resposta da equipe)
    - `attachments` (jsonb - array de URLs)
    - `created_at`

  ## 4. Segurança (RLS)
    - Artigos: leitura pública para artigos publicados
    - Tickets: usuários veem apenas seus próprios tickets
    - Mensagens: usuários veem apenas mensagens dos seus tickets
    - Staff (admin/reseller): pode ver todos os tickets

  ## 5. Índices
    - Busca full-text nos artigos (título + conteúdo)
    - Performance otimizada para queries frequentes
*/

-- 1. Criar tabela de artigos
CREATE TABLE IF NOT EXISTS support_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  content text NOT NULL,
  category text NOT NULL CHECK (category IN ('Domínios', 'E-mails', 'Faturamento', 'Suporte & Privacidade')),
  view_count integer DEFAULT 0,
  is_popular boolean DEFAULT false,
  is_published boolean DEFAULT true,
  meta_title text,
  meta_description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Criar tabela de tickets
CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number text UNIQUE NOT NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  email text NOT NULL,
  name text NOT NULL,
  domain text,
  category text NOT NULL CHECK (category IN ('Domínios', 'E-mails', 'Faturamento', 'Outro')),
  subject text NOT NULL,
  description text NOT NULL,
  status text DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  attachments jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

-- 3. Criar tabela de mensagens dos tickets
CREATE TABLE IF NOT EXISTS ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  message text NOT NULL,
  is_staff_reply boolean DEFAULT false,
  attachments jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- 4. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_articles_category ON support_articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_popular ON support_articles(is_popular) WHERE is_popular = true;
CREATE INDEX IF NOT EXISTS idx_articles_published ON support_articles(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_articles_slug ON support_articles(slug);

CREATE INDEX IF NOT EXISTS idx_tickets_customer ON support_tickets(customer_id);
CREATE INDEX IF NOT EXISTS idx_tickets_email ON support_tickets(email);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_number ON support_tickets(ticket_number);

CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket ON ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_user ON ticket_messages(user_id);

-- 5. Criar índice full-text para busca
CREATE INDEX IF NOT EXISTS idx_articles_search ON support_articles 
  USING gin(to_tsvector('portuguese', title || ' ' || description || ' ' || content));

-- 6. Habilitar RLS
ALTER TABLE support_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;

-- 7. Políticas RLS para artigos (leitura pública)
CREATE POLICY "Anyone can view published articles"
  ON support_articles FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins can manage articles"
  ON support_articles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers c
      WHERE c.user_id = auth.uid() AND c.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers c
      WHERE c.user_id = auth.uid() AND c.role = 'admin'
    )
  );

-- 8. Políticas RLS para tickets
CREATE POLICY "Users can view own tickets"
  ON support_tickets FOR SELECT
  TO authenticated
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR customer_id IN (
      SELECT id FROM customers WHERE user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM customers c
      WHERE c.user_id = auth.uid() AND c.role IN ('admin', 'reseller')
    )
  );

CREATE POLICY "Users can create tickets"
  ON support_tickets FOR INSERT
  TO authenticated
  WITH CHECK (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR customer_id IN (
      SELECT id FROM customers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own tickets"
  ON support_tickets FOR UPDATE
  TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM customers WHERE user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM customers c
      WHERE c.user_id = auth.uid() AND c.role IN ('admin', 'reseller')
    )
  )
  WITH CHECK (
    customer_id IN (
      SELECT id FROM customers WHERE user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM customers c
      WHERE c.user_id = auth.uid() AND c.role IN ('admin', 'reseller')
    )
  );

-- 9. Políticas RLS para mensagens dos tickets
CREATE POLICY "Users can view messages from own tickets"
  ON ticket_messages FOR SELECT
  TO authenticated
  USING (
    ticket_id IN (
      SELECT id FROM support_tickets
      WHERE customer_id IN (
        SELECT id FROM customers WHERE user_id = auth.uid()
      )
      OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM customers c
      WHERE c.user_id = auth.uid() AND c.role IN ('admin', 'reseller')
    )
  );

CREATE POLICY "Users can create messages in own tickets"
  ON ticket_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    ticket_id IN (
      SELECT id FROM support_tickets
      WHERE customer_id IN (
        SELECT id FROM customers WHERE user_id = auth.uid()
      )
    )
    OR EXISTS (
      SELECT 1 FROM customers c
      WHERE c.user_id = auth.uid() AND c.role IN ('admin', 'reseller')
    )
  );

-- 10. Função para gerar número de ticket
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS text AS $$
DECLARE
  new_number text;
  counter integer;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM 4) AS integer)), 0) + 1
  INTO counter
  FROM support_tickets;
  
  new_number := 'SUP' || LPAD(counter::text, 6, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- 11. Trigger para gerar ticket_number automaticamente
CREATE OR REPLACE FUNCTION set_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ticket_number IS NULL THEN
    NEW.ticket_number := generate_ticket_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_ticket_number
  BEFORE INSERT ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION set_ticket_number();

-- 12. Trigger para updated_at
CREATE OR REPLACE FUNCTION update_support_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER articles_updated_at
  BEFORE UPDATE ON support_articles
  FOR EACH ROW
  EXECUTE FUNCTION update_support_updated_at();

CREATE TRIGGER tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_support_updated_at();

-- 13. Função para incrementar view_count
CREATE OR REPLACE FUNCTION increment_article_views(article_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE support_articles
  SET view_count = view_count + 1
  WHERE id = article_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. Comentários explicativos
COMMENT ON TABLE support_articles IS 'Base de conhecimento com artigos de ajuda';
COMMENT ON TABLE support_tickets IS 'Sistema de tickets/chamados de suporte';
COMMENT ON TABLE ticket_messages IS 'Mensagens e respostas dentro dos tickets';
COMMENT ON COLUMN support_articles.slug IS 'URL amigável única para o artigo';
COMMENT ON COLUMN support_tickets.ticket_number IS 'Número único legível do ticket (ex: SUP000001)';
