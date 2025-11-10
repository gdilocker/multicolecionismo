/*
  # Remove UNIQUE constraint on user_id in user_profiles
  
  1. Changes
    - Remove the UNIQUE constraint on `user_profiles.user_id` column
    - This allows users to have multiple profiles (one per domain)
    - Keep UNIQUE constraint on `domain_id` (one profile per domain)
  
  2. Reasoning
    - Users can register up to 2 domains (per business logic)
    - Each domain should have its own profile
    - The constraint `user_profiles_user_id_key` was blocking this
*/

-- Remove UNIQUE constraint on user_id
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_user_id_key;
