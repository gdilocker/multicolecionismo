/*
  # Sistema de Afiliados Multicolecionismo - Completo
  
  1. Nova Tabela
    - `affiliates` - Dados completos dos afiliados
  
  2. Alterações em user_profiles
    - `is_affiliate` (boolean) - Se é afiliado
    - `affiliate_terms_accepted_at` (timestamptz) - Quando aceitou os termos
  
  3. Security
    - Enable RLS on affiliates table
    - Add policies for users and admins
    
  4. Functions
    - generate_affiliate_code() - Gera código único de afiliado
*/

-- Create affiliates table
CREATE TABLE IF NOT EXISTS affiliates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  affiliate_code text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended')),
  commission_rate numeric(3,2),
  total_sales integer NOT NULL DEFAULT 0,
  total_earnings numeric(10,2) NOT NULL DEFAULT 0,
  available_balance numeric(10,2) NOT NULL DEFAULT 0,
  withdrawn_balance numeric(10,2) NOT NULL DEFAULT 0,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add columns to user_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'is_affiliate'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN is_affiliate boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'affiliate_terms_accepted_at'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN affiliate_terms_accepted_at timestamptz;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_affiliates_user_id ON affiliates(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliates_code ON affiliates(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_affiliates_status ON affiliates(status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_affiliate ON user_profiles(is_affiliate) WHERE is_affiliate = true;

-- Enable RLS
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own affiliate data" ON affiliates;
DROP POLICY IF EXISTS "Users can insert own affiliate data" ON affiliates;
DROP POLICY IF EXISTS "Users can update own affiliate data" ON affiliates;
DROP POLICY IF EXISTS "Admins can view all affiliates" ON affiliates;
DROP POLICY IF EXISTS "Admins can manage all affiliates" ON affiliates;

-- RLS Policies for affiliates
CREATE POLICY "Users can view own affiliate data"
  ON affiliates FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own affiliate data"
  ON affiliates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own affiliate data"
  ON affiliates FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all affiliates"
  ON affiliates FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers 
      WHERE customers.user_id = auth.uid() 
      AND customers.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all affiliates"
  ON affiliates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers 
      WHERE customers.user_id = auth.uid() 
      AND customers.role = 'admin'
    )
  );

-- Function to generate unique affiliate code
CREATE OR REPLACE FUNCTION generate_affiliate_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_code text;
  code_exists boolean;
BEGIN
  LOOP
    -- Generate 8 character alphanumeric code
    new_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM affiliates WHERE affiliate_code = new_code) INTO code_exists;
    
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$;

-- Function to update affiliate stats
CREATE OR REPLACE FUNCTION update_affiliate_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE affiliates
  SET updated_at = now()
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_affiliates_updated_at ON affiliates;
CREATE TRIGGER update_affiliates_updated_at
  BEFORE UPDATE ON affiliates
  FOR EACH ROW
  EXECUTE FUNCTION update_affiliate_stats();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON affiliates TO authenticated;

-- Add comments
COMMENT ON TABLE affiliates IS 'Sistema de afiliados do Multicolecionismo';
COMMENT ON COLUMN affiliates.affiliate_code IS 'Código único do afiliado para tracking';
COMMENT ON COLUMN affiliates.status IS 'Status: pending (aguardando aprovação), active (ativo), suspended (suspenso)';
