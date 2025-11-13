/*
  # Fix social_posts schema cache issue
  
  This migration forces Supabase to refresh the schema cache for the social_posts table
  by adding a comment and refreshing the table structure.
  
  1. Changes
    - Add comment to social_posts table to force schema refresh
    - Notify Supabase of schema changes
*/

-- Force schema cache refresh by updating table comment
COMMENT ON TABLE social_posts IS 'Social network posts with likes and comments - Schema refreshed 2025-11-13';

-- Ensure all default values are properly set
ALTER TABLE social_posts 
  ALTER COLUMN likes_count SET DEFAULT 0,
  ALTER COLUMN comments_count SET DEFAULT 0,
  ALTER COLUMN is_public SET DEFAULT true,
  ALTER COLUMN is_active SET DEFAULT true;

-- Notify postgrest to reload schema cache
NOTIFY pgrst, 'reload schema';
