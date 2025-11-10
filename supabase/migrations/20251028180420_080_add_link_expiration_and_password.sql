/*
  # Add Link Expiration and Password Protection
  
  1. Changes
    - Add `expires_at` column to `profile_links` table
    - Add `link_password` column to `profile_links` table
    - Add `link_type` column to distinguish different link types
  
  2. Notes
    - Temporary links will expire after the specified date
    - Links can be password protected individually
    - Link types: standard, temporary, password_protected, calendly, download
*/

-- Add new columns to profile_links
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profile_links' AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE profile_links ADD COLUMN expires_at timestamptz;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profile_links' AND column_name = 'link_password'
  ) THEN
    ALTER TABLE profile_links ADD COLUMN link_password text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profile_links' AND column_name = 'link_type'
  ) THEN
    ALTER TABLE profile_links ADD COLUMN link_type text DEFAULT 'standard';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profile_links' AND column_name = 'calendly_url'
  ) THEN
    ALTER TABLE profile_links ADD COLUMN calendly_url text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profile_links' AND column_name = 'download_file_url'
  ) THEN
    ALTER TABLE profile_links ADD COLUMN download_file_url text;
  END IF;
END $$;

-- Add check constraint for link_type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profile_links_link_type_check'
  ) THEN
    ALTER TABLE profile_links
    ADD CONSTRAINT profile_links_link_type_check
    CHECK (link_type IN ('standard', 'temporary', 'password_protected', 'calendly', 'download', 'youtube', 'spotify'));
  END IF;
END $$;

-- Create index on expires_at for efficient queries
CREATE INDEX IF NOT EXISTS idx_profile_links_expires_at ON profile_links(expires_at) WHERE expires_at IS NOT NULL;
