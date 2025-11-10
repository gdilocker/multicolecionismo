/*
  # Add Starter Plan ($19/month)

  1. Changes
    - Modify plan_type CHECK constraint to include 'starter'
    - Add Starter plan between Free and Standard
    - Price: $19/month
    - Features: Intermediate tier for price-sensitive users
    - Commission: 20%

  2. Pricing Strategy
    - Free: $0 (limited)
    - Starter: $19 (NEW - entry tier)
    - Standard: $50 (current middle)
    - Elite: $70 (premium)
    - Supreme: Custom (ultra-premium)

  3. Notes
    - Captures users who find $50 too expensive
    - Doesn't cannibalize Elite (different value prop)
    - Lower commission (20%) vs Standard (25%) to maintain margin
*/

-- First, drop the old constraint
ALTER TABLE subscription_plans DROP CONSTRAINT IF EXISTS subscription_plans_plan_type_check;

-- Add new constraint with 'starter' included
ALTER TABLE subscription_plans ADD CONSTRAINT subscription_plans_plan_type_check 
  CHECK (plan_type IN ('free', 'starter', 'standard', 'elite', 'supreme', 'reseller'));

-- Insert Starter plan if it doesn't exist
INSERT INTO subscription_plans (
  plan_name,
  plan_type,
  price_usd,
  billing_cycle,
  description,
  features,
  is_active,
  commission_rate
)
SELECT
  'Starter',
  'starter',
  19,
  'monthly',
  'Presença digital profissional. Ideal para quem está começando sua marca pessoal.',
  jsonb_build_array(
    'Licença exclusiva de domínio (seunome.com.rich)',
    'Página de perfil personalizável',
    'Links ilimitados',
    'Analytics básico de cliques',
    'Estatísticas mensais',
    'Programa de afiliados: 20% de comissão recorrente',
    'Suporte via plataforma'
  ),
  true,
  0.20
WHERE NOT EXISTS (
  SELECT 1 FROM subscription_plans WHERE plan_type = 'starter'
);

-- Add comment
COMMENT ON TABLE subscription_plans IS 'Subscription tiers: Free ($0), Starter ($19), Standard ($50), Elite ($70), Supreme (custom)';
