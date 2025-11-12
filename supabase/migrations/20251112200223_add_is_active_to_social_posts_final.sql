/*
  # Add is_active column to social_posts (PRODUCTION FIX)

  ## Problema Identificado
  - A tabela social_posts em produção tem estrutura diferente das migrations
  - Campos que existem em produção: id, user_id, profile_id, content, media_url, media_type, is_public, likes_count, comments_count, created_at, updated_at
  - Campos faltando: is_active, privacy, content_type, media_urls, hashtags, view_count
  
  ## Solução
  - Adicionar coluna is_active (necessária para soft delete de posts)
  - Adicionar índice para performance
  - Manter compatibilidade com código existente

  ## Segurança
  - RLS policies existentes continuam válidas
*/

-- Add is_active column for soft delete functionality
ALTER TABLE social_posts
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true NOT NULL;

-- Add index for filtering active posts
CREATE INDEX IF NOT EXISTS idx_social_posts_is_active
  ON social_posts(is_active, created_at DESC)
  WHERE is_active = true;

-- Add composite index for public + active posts (most common query)
CREATE INDEX IF NOT EXISTS idx_social_posts_public_active
  ON social_posts(is_public, is_active, created_at DESC)
  WHERE is_public = true AND is_active = true;

-- Add comment
COMMENT ON COLUMN social_posts.is_active IS 'Soft delete flag. FALSE = post deleted by user or admin, TRUE = post visible.';
