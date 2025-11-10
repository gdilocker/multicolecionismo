/*
  # Remover Sistema de Email Completamente

  1. Tabelas Removidas
    - `aliases` - Aliases de email
    - `mailboxes` - Caixas de email
    - `mail_domains` - Domínios de email

  2. Colunas Removidas
    - `domains.dkim_selector`
    - `domains.dkim_public`

  3. Notas
    - Sistema de email foi desativado na migration 20251019210039
    - Esta migration remove completamente a estrutura do banco
    - Funcionalidade de email não será mais suportada
*/

-- Drop tables in correct order (respecting foreign keys)
DROP TABLE IF EXISTS aliases CASCADE;
DROP TABLE IF EXISTS mailboxes CASCADE;
DROP TABLE IF EXISTS mail_domains CASCADE;

-- Remove email-related columns from domains
ALTER TABLE domains DROP COLUMN IF EXISTS dkim_selector;
ALTER TABLE domains DROP COLUMN IF EXISTS dkim_public;
