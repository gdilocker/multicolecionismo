/*
  # Fix social_posts schema cache issue

  ## Problem
  Supabase schema cache not recognizing 'caption' column in social_posts table

  ## Solution
  1. Ensure caption column exists with proper constraints
  2. Force schema refresh by recreating constraints
  3. Verify all required columns are present
*/

-- Ensure caption column exists (should already exist, but checking)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'social_posts'
    AND column_name = 'caption'
  ) THEN
    ALTER TABLE social_posts ADD COLUMN caption text;
  END IF;
END $$;

-- Ensure hashtags column exists with proper type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'social_posts'
    AND column_name = 'hashtags'
  ) THEN
    ALTER TABLE social_posts ADD COLUMN hashtags text[] DEFAULT ARRAY[]::text[];
  END IF;
END $$;

-- Update any null captions to empty string for consistency
UPDATE social_posts SET caption = '' WHERE caption IS NULL;

-- Add comment to force schema cache refresh
COMMENT ON COLUMN social_posts.caption IS 'Post text content/caption';
COMMENT ON COLUMN social_posts.hashtags IS 'Array of hashtags extracted from caption';

-- Verify structure
DO $$
DECLARE
  missing_cols text[];
BEGIN
  SELECT ARRAY_AGG(col)
  INTO missing_cols
  FROM (
    SELECT unnest(ARRAY['id', 'user_id', 'content_type', 'caption', 'media_urls', 'privacy', 'hashtags', 'is_active', 'view_count', 'created_at', 'updated_at']) AS col
  ) expected
  WHERE NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'social_posts'
    AND column_name = expected.col
  );

  IF missing_cols IS NOT NULL THEN
    RAISE EXCEPTION 'Missing columns in social_posts: %', array_to_string(missing_cols, ', ');
  END IF;
END $$;
