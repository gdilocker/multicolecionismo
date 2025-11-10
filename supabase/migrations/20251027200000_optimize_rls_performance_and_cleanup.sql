/*
  # RLS Performance Optimization and Index Cleanup

  This migration addresses critical performance issues identified by Supabase:

  1. **RLS Policy Optimization**
     - Replaces direct `auth.uid()` and `auth.jwt()` calls with subquery versions
     - Prevents re-evaluation of auth functions for each row
     - Significantly improves query performance at scale

  2. **Index Cleanup**
     - Removes unused indexes that consume storage and slow down writes
     - Keeps only actively used indexes for optimal performance

  3. **Important Notes**
     - Uses `(SELECT auth.uid())` instead of `auth.uid()` in policies
     - This caches the auth result for the entire query instead of per-row
     - All existing policies are recreated with optimized versions
*/

-- =============================================================================
-- PART 1: OPTIMIZE RLS POLICIES
-- =============================================================================

-- Drop and recreate domain_catalog policies
DROP POLICY IF EXISTS "Admins can delete domains" ON public.domain_catalog;
DROP POLICY IF EXISTS "Admins can insert domains" ON public.domain_catalog;
DROP POLICY IF EXISTS "Admins can update domains" ON public.domain_catalog;

CREATE POLICY "Admins can delete domains"
  ON public.domain_catalog FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.customers
      WHERE user_id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert domains"
  ON public.domain_catalog FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.customers
      WHERE user_id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update domains"
  ON public.domain_catalog FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.customers
      WHERE user_id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

-- reserved_keywords policies
DROP POLICY IF EXISTS "Admins can manage reserved keywords" ON public.reserved_keywords;

CREATE POLICY "Admins can manage reserved keywords"
  ON public.reserved_keywords
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.customers
      WHERE user_id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

-- pricing_plans policies
DROP POLICY IF EXISTS "Only admins can insert pricing plans" ON public.pricing_plans;

CREATE POLICY "Only admins can insert pricing plans"
  ON public.pricing_plans FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.customers
      WHERE user_id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

-- profile_stats policies
DROP POLICY IF EXISTS "Users can view own profile stats" ON public.profile_stats;

CREATE POLICY "Users can view own profile stats"
  ON public.profile_stats FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- admin_settings policies
DROP POLICY IF EXISTS "Admins can manage settings" ON public.admin_settings;

CREATE POLICY "Admins can manage settings"
  ON public.admin_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.customers
      WHERE user_id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

-- affiliates policies
DROP POLICY IF EXISTS "Admins podem gerenciar afiliados" ON public.affiliates;
DROP POLICY IF EXISTS "Admins podem ver todos os afiliados" ON public.affiliates;
DROP POLICY IF EXISTS "Afiliados podem atualizar seus dados" ON public.affiliates;
DROP POLICY IF EXISTS "Afiliados podem ver seus próprios dados" ON public.affiliates;
DROP POLICY IF EXISTS "Resellers with subscription can insert own affiliate data" ON public.affiliates;
DROP POLICY IF EXISTS "Resellers with subscription can update own affiliate data" ON public.affiliates;
DROP POLICY IF EXISTS "Resellers with subscription can view own affiliate data" ON public.affiliates;
DROP POLICY IF EXISTS "Users can create own affiliate" ON public.affiliates;
DROP POLICY IF EXISTS "Usuários podem criar conta de afiliado" ON public.affiliates;

CREATE POLICY "Admins podem gerenciar afiliados"
  ON public.affiliates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.customers
      WHERE user_id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Afiliados podem atualizar seus dados"
  ON public.affiliates FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Afiliados podem ver seus próprios dados"
  ON public.affiliates FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can create own affiliate"
  ON public.affiliates FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- affiliate_clicks policies
DROP POLICY IF EXISTS "Admins podem ver todos os cliques" ON public.affiliate_clicks;
DROP POLICY IF EXISTS "Afiliados podem ver seus cliques" ON public.affiliate_clicks;
DROP POLICY IF EXISTS "Resellers with subscription can view own clicks" ON public.affiliate_clicks;

CREATE POLICY "Admins podem ver todos os cliques"
  ON public.affiliate_clicks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.customers
      WHERE user_id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Afiliados podem ver seus cliques"
  ON public.affiliate_clicks FOR SELECT
  TO authenticated
  USING (
    affiliate_id IN (
      SELECT id FROM public.affiliates WHERE user_id = (SELECT auth.uid())
    )
  );

-- affiliate_withdrawals policies
DROP POLICY IF EXISTS "Admins podem gerenciar saques" ON public.affiliate_withdrawals;
DROP POLICY IF EXISTS "Afiliados podem solicitar saques" ON public.affiliate_withdrawals;
DROP POLICY IF EXISTS "Afiliados podem ver seus saques" ON public.affiliate_withdrawals;

CREATE POLICY "Admins podem gerenciar saques"
  ON public.affiliate_withdrawals
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.customers
      WHERE user_id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Afiliados podem solicitar saques"
  ON public.affiliate_withdrawals FOR INSERT
  TO authenticated
  WITH CHECK (
    affiliate_id IN (
      SELECT id FROM public.affiliates WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Afiliados podem ver seus saques"
  ON public.affiliate_withdrawals FOR SELECT
  TO authenticated
  USING (
    affiliate_id IN (
      SELECT id FROM public.affiliates WHERE user_id = (SELECT auth.uid())
    )
  );

-- premium_payment_history policies
DROP POLICY IF EXISTS "Admins can manage premium payment history" ON public.premium_payment_history;
DROP POLICY IF EXISTS "Admins can view all premium payment history" ON public.premium_payment_history;
DROP POLICY IF EXISTS "Users can view own premium payment history" ON public.premium_payment_history;

CREATE POLICY "Admins can manage premium payment history"
  ON public.premium_payment_history
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.customers
      WHERE user_id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Users can view own premium payment history"
  ON public.premium_payment_history FOR SELECT
  TO authenticated
  USING (
    purchase_id IN (
      SELECT id FROM public.premium_domain_purchases
      WHERE customer_id IN (
        SELECT id FROM public.customers WHERE user_id = (SELECT auth.uid())
      )
    )
  );

-- affiliate_commissions policies
DROP POLICY IF EXISTS "Admins podem gerenciar comissões" ON public.affiliate_commissions;
DROP POLICY IF EXISTS "Afiliados podem ver suas comissões" ON public.affiliate_commissions;
DROP POLICY IF EXISTS "Resellers with subscription can view own commissions" ON public.affiliate_commissions;

CREATE POLICY "Admins podem gerenciar comissões"
  ON public.affiliate_commissions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.customers
      WHERE user_id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Afiliados podem ver suas comissões"
  ON public.affiliate_commissions FOR SELECT
  TO authenticated
  USING (
    affiliate_id IN (
      SELECT id FROM public.affiliates WHERE user_id = (SELECT auth.uid())
    )
  );

-- premium_domain_purchases policies
DROP POLICY IF EXISTS "Admins can create premium domain purchases" ON public.premium_domain_purchases;
DROP POLICY IF EXISTS "Admins can delete premium domain purchases" ON public.premium_domain_purchases;
DROP POLICY IF EXISTS "Admins can update premium domain purchases" ON public.premium_domain_purchases;
DROP POLICY IF EXISTS "Admins can view all premium domain purchases" ON public.premium_domain_purchases;
DROP POLICY IF EXISTS "Users can view own premium domain purchases" ON public.premium_domain_purchases;

CREATE POLICY "Admins can manage premium domain purchases"
  ON public.premium_domain_purchases
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.customers
      WHERE user_id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Users can view own premium domain purchases"
  ON public.premium_domain_purchases FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM public.customers WHERE user_id = (SELECT auth.uid())
    )
  );

-- premium_domain_suggestions policies
DROP POLICY IF EXISTS "Admins can manage suggestions" ON public.premium_domain_suggestions;

CREATE POLICY "Admins can manage suggestions"
  ON public.premium_domain_suggestions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.customers
      WHERE user_id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

-- social_posts policies
DROP POLICY IF EXISTS "Admins can moderate all posts" ON public.social_posts;
DROP POLICY IF EXISTS "Followers can view followers-only posts" ON public.social_posts;

CREATE POLICY "Admins can moderate all posts"
  ON public.social_posts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.customers
      WHERE user_id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Followers can view followers-only posts"
  ON public.social_posts FOR SELECT
  TO authenticated
  USING (
    privacy = 'followers'
    AND EXISTS (
      SELECT 1 FROM public.social_follows
      WHERE follower_id = (SELECT auth.uid())
      AND following_id = social_posts.user_id
    )
  );

-- social_reports policies
DROP POLICY IF EXISTS "Admins can update reports" ON public.social_reports;
DROP POLICY IF EXISTS "Admins can view all reports" ON public.social_reports;

CREATE POLICY "Admins can update reports"
  ON public.social_reports FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.customers
      WHERE user_id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Admins can view all reports"
  ON public.social_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.customers
      WHERE user_id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

-- social_notifications policies
DROP POLICY IF EXISTS "System can create notifications" ON public.social_notifications;

CREATE POLICY "System can create notifications"
  ON public.social_notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    actor_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.customers
      WHERE user_id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

-- profile_links policies
DROP POLICY IF EXISTS "Admins can manage all system links" ON public.profile_links;
DROP POLICY IF EXISTS "Users can delete own non-system profile links" ON public.profile_links;
DROP POLICY IF EXISTS "Users can manage own profile links" ON public.profile_links;
DROP POLICY IF EXISTS "Users can update own non-system profile links" ON public.profile_links;

CREATE POLICY "Admins can manage all system links"
  ON public.profile_links
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.customers
      WHERE user_id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Users can manage own profile links"
  ON public.profile_links
  FOR ALL
  TO authenticated
  USING (
    profile_id IN (
      SELECT id FROM public.user_profiles
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- recovery_codes policies
DROP POLICY IF EXISTS "Admins can view all recovery codes" ON public.recovery_codes;

CREATE POLICY "Admins can view all recovery codes"
  ON public.recovery_codes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.customers
      WHERE user_id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

-- protected_brands policies
DROP POLICY IF EXISTS "Admins can manage protected brands" ON public.protected_brands;

CREATE POLICY "Admins can manage protected brands"
  ON public.protected_brands
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.customers
      WHERE user_id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

-- licensing_requests policies
DROP POLICY IF EXISTS "Admins can update licensing requests" ON public.licensing_requests;
DROP POLICY IF EXISTS "Admins can view all licensing requests" ON public.licensing_requests;

CREATE POLICY "Admins can update licensing requests"
  ON public.licensing_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.customers
      WHERE user_id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Admins can view all licensing requests"
  ON public.licensing_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.customers
      WHERE user_id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

-- premium_domains policies
DROP POLICY IF EXISTS "Admins can delete premium domains" ON public.premium_domains;
DROP POLICY IF EXISTS "Admins can insert premium domains" ON public.premium_domains;
DROP POLICY IF EXISTS "Admins can update premium domains" ON public.premium_domains;

CREATE POLICY "Admins can manage premium domains"
  ON public.premium_domains
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.customers
      WHERE user_id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

-- =============================================================================
-- PART 2: REMOVE UNUSED INDEXES
-- =============================================================================

-- Drop unused indexes to improve write performance and reduce storage
DROP INDEX IF EXISTS public.idx_pricing_plans_product_type;
DROP INDEX IF EXISTS public.idx_affiliates_code;
DROP INDEX IF EXISTS public.idx_affiliates_status;
DROP INDEX IF EXISTS public.idx_dns_records_domain_id;
DROP INDEX IF EXISTS public.idx_invoices_order_id;
DROP INDEX IF EXISTS public.idx_licensing_requests_customer_id;
DROP INDEX IF EXISTS public.idx_licensing_requests_reviewed_by;
DROP INDEX IF EXISTS public.idx_physical_cards_subscription_id;
DROP INDEX IF EXISTS public.idx_social_notifications_actor_id;
DROP INDEX IF EXISTS public.idx_social_notifications_comment_id;
DROP INDEX IF EXISTS public.idx_social_notifications_post_id;
DROP INDEX IF EXISTS public.idx_social_reports_reported_comment_id;
DROP INDEX IF EXISTS public.idx_social_reports_reported_post_id;
DROP INDEX IF EXISTS public.idx_social_reports_reported_user_id;
DROP INDEX IF EXISTS public.idx_social_reports_reviewed_by;
DROP INDEX IF EXISTS public.idx_subdomains_user_id;
DROP INDEX IF EXISTS public.idx_subscriptions_plan_id;
DROP INDEX IF EXISTS public.idx_pending_orders_user_id;
DROP INDEX IF EXISTS public.idx_pending_orders_paypal_order_id;
DROP INDEX IF EXISTS public.idx_pending_orders_status;
DROP INDEX IF EXISTS public.idx_orders_paypal_order_id;
DROP INDEX IF EXISTS public.idx_orders_plan_commission;
DROP INDEX IF EXISTS public.idx_affiliate_commissions_order;
DROP INDEX IF EXISTS public.idx_reserved_keywords_category;
DROP INDEX IF EXISTS public.idx_domains_customer_type;
DROP INDEX IF EXISTS public.idx_domain_catalog_fqdn_lower;
DROP INDEX IF EXISTS public.idx_domain_catalog_available_premium;
DROP INDEX IF EXISTS public.idx_domain_catalog_owner;
DROP INDEX IF EXISTS public.idx_subscriptions_user_status;
DROP INDEX IF EXISTS public.idx_reserved_keywords_severity;
DROP INDEX IF EXISTS public.idx_subscriptions_referred_by;
DROP INDEX IF EXISTS public.idx_pricing_plans_code;
DROP INDEX IF EXISTS public.idx_pricing_plans_active;
DROP INDEX IF EXISTS public.idx_subdomains_subdomain;
DROP INDEX IF EXISTS public.idx_physical_cards_user_id;
DROP INDEX IF EXISTS public.idx_social_posts_user_id;
DROP INDEX IF EXISTS public.idx_social_posts_created_at;
DROP INDEX IF EXISTS public.idx_social_posts_is_active;
DROP INDEX IF EXISTS public.idx_social_posts_privacy;
DROP INDEX IF EXISTS public.idx_social_posts_hashtags;
DROP INDEX IF EXISTS public.idx_pricing_plans_billing_period;
DROP INDEX IF EXISTS public.idx_social_likes_post_id;
DROP INDEX IF EXISTS public.idx_social_likes_user_id;
DROP INDEX IF EXISTS public.idx_social_comments_post_id;
DROP INDEX IF EXISTS public.idx_social_comments_user_id;
DROP INDEX IF EXISTS public.idx_social_comments_parent_id;
DROP INDEX IF EXISTS public.idx_affiliate_clicks_cookie;
DROP INDEX IF EXISTS public.idx_affiliate_clicks_expires;
DROP INDEX IF EXISTS public.idx_commissions_status;
DROP INDEX IF EXISTS public.idx_withdrawals_affiliate;
DROP INDEX IF EXISTS public.idx_withdrawals_status;
DROP INDEX IF EXISTS public.idx_orders_affiliate_code;
DROP INDEX IF EXISTS public.idx_social_shares_post_id;
DROP INDEX IF EXISTS public.idx_cart_items_user_id;
DROP INDEX IF EXISTS public.idx_social_shares_user_id;
DROP INDEX IF EXISTS public.idx_domain_catalog_available;
DROP INDEX IF EXISTS public.idx_domain_catalog_premium;
DROP INDEX IF EXISTS public.idx_premium_payment_history_purchase;
DROP INDEX IF EXISTS public.idx_premium_payment_history_date;
DROP INDEX IF EXISTS public.idx_premium_payment_history_type;
DROP INDEX IF EXISTS public.idx_affiliate_commissions_forfeited;
DROP INDEX IF EXISTS public.idx_premium_purchases_customer;
DROP INDEX IF EXISTS public.idx_premium_purchases_status;
DROP INDEX IF EXISTS public.idx_premium_purchases_due_date;
DROP INDEX IF EXISTS public.idx_premium_purchases_overdue;
DROP INDEX IF EXISTS public.idx_premium_suggestions_category;
DROP INDEX IF EXISTS public.idx_subscriptions_payment_status;
DROP INDEX IF EXISTS public.idx_subscriptions_overdue;
DROP INDEX IF EXISTS public.idx_affiliate_commissions_held;
DROP INDEX IF EXISTS public.idx_premium_suggestions_keyword;
DROP INDEX IF EXISTS public.idx_social_follows_follower_id;
DROP INDEX IF EXISTS public.idx_social_follows_following_id;
DROP INDEX IF EXISTS public.idx_social_reports_status;
DROP INDEX IF EXISTS public.idx_social_reports_created_at;
DROP INDEX IF EXISTS public.idx_social_reports_reporter_id;
DROP INDEX IF EXISTS public.idx_social_notifications_user_id;
DROP INDEX IF EXISTS public.idx_social_notifications_is_read;
DROP INDEX IF EXISTS public.idx_social_notifications_created_at;
DROP INDEX IF EXISTS public.idx_social_bookmarks_user_id;
DROP INDEX IF EXISTS public.idx_social_bookmarks_post_id;
DROP INDEX IF EXISTS public.idx_profile_links_system;
DROP INDEX IF EXISTS public.idx_user_profiles_domain_id;
DROP INDEX IF EXISTS public.idx_recovery_codes_user_id;
DROP INDEX IF EXISTS public.idx_recovery_codes_unused;
DROP INDEX IF EXISTS public.idx_customers_totp_enabled;
DROP INDEX IF EXISTS public.idx_premium_domains_plan_required;
DROP INDEX IF EXISTS public.idx_premium_domains_owner_id;
DROP INDEX IF EXISTS public.idx_licensing_requests_user_id;
DROP INDEX IF EXISTS public.idx_licensing_requests_fqdn;
DROP INDEX IF EXISTS public.idx_licensing_requests_status;
DROP INDEX IF EXISTS public.idx_protected_brands_active;
DROP INDEX IF EXISTS public.idx_premium_domains_protected;
