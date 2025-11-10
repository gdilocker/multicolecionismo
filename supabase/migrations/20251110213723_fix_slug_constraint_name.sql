/*
  # Fix slug constraint name

  1. Changes
    - Drop constraint user_profiles_slug_key (references old column name)
    - Create new constraint user_profiles_subdomain_key
  
  2. Notes
    - The constraint name still references 'slug' even though column is 'subdomain'
    - This causes Supabase's schema cache to look for a 'slug' column
*/

-- Drop the old constraint
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_slug_key;

-- Create new constraint with correct name
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_subdomain_key UNIQUE (subdomain);
