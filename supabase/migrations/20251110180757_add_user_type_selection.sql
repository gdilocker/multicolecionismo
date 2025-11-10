/*
  # Add User Type Selection System

  1. Changes
    - Add `user_type` column to customers table
    - Add `onboarding_completed` flag
    - Possible values: 'social' (user comum) or 'member' (usuário com domínios)
    
  2. Purpose
    - Allow users to choose their account type on first login
    - 'social': Just want to use the social network (like/comment/share)
    - 'member': Want to register domains and use full platform features
*/

-- Add user_type column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'user_type'
  ) THEN
    ALTER TABLE customers ADD COLUMN user_type TEXT CHECK (user_type IN ('social', 'member'));
  END IF;
END $$;

-- Add onboarding_completed flag
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'onboarding_completed'
  ) THEN
    ALTER TABLE customers ADD COLUMN onboarding_completed BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_customers_user_type ON customers(user_type);
CREATE INDEX IF NOT EXISTS idx_customers_onboarding ON customers(onboarding_completed);
