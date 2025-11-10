/*
  # Auto-mark Marketplace Domains as Sold

  1. Changes
    - Creates a trigger function to automatically mark domains as sold in marketplace
    - Trigger runs when a domain is registered in the `domains` table
    - Only updates non-premium domains automatically
    - Premium domains stay visible even when sold (manual removal only)

  2. Logic
    - When a domain is inserted into `domains` table
    - Extract domain name without .email extension
    - Find matching domain in `domain_suggestions`
    - If found and not premium: mark as 'sold'
    - If premium: keep visible (don't change status)
*/

-- Function to mark marketplace domain as sold when registered
CREATE OR REPLACE FUNCTION mark_marketplace_domain_as_sold()
RETURNS TRIGGER AS $$
DECLARE
  domain_base text;
BEGIN
  -- Extract domain name without .email extension
  domain_base := REPLACE(NEW.fqdn, '.email', '');
  
  -- Update domain_suggestions if it exists and is not premium
  UPDATE domain_suggestions
  SET 
    status = 'sold',
    last_availability_check = now()
  WHERE 
    domain_name = domain_base
    AND is_premium = false
    AND status = 'available';
  
  -- Log the action
  IF FOUND THEN
    RAISE NOTICE 'Marketplace domain % marked as sold', domain_base;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on domains table
DROP TRIGGER IF EXISTS trigger_mark_marketplace_domain_sold ON domains;

CREATE TRIGGER trigger_mark_marketplace_domain_sold
  AFTER INSERT ON domains
  FOR EACH ROW
  EXECUTE FUNCTION mark_marketplace_domain_as_sold();
