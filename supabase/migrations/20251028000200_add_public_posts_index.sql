/*
  # Add Index for Public Posts Query

  1. Changes
    - Add composite index for efficient public posts queries
    - Improves performance for anonymous users viewing feed

  2. Performance
    - Index on (is_active, privacy, created_at DESC)
    - Optimizes the most common query pattern
*/

-- Create index for public posts queries
CREATE INDEX IF NOT EXISTS idx_social_posts_public_feed
  ON social_posts(is_active, privacy, created_at DESC)
  WHERE is_active = true AND privacy = 'public';
