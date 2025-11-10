/*
  # Sistema de Palavras Reservadas/Protegidas

  1. Nova Tabela
    - `reserved_keywords`
      - `id` (uuid, primary key)
      - `keyword` (text, unique) - Palavra reservada
      - `reason` (text) - Motivo da reserva
      - `category` (text) - Categoria: brand, legal, trademark, generic
      - `severity` (text) - Gravidade: critical, high, medium
      - `allow_with_suffix` (boolean) - Permite uso com sufixo (ex: premium123)
      - `created_at` (timestamp)

  2. Segurança
    - Enable RLS
    - Admins podem gerenciar
    - Todos podem visualizar para validação

  3. Dados Iniciais
    - Palavras da marca (com.rich, comrich, etc)
    - Palavras legais (admin, root, system, etc)
    - Marcas registradas comuns
    - Termos genéricos protegidos
    - Termos sensíveis/proibidos

  4. Validação Automática
    - Trigger para validar domínios premium
    - Função para verificar palavras reservadas
*/

-- Criar tabela de palavras reservadas
CREATE TABLE IF NOT EXISTS reserved_keywords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword text NOT NULL UNIQUE,
  reason text NOT NULL,
  category text NOT NULL CHECK (category IN ('brand', 'legal', 'trademark', 'generic', 'sensitive')),
  severity text DEFAULT 'high' CHECK (severity IN ('critical', 'high', 'medium')),
  allow_with_suffix boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_reserved_keywords_keyword ON reserved_keywords(keyword);
CREATE INDEX IF NOT EXISTS idx_reserved_keywords_category ON reserved_keywords(category);
CREATE INDEX IF NOT EXISTS idx_reserved_keywords_severity ON reserved_keywords(severity);

-- Enable RLS
ALTER TABLE reserved_keywords ENABLE ROW LEVEL SECURITY;

-- Admins podem gerenciar
CREATE POLICY "Admins can manage reserved keywords"
  ON reserved_keywords
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = auth.uid()
      AND customers.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = auth.uid()
      AND customers.role = 'admin'
    )
  );

-- Todos podem visualizar (para validação de domínios)
CREATE POLICY "Everyone can view reserved keywords"
  ON reserved_keywords
  FOR SELECT
  TO public
  USING (true);

-- Inserir palavras da marca (CRÍTICAS)
INSERT INTO reserved_keywords (keyword, reason, category, severity, allow_with_suffix) VALUES
('comrich', 'Marca registrada da empresa', 'brand', 'critical', false),
('com-rich', 'Variação da marca', 'brand', 'critical', false),
('com.rich', 'Nome completo da marca', 'brand', 'critical', false),
('rich', 'Parte da marca', 'brand', 'critical', true),
('premium', 'Palavra reservada para produtos premium internos', 'brand', 'critical', false),
('elite', 'Palavra reservada para plano Elite', 'brand', 'high', false),
('standard', 'Palavra reservada para plano Standard', 'brand', 'high', false)
ON CONFLICT (keyword) DO NOTHING;

-- Inserir palavras legais/sistema (CRÍTICAS)
INSERT INTO reserved_keywords (keyword, reason, category, severity, allow_with_suffix) VALUES
('admin', 'Termo administrativo reservado', 'legal', 'critical', false),
('administrator', 'Termo administrativo reservado', 'legal', 'critical', false),
('root', 'Termo de sistema reservado', 'legal', 'critical', false),
('system', 'Termo de sistema reservado', 'legal', 'critical', false),
('moderator', 'Termo de moderação reservado', 'legal', 'critical', false),
('support', 'Termo de suporte oficial', 'legal', 'critical', false),
('help', 'Termo de ajuda oficial', 'legal', 'high', false),
('webmaster', 'Termo técnico reservado', 'legal', 'high', false),
('hostmaster', 'Termo técnico reservado', 'legal', 'high', false),
('postmaster', 'Termo técnico reservado RFC 2142', 'legal', 'critical', false),
('abuse', 'Termo técnico reservado RFC 2142', 'legal', 'critical', false),
('security', 'Termo de segurança reservado', 'legal', 'critical', false),
('noc', 'Network Operations Center', 'legal', 'high', false),
('info', 'Endereço informativo padrão', 'legal', 'medium', true),
('contact', 'Endereço de contato padrão', 'legal', 'medium', true),
('sales', 'Termo comercial genérico', 'legal', 'medium', true),
('billing', 'Termo financeiro genérico', 'legal', 'medium', true)
ON CONFLICT (keyword) DO NOTHING;

-- Inserir marcas registradas comuns (ALTAS)
INSERT INTO reserved_keywords (keyword, reason, category, severity, allow_with_suffix) VALUES
('google', 'Marca registrada', 'trademark', 'high', false),
('facebook', 'Marca registrada', 'trademark', 'high', false),
('microsoft', 'Marca registrada', 'trademark', 'high', false),
('apple', 'Marca registrada', 'trademark', 'high', false),
('amazon', 'Marca registrada', 'trademark', 'high', false),
('paypal', 'Marca registrada', 'trademark', 'high', false),
('visa', 'Marca registrada', 'trademark', 'high', false),
('mastercard', 'Marca registrada', 'trademark', 'high', false),
('netflix', 'Marca registrada', 'trademark', 'high', false),
('youtube', 'Marca registrada', 'trademark', 'high', false),
('twitter', 'Marca registrada', 'trademark', 'high', false),
('instagram', 'Marca registrada', 'trademark', 'high', false),
('whatsapp', 'Marca registrada', 'trademark', 'high', false),
('uber', 'Marca registrada', 'trademark', 'high', false),
('airbnb', 'Marca registrada', 'trademark', 'high', false)
ON CONFLICT (keyword) DO NOTHING;

-- Inserir termos genéricos protegidos (MÉDIOS)
INSERT INTO reserved_keywords (keyword, reason, category, severity, allow_with_suffix) VALUES
('email', 'Termo genérico da extensão', 'generic', 'high', true),
('mail', 'Termo genérico de email', 'generic', 'high', true),
('domain', 'Termo genérico de domínio', 'generic', 'medium', true),
('hosting', 'Termo genérico de hospedagem', 'generic', 'medium', true),
('server', 'Termo genérico técnico', 'generic', 'medium', true),
('cloud', 'Termo genérico técnico', 'generic', 'medium', true),
('api', 'Termo técnico', 'generic', 'medium', true),
('app', 'Termo genérico', 'generic', 'medium', true),
('web', 'Termo genérico', 'generic', 'medium', true),
('site', 'Termo genérico', 'generic', 'medium', true),
('shop', 'Termo comercial genérico', 'generic', 'medium', true),
('store', 'Termo comercial genérico', 'generic', 'medium', true),
('market', 'Termo comercial genérico', 'generic', 'medium', true),
('buy', 'Termo comercial', 'generic', 'medium', true),
('sell', 'Termo comercial', 'generic', 'medium', true)
ON CONFLICT (keyword) DO NOTHING;

-- Inserir termos sensíveis (CRÍTICOS)
INSERT INTO reserved_keywords (keyword, reason, category, severity, allow_with_suffix) VALUES
('porn', 'Conteúdo adulto', 'sensitive', 'critical', false),
('sex', 'Conteúdo adulto', 'sensitive', 'critical', false),
('xxx', 'Conteúdo adulto', 'sensitive', 'critical', false),
('adult', 'Conteúdo adulto', 'sensitive', 'critical', false),
('casino', 'Jogo online', 'sensitive', 'critical', false),
('gambling', 'Jogo online', 'sensitive', 'critical', false),
('bet', 'Apostas', 'sensitive', 'critical', false),
('drug', 'Substâncias controladas', 'sensitive', 'critical', false),
('drugs', 'Substâncias controladas', 'sensitive', 'critical', false),
('weed', 'Substâncias controladas', 'sensitive', 'critical', false),
('cannabis', 'Substâncias controladas', 'sensitive', 'critical', false),
('hack', 'Atividade ilegal', 'sensitive', 'critical', false),
('hacker', 'Atividade ilegal', 'sensitive', 'critical', false),
('crack', 'Atividade ilegal', 'sensitive', 'critical', false),
('pirate', 'Atividade ilegal', 'sensitive', 'critical', false),
('torrent', 'Potencial pirataria', 'sensitive', 'high', false),
('fraud', 'Fraude', 'sensitive', 'critical', false),
('scam', 'Golpe', 'sensitive', 'critical', false),
('phishing', 'Ataque cibernético', 'sensitive', 'critical', false),
('spam', 'Spam', 'sensitive', 'critical', false)
ON CONFLICT (keyword) DO NOTHING;

-- Função para verificar se um domínio contém palavras reservadas
CREATE OR REPLACE FUNCTION check_reserved_keyword(domain_text text)
RETURNS TABLE(
  is_reserved boolean,
  keyword text,
  reason text,
  severity text,
  allow_with_suffix boolean
) AS $$
DECLARE
  clean_domain text;
BEGIN
  -- Extrair apenas o nome do domínio (remover .com.rich se existir)
  clean_domain := lower(trim(regexp_replace(domain_text, '\.(com\.rich|email)$', '', 'i')));
  
  RETURN QUERY
  SELECT 
    true as is_reserved,
    rk.keyword,
    rk.reason,
    rk.severity,
    rk.allow_with_suffix
  FROM reserved_keywords rk
  WHERE 
    -- Verifica correspondência exata
    clean_domain = rk.keyword
    OR
    -- Se não permite sufixo, verifica se começa com a palavra
    (rk.allow_with_suffix = false AND clean_domain LIKE rk.keyword || '%')
  ORDER BY 
    CASE rk.severity
      WHEN 'critical' THEN 1
      WHEN 'high' THEN 2
      WHEN 'medium' THEN 3
    END
  LIMIT 1;
  
  -- Se não encontrou nada, retorna que não é reservado
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, null::text, null::text, null::text, null::boolean;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para validar domínios premium antes de inserir
CREATE OR REPLACE FUNCTION validate_premium_domain_keyword()
RETURNS TRIGGER AS $$
DECLARE
  check_result RECORD;
BEGIN
  -- Verificar se o domínio contém palavra reservada
  SELECT * INTO check_result
  FROM check_reserved_keyword(NEW.fqdn);
  
  IF check_result.is_reserved THEN
    RAISE EXCEPTION 'Domínio contém palavra reservada: "%" (%). Gravidade: %', 
      check_result.keyword, 
      check_result.reason,
      check_result.severity;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger na tabela premium_domains
DROP TRIGGER IF EXISTS validate_premium_domain_before_insert ON premium_domains;
CREATE TRIGGER validate_premium_domain_before_insert
  BEFORE INSERT ON premium_domains
  FOR EACH ROW
  EXECUTE FUNCTION validate_premium_domain_keyword();

DROP TRIGGER IF EXISTS validate_premium_domain_before_update ON premium_domains;
CREATE TRIGGER validate_premium_domain_before_update
  BEFORE UPDATE OF fqdn ON premium_domains
  FOR EACH ROW
  EXECUTE FUNCTION validate_premium_domain_keyword();
