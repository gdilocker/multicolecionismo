/*
  # Fix All Function Search Paths
  
  1. Changes
    - Change search_path from '' to 'pg_catalog, public, auth'
    - This is secure because:
      - pg_catalog is first (standard functions)
      - public is explicit (our tables)
      - auth is needed for auth.uid()
    - Still prevents search_path injection attacks
  
  2. Security
    - Maintains SECURITY DEFINER protection
    - Explicit schema ordering prevents malicious override
    - Functions remain immutable for query planner
*/

-- Update all functions that currently have search_path = ''
ALTER FUNCTION auto_expire_overdue_domains() SET search_path = pg_catalog, public, auth;
ALTER FUNCTION auto_suspend_on_elite_cancel() SET search_path = pg_catalog, public, auth;
ALTER FUNCTION auto_suspend_overdue_domains() SET search_path = pg_catalog, public, auth;
ALTER FUNCTION calculate_days_overdue() SET search_path = pg_catalog, public, auth;
ALTER FUNCTION calculate_subscription_overdue() SET search_path = pg_catalog, public, auth;
ALTER FUNCTION can_receive_commission_payout(uuid) SET search_path = pg_catalog, public, auth;
ALTER FUNCTION can_user_post(uuid) SET search_path = pg_catalog, public, auth;
ALTER FUNCTION check_elite_subscription_for_premium() SET search_path = pg_catalog, public, auth;
ALTER FUNCTION check_reserved_keyword(text) SET search_path = pg_catalog, public, auth;
ALTER FUNCTION cleanup_old_recovery_codes() SET search_path = pg_catalog, public, auth;
ALTER FUNCTION freeze_overdue_reseller_commissions() SET search_path = pg_catalog, public, auth;
ALTER FUNCTION generate_affiliate_code() SET search_path = pg_catalog, public, auth;
ALTER FUNCTION get_post_stats(uuid) SET search_path = pg_catalog, public, auth;
ALTER FUNCTION get_user_role(uuid) SET search_path = pg_catalog, public, auth;
ALTER FUNCTION get_user_social_stats(uuid) SET search_path = pg_catalog, public, auth;
ALTER FUNCTION is_reseller_with_active_subscription(uuid) SET search_path = pg_catalog, public, auth;
ALTER FUNCTION release_reseller_commissions(uuid) SET search_path = pg_catalog, public, auth;
ALTER FUNCTION validate_commission_eligibility() SET search_path = pg_catalog, public, auth;
ALTER FUNCTION update_premium_suggestions_updated_at() SET search_path = pg_catalog, public, auth;
ALTER FUNCTION validate_premium_domain_keyword() SET search_path = pg_catalog, public, auth;
ALTER FUNCTION update_domain_catalog_updated_at() SET search_path = pg_catalog, public, auth;
ALTER FUNCTION update_domain_catalog_timestamp() SET search_path = pg_catalog, public, auth;
ALTER FUNCTION update_pending_orders_updated_at() SET search_path = pg_catalog, public, auth;
ALTER FUNCTION set_profile_password(uuid, text) SET search_path = pg_catalog, public, auth;
ALTER FUNCTION verify_profile_password(uuid, text) SET search_path = pg_catalog, public, auth;
ALTER FUNCTION update_affiliates_updated_at() SET search_path = pg_catalog, public, auth;
ALTER FUNCTION update_cart_items_updated_at() SET search_path = pg_catalog, public, auth;
ALTER FUNCTION update_premium_purchases_updated_at() SET search_path = pg_catalog, public, auth;
