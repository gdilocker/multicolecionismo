/*
  # Affiliate Commission Rules and Restrictions

  1. Business Rules (CRITICAL)
    - Affiliates/Resellers earn commission ONLY on subscription plan sales
    - NO commission on premium domain sales (company exclusive revenue)
    - All premium domain sales and revenue belong exclusively to the company
    - Premium domains can only be sold/listed by the company
    - Gallery/marketplace displays are company-exclusive offerings
    
  2. Changes
    - Document business rules in database comments
    - Add check to ensure commissions only apply to orders with plan_id
    - Create trigger to validate commission rules at database level

  3. Important Notes
    - This ensures affiliates are compensated for bringing subscription customers
    - Premium domains remain 100% company revenue and control
    - Premium domain purchases are tracked separately in premium_domain_purchases table
    - Regular orders (orders table) with plan_id are eligible for commissions
*/

-- Add comprehensive comments documenting the business rules
COMMENT ON TABLE affiliate_commissions IS 
'Stores affiliate commissions for subscription plan sales ONLY. 
IMPORTANT BUSINESS RULES:
1. Commissions are ONLY paid on subscription plan sales (orders.plan_id must exist)
2. Premium domain sales are EXCLUDED - they are company-exclusive revenue
3. Premium domains are tracked in premium_domain_purchases table (separate from orders)
4. Affiliates can only earn from recurring subscription revenue, not domain sales';

COMMENT ON COLUMN affiliate_commissions.commission_rate IS 
'Commission rate applied to subscription plan sales only. Rate comes from subscription_plans.commission_rate or affiliate default rate. Premium domain sales are excluded from all commissions.';

COMMENT ON COLUMN affiliate_commissions.sale_amount IS 
'Sale amount from subscription plan purchase only. Premium domain sales do not generate commissions - they are company exclusive revenue.';

-- Create function to validate commission eligibility (subscription plans only)
CREATE OR REPLACE FUNCTION validate_commission_eligibility()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  order_plan_id uuid;
  order_fqdn text;
BEGIN
  -- Get order details
  SELECT plan_id, fqdn
  INTO order_plan_id, order_fqdn
  FROM orders
  WHERE id = NEW.order_id;

  -- Check if order exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found for commission';
  END IF;

  -- CRITICAL: Reject if no plan_id (must be subscription sale)
  IF order_plan_id IS NULL THEN
    RAISE EXCEPTION 'Commission only applies to subscription plan sales. Premium domain sales are company-exclusive revenue.';
  END IF;

  -- All validations passed
  RETURN NEW;
END;
$$;

-- Create trigger to enforce commission rules at database level
DROP TRIGGER IF EXISTS trg_validate_commission ON affiliate_commissions;
CREATE TRIGGER trg_validate_commission
  BEFORE INSERT ON affiliate_commissions
  FOR EACH ROW
  EXECUTE FUNCTION validate_commission_eligibility();

-- Add index for performance when validating commissions
CREATE INDEX IF NOT EXISTS idx_orders_plan_commission
  ON orders(id, plan_id)
  WHERE plan_id IS NOT NULL;

-- Add index on affiliate_commissions for order lookups
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_order
  ON affiliate_commissions(order_id);

-- Document the subscription_plans commission structure
COMMENT ON COLUMN subscription_plans.commission_rate IS 
'Commission rate (0.0 to 1.0) paid to affiliates for selling this subscription plan. Only applies to plan subscriptions, never to premium domain sales.';

-- Add comment to premium_domain_purchases documenting no commission policy
COMMENT ON TABLE premium_domain_purchases IS 
'Premium domain purchases and subscriptions. IMPORTANT: Premium domains are COMPANY-EXCLUSIVE revenue. NO affiliate commissions are paid on premium domain sales or monthly fees. All premium domain revenue belongs to the company.';
