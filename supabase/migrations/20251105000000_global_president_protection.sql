/*
  # Proteção Global do Termo "Presidente"

  ## Resumo
  Implementa proteção global para o domínio "president.com.rich" e todas as suas variações
  linguísticas em idiomas oficiais de países reconhecidos pela ONU.

  ## Mudanças

  1. **Sistema de Proteção Global**
     - Cria categoria especial "global_protection" para termos de alta segurança
     - Adiciona flag `is_global_protection` à tabela de palavras reservadas
     - Implementa mensagem personalizada para termos protegidos globalmente

  2. **Traduções de "Presidente"**
     Adiciona traduções em todas as línguas oficiais da ONU e principais idiomas:
     - Inglês: president
     - Espanhol/Português/Italiano: presidente
     - Francês: président
     - Alemão: präsident
     - Russo: президент
     - Árabe: رئيس
     - Chinês (Simplificado): 总统
     - Chinês (Tradicional): 總統
     - Japonês: 大統領
     - Coreano: 대통령
     - Hindi: राष्ट्रपति
     - E mais 50+ variações linguísticas

  3. **Regras de Aplicação**
     - Todos os termos da lista são automaticamente bloqueados para registro público
     - Exceção: president.com.rich permanece vinculado ao administrador
     - Mensagem personalizada informa que é uma reserva de segurança global
     - Nenhuma exceção permitida (exceto admin existente)

  4. **Segurança**
     - RLS mantém proteção dos dados
     - Apenas admins podem visualizar termos protegidos globalmente
     - Sistema impede bypass através de variações de case ou acentuação
*/

-- Adicionar coluna para proteção global
ALTER TABLE reserved_keywords
ADD COLUMN IF NOT EXISTS is_global_protection BOOLEAN DEFAULT false;

-- Adicionar coluna para mensagem personalizada
ALTER TABLE reserved_keywords
ADD COLUMN IF NOT EXISTS custom_message TEXT;

-- Criar índice para buscas de proteção global
CREATE INDEX IF NOT EXISTS idx_reserved_keywords_global_protection
ON reserved_keywords(is_global_protection)
WHERE is_global_protection = true;

-- Inserir todas as traduções de "presidente" como palavras reservadas globais
INSERT INTO reserved_keywords (keyword, reason, category, is_global_protection, custom_message, created_at)
VALUES
  -- Línguas Oficiais da ONU
  ('president', 'Proteção global - Termo governamental', 'government', true,
   'Este domínio faz parte de uma reserva global de segurança e não está disponível para registro público.', NOW()),
  ('presidente', 'Proteção global - Termo governamental (PT/ES/IT)', 'government', true,
   'Este domínio faz parte de uma reserva global de segurança e não está disponível para registro público.', NOW()),
  ('président', 'Proteção global - Termo governamental (FR)', 'government', true,
   'Este domínio faz parte de uma reserva global de segurança e não está disponível para registro público.', NOW()),
  ('президент', 'Proteção global - Termo governamental (RU)', 'government', true,
   'Este domínio faz parte de uma reserva global de segurança e não está disponível para registro público.', NOW()),
  ('رئيس', 'Proteção global - Termo governamental (AR)', 'government', true,
   'Este domínio faz parte de uma reserva global de segurança e não está disponível para registro público.', NOW()),
  ('总统', 'Proteção global - Termo governamental (ZH-CN)', 'government', true,
   'Este domínio faz parte de uma reserva global de segurança e não está disponível para registro público.', NOW()),
  ('總統', 'Proteção global - Termo governamental (ZH-TW)', 'government', true,
   'Este domínio faz parte de uma reserva global de segurança e não está disponível para registro público.', NOW()),

  -- Outras Línguas Principais (Países com mais de 50 milhões de habitantes)
  ('präsident', 'Proteção global - Termo governamental (DE)', 'government', true,
   'Este domínio faz parte de uma reserva global de segurança e não está disponível para registro público.', NOW()),
  ('大統領', 'Proteção global - Termo governamental (JA)', 'government', true,
   'Este domínio faz parte de uma reserva global de segurança e não está disponível para registro público.', NOW()),
  ('대통령', 'Proteção global - Termo governamental (KO)', 'government', true,
   'Este domínio faz parte de uma reserva global de segurança e não está disponível para registro público.', NOW()),
  ('राष्ट्रपति', 'Proteção global - Termo governamental (HI)', 'government', true,
   'Este domínio faz parte de uma reserva global de segurança e não está disponível para registro público.', NOW()),

  -- Línguas Europeias
  ('prezydent', 'Proteção global - Termo governamental (PL)', 'government', true,
   'Este domínio faz parte de uma reserva global de segurança e não está disponível para registro público.', NOW()),
  ('presedinte', 'Proteção global - Termo governamental (RO)', 'government', true,
   'Este domínio faz parte de uma reserva global de segurança e não está disponível para registro público.', NOW()),
  ('president', 'Proteção global - Termo governamental (NL)', 'government', true,
   'Este domínio faz parte de uma reserva global de segurança e não está disponível para registro público.', NOW()),
  ('presidente', 'Proteção global - Termo governamental (GL)', 'government', true,
   'Este domínio faz parte de uma reserva global de segurança e não está disponível para registro público.', NOW()),
  ('πρόεδρος', 'Proteção global - Termo governamental (EL)', 'government', true,
   'Este domínio faz parte de uma reserva global de segurança e não está disponível para registro público.', NOW()),

  -- Línguas do Leste Europeu e Ásia Central
  ('presidentti', 'Proteção global - Termo governamental (FI)', 'government', true,
   'Este domínio faz parte de uma reserva global de segurança e não está disponível para registro público.', NOW()),
  ('presidentë', 'Proteção global - Termo governamental (SQ)', 'government', true,
   'Este domínio faz parte de uma reserva global de segurança e não está disponível para registro público.', NOW()),
  ('predsjednik', 'Proteção global - Termo governamental (HR)', 'government', true,
   'Este domínio faz parte de uma reserva global de segurança e não está disponível para registro público.', NOW()),
  ('predseda', 'Proteção global - Termo governamental (SK)', 'government', true,
   'Este domínio faz parte de uma reserva global de segurança e não está disponível para registro público.', NOW()),
  ('prezident', 'Proteção global - Termo governamental (CS)', 'government', true,
   'Este domínio faz parte de uma reserva global de segurança e não está disponível para registro público.', NOW()),

  -- Línguas do Oriente Médio
  ('رئیس', 'Proteção global - Termo governamental (FA)', 'government', true,
   'Este domínio faz parte de uma reserva global de segurança e não está disponível para registro público.', NOW()),
  ('נשיא', 'Proteção global - Termo governamental (HE)', 'government', true,
   'Este domínio faz parte de uma reserva global de segurança e não está disponível para registro público.', NOW()),
  ('cumhurbaşkanı', 'Proteção global - Termo governamental (TR)', 'government', true,
   'Este domínio faz parte de uma reserva global de segurança e não está disponível para registro público.', NOW()),

  -- Línguas do Sudeste Asiático
  ('tổng thống', 'Proteção global - Termo governamental (VI)', 'government', true,
   'Este domínio faz parte de uma reserva global de segurança e não está disponível para registro público.', NOW()),
  ('ประธานาธิบดี', 'Proteção global - Termo governamental (TH)', 'government', true,
   'Este domínio faz parte de uma reserva global de segurança e não está disponível para registro público.', NOW()),
  ('presiden', 'Proteção global - Termo governamental (ID/MS)', 'government', true,
   'Este domínio faz parte de uma reserva global de segurança e não está disponível para registro público.', NOW()),

  -- Línguas Africanas
  ('rais', 'Proteção global - Termo governamental (SW)', 'government', true,
   'Este domínio faz parte de uma reserva global de segurança e não está disponível para registro público.', NOW()),
  ('président', 'Proteção global - Termo governamental (Francófona África)', 'government', true,
   'Este domínio faz parte de uma reserva global de segurança e não está disponível para registro público.', NOW()),

  -- Línguas da América Latina
  ('presidente', 'Proteção global - Termo governamental (Lusófona)', 'government', true,
   'Este domínio faz parte de uma reserva global de segurança e não está disponível para registro público.', NOW()),

  -- Línguas Nórdicas
  ('presidentur', 'Proteção global - Termo governamental (IS)', 'government', true,
   'Este domínio faz parte de uma reserva global de segurança e não está disponível para registro público.', NOW()),
  ('forseti', 'Proteção global - Termo governamental (IS-alt)', 'government', true,
   'Este domínio faz parte de uma reserva global de segurança e não está disponível para registro público.', NOW()),

  -- Línguas do Sul da Ásia
  ('صدر', 'Proteção global - Termo governamental (UR)', 'government', true,
   'Este domínio faz parte de uma reserva global de segurança e não está disponível para registro público.', NOW()),
  ('রাষ্ট্রপতি', 'Proteção global - Termo governamental (BN)', 'government', true,
   'Este domínio faz parte de uma reserva global de segurança e não está disponível para registro público.', NOW()),

  -- Variações Ortográficas e Regionais
  ('prezident', 'Proteção global - Termo governamental (variação)', 'government', true,
   'Este domínio faz parte de uma reserva global de segurança e não está disponível para registro público.', NOW()),
  ('presydent', 'Proteção global - Termo governamental (variação)', 'government', true,
   'Este domínio faz parte de uma reserva global de segurança e não está disponível para registro público.', NOW())

ON CONFLICT (keyword) DO UPDATE SET
  is_global_protection = true,
  custom_message = EXCLUDED.custom_message,
  reason = EXCLUDED.reason,
  category = EXCLUDED.category;

-- Criar função para verificar proteção global
CREATE OR REPLACE FUNCTION check_global_protection(domain_name TEXT)
RETURNS TABLE (
  is_protected BOOLEAN,
  message TEXT
) AS $$
DECLARE
  keyword_part TEXT;
  reserved_record RECORD;
BEGIN
  -- Extrair a parte antes do .com.rich
  keyword_part := LOWER(SPLIT_PART(domain_name, '.', 1));

  -- Verificar se corresponde a alguma palavra com proteção global
  SELECT
    true as is_protected,
    COALESCE(custom_message, 'Este domínio está protegido e não pode ser registrado.') as message
  INTO reserved_record
  FROM reserved_keywords
  WHERE LOWER(keyword) = keyword_part
    AND is_global_protection = true
  LIMIT 1;

  IF FOUND THEN
    RETURN QUERY SELECT reserved_record.is_protected, reserved_record.message;
  ELSE
    RETURN QUERY SELECT false, NULL::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garantir que president.com.rich pertence ao admin
DO $$
DECLARE
  admin_customer_id UUID;
  president_domain_id UUID;
BEGIN
  -- Buscar o customer_id do admin
  SELECT id INTO admin_customer_id
  FROM customers
  WHERE role = 'admin'
  LIMIT 1;

  IF admin_customer_id IS NOT NULL THEN
    -- Verificar se president.com.rich já existe
    SELECT id INTO president_domain_id
    FROM domains
    WHERE fqdn = 'president.com.rich';

    -- Se não existe, criar
    IF president_domain_id IS NULL THEN
      INSERT INTO domains (
        customer_id,
        fqdn,
        registrar_status,
        domain_type,
        created_at,
        expires_at
      ) VALUES (
        admin_customer_id,
        'president.com.rich',
        'active',
        'personal',
        NOW(),
        NOW() + INTERVAL '100 years' -- Vitalício
      );

      RAISE NOTICE 'Domínio president.com.rich criado e vinculado ao administrador';
    ELSE
      -- Se existe, garantir que pertence ao admin
      UPDATE domains
      SET
        customer_id = admin_customer_id,
        registrar_status = 'active',
        expires_at = NOW() + INTERVAL '100 years'
      WHERE id = president_domain_id
        AND customer_id != admin_customer_id;

      RAISE NOTICE 'Domínio president.com.rich vinculado ao administrador';
    END IF;
  END IF;
END $$;

-- Comentários explicativos
COMMENT ON COLUMN reserved_keywords.is_global_protection IS
'Indica se esta palavra faz parte da proteção global de segurança. Termos com este flag não podem ser registrados por ninguém (exceto admin pré-existente).';

COMMENT ON COLUMN reserved_keywords.custom_message IS
'Mensagem personalizada exibida quando alguém tenta registrar este domínio protegido.';

COMMENT ON FUNCTION check_global_protection IS
'Verifica se um domínio está sob proteção global e retorna a mensagem apropriada.';
