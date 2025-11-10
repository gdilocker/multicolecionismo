/*
  # Fix social_posts.is_active column

  ## Problema
  A coluna is_active pode estar faltando na tabela social_posts

  ## Solução
  1. Adicionar coluna is_active se não existir
  2. Recriar índice
  3. Atualizar posts existentes para is_active = true
*/

-- Adicionar coluna is_active se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'social_posts'
    AND column_name = 'is_active'
  ) THEN
    ALTER TABLE social_posts
    ADD COLUMN is_active boolean DEFAULT true;

    -- Atualizar posts existentes
    UPDATE social_posts SET is_active = true WHERE is_active IS NULL;
  END IF;
END $$;

-- Recriar índice se não existir
DROP INDEX IF EXISTS idx_social_posts_is_active;
CREATE INDEX idx_social_posts_is_active
ON social_posts(is_active)
WHERE is_active = true;

-- Comentário
COMMENT ON COLUMN social_posts.is_active IS 'Post ativo (true) ou removido/moderado (false)';
