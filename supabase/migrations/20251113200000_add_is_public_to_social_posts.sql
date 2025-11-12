/*
  # Add is_public column to social_posts

  1. Changes
    - Add `is_public` boolean column to social_posts table
    - Set default to true for backward compatibility
    - Update existing rows based on privacy field
    - Add index for performance

  2. Migration Strategy
    - Add column with default
    - Backfill existing data: public privacy = true, others = false
    - Add index for is_public queries

  3. Security
    - No RLS changes needed (inherited from existing policies)
*/

-- Add is_public column to social_posts
ALTER TABLE social_posts
ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT true;

-- Backfill existing data based on privacy field
UPDATE social_posts
SET is_public = (privacy = 'public')
WHERE is_public IS NULL OR is_public != (privacy = 'public');

-- Add index for performance (public posts are frequently queried)
CREATE INDEX IF NOT EXISTS idx_social_posts_is_public
  ON social_posts(is_public, created_at DESC)
  WHERE is_public = true AND is_active = true;

-- Add trigger to keep is_public in sync with privacy
CREATE OR REPLACE FUNCTION sync_social_posts_is_public()
RETURNS TRIGGER AS $$
BEGIN
  NEW.is_public := (NEW.privacy = 'public');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_social_posts_is_public_trigger ON social_posts;
CREATE TRIGGER sync_social_posts_is_public_trigger
  BEFORE INSERT OR UPDATE OF privacy ON social_posts
  FOR EACH ROW
  EXECUTE FUNCTION sync_social_posts_is_public();

-- Add comment explaining the column
COMMENT ON COLUMN social_posts.is_public IS 'Denormalized field for performance. Automatically synced with privacy field. TRUE when privacy = public, FALSE otherwise.';
