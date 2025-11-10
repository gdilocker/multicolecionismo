/*
  # Adicionar Proteção para Links do Sistema

  1. Alterações
    - Adiciona coluna `is_system_link` na tabela `profile_links`
    - Links do sistema não podem ser excluídos pelos usuários
    - Apenas admin pode criar/modificar links do sistema
  
  2. Segurança
    - RLS policy atualizada para proteger links do sistema
    - Links do sistema são visíveis mas não editáveis/deletáveis por usuários comuns
*/

-- Add is_system_link column to profile_links
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profile_links' AND column_name = 'is_system_link'
  ) THEN
    ALTER TABLE profile_links ADD COLUMN is_system_link boolean DEFAULT false;
  END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profile_links_system ON profile_links(is_system_link);

-- Drop existing policies to recreate them with system link protection
DROP POLICY IF EXISTS "Users can delete own profile links" ON profile_links;

-- Updated delete policy: users cannot delete system links
CREATE POLICY "Users can delete own non-system profile links"
  ON profile_links FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = profile_links.profile_id
      AND user_profiles.user_id = auth.uid()
    )
    AND is_system_link = false
  );

-- Updated update policy: users cannot modify system links
DROP POLICY IF EXISTS "Users can update own profile links" ON profile_links;

CREATE POLICY "Users can update own non-system profile links"
  ON profile_links FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = profile_links.profile_id
      AND user_profiles.user_id = auth.uid()
    )
    AND is_system_link = false
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = profile_links.profile_id
      AND user_profiles.user_id = auth.uid()
    )
    AND is_system_link = false
  );

-- Admin can do anything with system links
CREATE POLICY "Admins can manage all system links"
  ON profile_links FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = auth.uid()
      AND customers.role = 'admin'
    )
  );
