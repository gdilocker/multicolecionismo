/*
  # Rename Standard Plan to Prime

  ## Overview
  Updates plan_type constraint and renames "Standard" to "Prime"

  ## Changes
    1. Drop old constraint
    2. Update data
    3. Add new constraint with 'prime'
*/

-- Drop the old constraint
ALTER TABLE subscription_plans
DROP CONSTRAINT IF EXISTS subscription_plans_plan_type_check;

-- Update the data
UPDATE subscription_plans
SET 
  plan_type = 'prime',
  plan_name = REPLACE(REPLACE(plan_name, 'Standard', 'Prime'), 'STANDARD', 'PRIME'),
  description = CASE 
    WHEN description IS NOT NULL 
    THEN REPLACE(REPLACE(description, 'Standard', 'Prime'), 'standard', 'prime')
    ELSE description
  END,
  updated_at = now()
WHERE plan_type = 'standard';

-- Add new constraint with 'prime' instead of 'standard'
ALTER TABLE subscription_plans
ADD CONSTRAINT subscription_plans_plan_type_check 
CHECK (plan_type IN ('starter', 'prime', 'elite', 'supreme'));

-- Update comment
COMMENT ON COLUMN subscription_plans.plan_type IS 
  'Plan tier: starter (free), prime (standard), elite (premium), supreme (top)';
