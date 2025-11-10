/*
  # Consolidar Sistema de Temas de Perfil

  1. Mudanças
    - Remove tabela `profile_themes` (duplicada)
    - Move configurações de tema para `user_profiles`
    - Mantém `profile_theme_templates` para templates pré-definidos
    - Mantém `profile_applied_templates` para histórico

  2. Notas
    - Tabela profile_themes foi criada em múltiplas migrations
    - Consolidando tudo em user_profiles para simplificar
    - Links já têm suas próprias configurações de estilo
*/

-- Adicionar colunas de tema ao user_profiles se não existirem
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS theme_template_id uuid REFERENCES profile_theme_templates(id);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS background_color text DEFAULT '#000000';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS background_gradient text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS text_color text DEFAULT '#ffffff';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS link_color text DEFAULT '#3b82f6';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS link_hover_color text DEFAULT '#2563eb';

-- Migrar dados existentes de profile_themes para user_profiles (se existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profile_themes') THEN
    UPDATE user_profiles up
    SET
      background_color = COALESCE(pt.background_color, up.background_color),
      background_gradient = pt.background_gradient,
      text_color = COALESCE(pt.text_color, up.text_color),
      link_color = COALESCE(pt.link_color, up.link_color)
    FROM profile_themes pt
    WHERE up.id = pt.profile_id;
  END IF;
END $$;

-- Dropar tabela profile_themes se existir
DROP TABLE IF EXISTS profile_themes CASCADE;
