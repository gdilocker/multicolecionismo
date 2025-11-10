/*
  # Remove Profile Links System

  Remove completamente o sistema de Links Personalizados do banco de dados.

  ## Mudanças

  1. Remove a tabela profile_links
  2. Remove colunas relacionadas a links em outras tabelas
  3. Remove funções e triggers relacionados
  4. Remove políticas RLS de links

  ## Detalhes

  - Remove tabela profile_links e todas suas políticas
  - Remove colunas de configuração de links em user_profiles
  - Remove índices relacionados
*/

-- Drop table profile_links if exists
DROP TABLE IF EXISTS profile_links CASCADE;

-- Remove link-related columns from user_profiles
DO $$
BEGIN
  -- Remove link color columns
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'link_color') THEN
    ALTER TABLE user_profiles DROP COLUMN link_color;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'link_color_opacity') THEN
    ALTER TABLE user_profiles DROP COLUMN link_color_opacity;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'button_text_color') THEN
    ALTER TABLE user_profiles DROP COLUMN button_text_color;
  END IF;
END $$;
