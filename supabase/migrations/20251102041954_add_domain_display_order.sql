/*
  # Add display order to domains

  1. Changes
    - Add `display_order` column to domains table for custom sorting
    - Set default values based on current created_at order
    - Add index for efficient ordering queries
  
  2. Security
    - No RLS changes needed (inherits existing policies)
*/

-- Add display_order column
ALTER TABLE domains 
ADD COLUMN IF NOT EXISTS display_order INTEGER;

-- Set initial order based on created_at (oldest = 1, newest = highest)
WITH ordered_domains AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY created_at ASC) as row_num
  FROM domains
)
UPDATE domains d
SET display_order = od.row_num
FROM ordered_domains od
WHERE d.id = od.id;

-- Set default for future inserts
ALTER TABLE domains 
ALTER COLUMN display_order SET DEFAULT 999;

-- Add index for efficient ordering
CREATE INDEX IF NOT EXISTS idx_domains_display_order 
ON domains(customer_id, display_order);
