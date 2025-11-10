/*
  # Add Foreign Key between social_posts and user_profiles

  1. Changes
    - Add foreign key constraint from social_posts.user_id to user_profiles.user_id
    - This allows PostgREST to automatically join the tables
  
  2. Notes
    - Uses user_id as the relationship column (not id)
    - Allows proper data fetching with select syntax
*/

-- Add foreign key if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'social_posts_user_id_fkey' 
    AND table_name = 'social_posts'
  ) THEN
    ALTER TABLE social_posts
    ADD CONSTRAINT social_posts_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;
  END IF;
END $$;
