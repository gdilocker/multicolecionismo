/*
  # Link Profiles to Domains
  
  This migration creates the proper relationship between domains and profiles.
  Each domain should have its own profile page.

  ## Changes
  
  1. Modifications
    - Add `domain_id` column to `user_profiles` table
    - Create foreign key relationship between profiles and domains
    - Create unique constraint on domain_id (one profile per domain)
    - Add index for faster lookups
  
  2. Data Migration
    - Link existing profiles to domains based on subdomain matching FQDN
  
  3. Notes
    - This allows each domain (eriksonleif.com.rich) to have its own profile page
    - Users can manage multiple domain profiles separately
*/

-- Add domain_id column to user_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'domain_id'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN domain_id uuid REFERENCES domains(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create unique constraint (one profile per domain)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_profiles_domain_id_key'
  ) THEN
    ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_domain_id_key UNIQUE (domain_id);
  END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_domain_id ON user_profiles(domain_id);

-- Migrate existing data: link profiles to domains based on subdomain
UPDATE user_profiles
SET domain_id = domains.id
FROM domains
WHERE user_profiles.subdomain = domains.fqdn
AND user_profiles.domain_id IS NULL;
