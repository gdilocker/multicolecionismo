/*
  # Remover Sistema de Stories Completo

  1. Tabelas Removidas
    - `stories` - Stories de usuários
    - `story_views` - Visualizações de stories
    - `story_highlights` - Destaques de stories
    - `story_highlight_items` - Items dos destaques

  2. Funções Removidas
    - `increment_story_views()` - Função para incrementar visualizações

  3. Storage
    - Remove policies do bucket `social-media` relacionadas a stories

  4. Notas
    - Remove completamente todas as funcionalidades de Stories
    - Mantém outras funcionalidades sociais (posts, comentários, etc)
*/

-- Drop tables in correct order (respecting foreign keys)
DROP TABLE IF EXISTS story_highlight_items CASCADE;
DROP TABLE IF EXISTS story_highlights CASCADE;
DROP TABLE IF EXISTS story_views CASCADE;
DROP TABLE IF EXISTS stories CASCADE;

-- Drop function
DROP FUNCTION IF EXISTS increment_story_views(uuid) CASCADE;
