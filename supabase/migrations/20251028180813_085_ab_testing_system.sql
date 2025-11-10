/*
  # A/B Testing System
  
  1. New Tables
    - `ab_tests` - Define A/B tests
    - `ab_variants` - Test variants
    - `ab_results` - Test results tracking
  
  2. Security
    - Enable RLS
*/

-- A/B Tests
CREATE TABLE IF NOT EXISTS ab_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  test_name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  start_date timestamptz DEFAULT now(),
  end_date timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Test Variants
CREATE TABLE IF NOT EXISTS ab_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES ab_tests(id) ON DELETE CASCADE,
  variant_name text NOT NULL,
  variant_config jsonb NOT NULL,
  traffic_percentage integer DEFAULT 50 CHECK (traffic_percentage >= 0 AND traffic_percentage <= 100),
  conversion_count integer DEFAULT 0,
  view_count integer DEFAULT 0
);

-- Test Results
CREATE TABLE IF NOT EXISTS ab_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES ab_tests(id) ON DELETE CASCADE,
  variant_id uuid NOT NULL REFERENCES ab_variants(id) ON DELETE CASCADE,
  visitor_id text NOT NULL,
  converted boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users manage own ab tests" ON ab_tests FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = ab_tests.profile_id AND user_profiles.user_id = auth.uid()));

CREATE POLICY "Users manage own ab variants" ON ab_variants FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM ab_tests JOIN user_profiles ON user_profiles.id = ab_tests.profile_id WHERE ab_tests.id = ab_variants.test_id AND user_profiles.user_id = auth.uid()));

CREATE POLICY "Anyone can create ab results" ON ab_results FOR INSERT WITH CHECK (true);
CREATE POLICY "Users view own ab results" ON ab_results FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM ab_tests JOIN user_profiles ON user_profiles.id = ab_tests.profile_id WHERE ab_tests.id = ab_results.test_id AND user_profiles.user_id = auth.uid()));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ab_tests_profile ON ab_tests(profile_id);
CREATE INDEX IF NOT EXISTS idx_ab_variants_test ON ab_variants(test_id);
CREATE INDEX IF NOT EXISTS idx_ab_results_test ON ab_results(test_id);
CREATE INDEX IF NOT EXISTS idx_ab_results_variant ON ab_results(variant_id);
