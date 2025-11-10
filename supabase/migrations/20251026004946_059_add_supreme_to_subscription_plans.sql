/*
  # Add Supreme Plan to Subscription Plans

  1. Changes
    - Drop existing plan_type check constraint
    - Add new constraint that includes 'supreme'
    - Insert Supreme plan into subscription_plans table

  2. Security
    - Maintains existing RLS policies
*/

-- Drop existing constraint
ALTER TABLE subscription_plans DROP CONSTRAINT IF EXISTS subscription_plans_plan_type_check;

-- Add new constraint including supreme
ALTER TABLE subscription_plans ADD CONSTRAINT subscription_plans_plan_type_check 
  CHECK (plan_type = ANY (ARRAY['standard'::text, 'elite'::text, 'supreme'::text]));

-- Insert Supreme plan
INSERT INTO subscription_plans (
  plan_name,
  plan_type,
  price_usd,
  billing_cycle,
  description,
  features,
  is_active,
  commission_rate
) VALUES (
  'Supreme',
  'supreme',
  0,
  'monthly',
  'Licenciamento exclusivo de domínios premium com termos personalizados e suporte corporativo dedicado.',
  jsonb_build_array(
    'Exclusive License Fee (taxa única de licenciamento)',
    'Mensalidade personalizada sob consulta',
    'Portfólio de domínios premium globais',
    'Gerente de conta dedicado',
    'Suporte corporativo prioritário',
    'Garantias de SLA',
    'Termos contratuais customizados',
    'Onboarding white-glove',
    'Consultoria estratégica inclusa'
  ),
  true,
  0
);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Supreme plan added to subscription_plans table successfully';
END $$;