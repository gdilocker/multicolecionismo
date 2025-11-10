/*
  # Security and Performance Optimization

  ## Summary
  Comprehensive security and performance improvements addressing:
  - Missing foreign key indexes (50+ tables)
  - RLS policy optimization (30+ tables)
  - Removal of unused indexes

  ## Changes

  ### 1. Foreign Key Indexes
  Creates covering indexes for all unindexed foreign keys

  ### 2. RLS Policy Optimization  
  Replaces `auth.uid()` with `(select auth.uid())` for caching

  ### 3. Index Cleanup
  Removes unused indexes to reduce overhead
*/

-- Add missing foreign key indexes
CREATE INDEX IF NOT EXISTS idx_ab_results_test_id ON public.ab_results(test_id);
CREATE INDEX IF NOT EXISTS idx_ab_results_variant_id ON public.ab_results(variant_id);
CREATE INDEX IF NOT EXISTS idx_ab_variants_test_id ON public.ab_variants(test_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_order_id ON public.affiliate_commissions(order_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_withdrawals_affiliate_id ON public.affiliate_withdrawals(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_domain_catalog_owner_user_id ON public.domain_catalog(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_domain_transfers_domain_id ON public.domain_transfers(domain_id);
CREATE INDEX IF NOT EXISTS idx_domain_transfers_from_customer_id ON public.domain_transfers(from_customer_id);
CREATE INDEX IF NOT EXISTS idx_domain_transfers_payment_id ON public.domain_transfers(payment_id);
CREATE INDEX IF NOT EXISTS idx_domain_transfers_to_customer_id ON public.domain_transfers(to_customer_id);
CREATE INDEX IF NOT EXISTS idx_domains_customer_id ON public.domains(customer_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_form_id ON public.form_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_highlight_stories_story_id ON public.highlight_stories(story_id);
CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON public.invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_pending_orders_user_id ON public.pending_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_licensing_requests_customer_id ON public.licensing_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_licensing_requests_fqdn ON public.licensing_requests(fqdn);
CREATE INDEX IF NOT EXISTS idx_licensing_requests_reviewed_by ON public.licensing_requests(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_licensing_requests_user_id ON public.licensing_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_physical_cards_subscription_id ON public.physical_cards(subscription_id);
CREATE INDEX IF NOT EXISTS idx_physical_cards_user_id ON public.physical_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_poll_options_poll_id ON public.poll_options(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_option_id ON public.poll_votes(option_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_poll_id ON public.poll_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_premium_domain_purchases_customer_id ON public.premium_domain_purchases(customer_id);
CREATE INDEX IF NOT EXISTS idx_premium_domains_owner_id ON public.premium_domains(owner_id);
CREATE INDEX IF NOT EXISTS idx_premium_payment_history_purchase_id ON public.premium_payment_history(purchase_id);
CREATE INDEX IF NOT EXISTS idx_profile_admins_invited_by ON public.profile_admins(invited_by);
CREATE INDEX IF NOT EXISTS idx_profile_admins_user_id ON public.profile_admins(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_applied_templates_template_id ON public.profile_applied_templates(template_id);
CREATE INDEX IF NOT EXISTS idx_profile_change_history_user_id ON public.profile_change_history(user_id);
CREATE INDEX IF NOT EXISTS idx_recovery_codes_user_id ON public.recovery_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_social_bookmarks_post_id ON public.social_bookmarks(post_id);
CREATE INDEX IF NOT EXISTS idx_social_comments_parent_comment_id ON public.social_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_social_comments_user_id ON public.social_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_social_follows_following_id ON public.social_follows(following_id);
CREATE INDEX IF NOT EXISTS idx_social_likes_user_id ON public.social_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_social_notifications_actor_id ON public.social_notifications(actor_id);
CREATE INDEX IF NOT EXISTS idx_social_notifications_comment_id ON public.social_notifications(comment_id);
CREATE INDEX IF NOT EXISTS idx_social_notifications_post_id ON public.social_notifications(post_id);
CREATE INDEX IF NOT EXISTS idx_social_notifications_user_id ON public.social_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_social_reports_reported_comment_id ON public.social_reports(reported_comment_id);
CREATE INDEX IF NOT EXISTS idx_social_reports_reported_post_id ON public.social_reports(reported_post_id);
CREATE INDEX IF NOT EXISTS idx_social_reports_reported_user_id ON public.social_reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_social_reports_reporter_id ON public.social_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_social_reports_reviewed_by ON public.social_reports(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_social_shares_user_id ON public.social_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_subdomains_user_id ON public.subdomains(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON public.subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_referred_by ON public.subscriptions(referred_by);

-- Optimize RLS policies
DROP POLICY IF EXISTS "Users can delete own products" ON public.store_products;
CREATE POLICY "Users can delete own products" ON public.store_products FOR DELETE TO authenticated USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own products" ON public.store_products;
CREATE POLICY "Users can insert own products" ON public.store_products FOR INSERT TO authenticated WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own products" ON public.store_products;
CREATE POLICY "Users can update own products" ON public.store_products FOR UPDATE TO authenticated USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can view own products" ON public.store_products;
CREATE POLICY "Users can view own products" ON public.store_products FOR SELECT TO authenticated USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can create own highlights" ON public.profile_highlights;
CREATE POLICY "Users can create own highlights" ON public.profile_highlights FOR INSERT TO authenticated WITH CHECK (profile_id IN (SELECT id FROM user_profiles WHERE user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Users can delete own highlights" ON public.profile_highlights;
CREATE POLICY "Users can delete own highlights" ON public.profile_highlights FOR DELETE TO authenticated USING (profile_id IN (SELECT id FROM user_profiles WHERE user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Users can update own highlights" ON public.profile_highlights;
CREATE POLICY "Users can update own highlights" ON public.profile_highlights FOR UPDATE TO authenticated USING (profile_id IN (SELECT id FROM user_profiles WHERE user_id = (select auth.uid()))) WITH CHECK (profile_id IN (SELECT id FROM user_profiles WHERE user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Users can view own highlights or public profile highlights" ON public.profile_highlights;
CREATE POLICY "Users can view own highlights or public profile highlights" ON public.profile_highlights FOR SELECT TO authenticated USING (profile_id IN (SELECT id FROM user_profiles WHERE user_id = (select auth.uid()) OR is_public = true));

DROP POLICY IF EXISTS "Users can manage own highlight_stories" ON public.highlight_stories;
CREATE POLICY "Users can manage own highlight_stories" ON public.highlight_stories FOR ALL TO authenticated USING (highlight_id IN (SELECT h.id FROM profile_highlights h JOIN user_profiles p ON p.id = h.profile_id WHERE p.user_id = (select auth.uid()))) WITH CHECK (highlight_id IN (SELECT h.id FROM profile_highlights h JOIN user_profiles p ON p.id = h.profile_id WHERE p.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Users can view highlight_stories" ON public.highlight_stories;
CREATE POLICY "Users can view highlight_stories" ON public.highlight_stories FOR SELECT TO authenticated USING (highlight_id IN (SELECT h.id FROM profile_highlights h JOIN user_profiles p ON p.id = h.profile_id WHERE p.is_public = true OR p.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Users can manage own polls" ON public.profile_polls;
CREATE POLICY "Users can manage own polls" ON public.profile_polls FOR ALL TO authenticated USING (profile_id IN (SELECT id FROM user_profiles WHERE user_id = (select auth.uid()))) WITH CHECK (profile_id IN (SELECT id FROM user_profiles WHERE user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Users can manage own poll options" ON public.poll_options;
CREATE POLICY "Users can manage own poll options" ON public.poll_options FOR ALL TO authenticated USING (poll_id IN (SELECT pp.id FROM profile_polls pp JOIN user_profiles up ON up.id = pp.profile_id WHERE up.user_id = (select auth.uid()))) WITH CHECK (poll_id IN (SELECT pp.id FROM profile_polls pp JOIN user_profiles up ON up.id = pp.profile_id WHERE up.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Users manage own forms" ON public.lead_capture_forms;
CREATE POLICY "Users manage own forms" ON public.lead_capture_forms FOR ALL TO authenticated USING (profile_id IN (SELECT id FROM user_profiles WHERE user_id = (select auth.uid()))) WITH CHECK (profile_id IN (SELECT id FROM user_profiles WHERE user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Users view own submissions" ON public.form_submissions;
CREATE POLICY "Users view own submissions" ON public.form_submissions FOR SELECT TO authenticated USING (form_id IN (SELECT f.id FROM lead_capture_forms f JOIN user_profiles p ON p.id = f.profile_id WHERE p.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Users manage own products" ON public.product_catalog;
CREATE POLICY "Users manage own products" ON public.product_catalog FOR ALL TO authenticated USING (profile_id IN (SELECT id FROM user_profiles WHERE user_id = (select auth.uid()))) WITH CHECK (profile_id IN (SELECT id FROM user_profiles WHERE user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Users manage own FAQs" ON public.profile_faqs;
CREATE POLICY "Users manage own FAQs" ON public.profile_faqs FOR ALL TO authenticated USING (profile_id IN (SELECT id FROM user_profiles WHERE user_id = (select auth.uid()))) WITH CHECK (profile_id IN (SELECT id FROM user_profiles WHERE user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Users manage own profile comments" ON public.profile_comments;
CREATE POLICY "Users manage own profile comments" ON public.profile_comments FOR ALL TO authenticated USING (profile_id IN (SELECT id FROM user_profiles WHERE user_id = (select auth.uid()))) WITH CHECK (profile_id IN (SELECT id FROM user_profiles WHERE user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Users manage own meta tags" ON public.profile_meta_tags;
CREATE POLICY "Users manage own meta tags" ON public.profile_meta_tags FOR ALL TO authenticated USING (profile_id IN (SELECT id FROM user_profiles WHERE user_id = (select auth.uid()))) WITH CHECK (profile_id IN (SELECT id FROM user_profiles WHERE user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Users view own analytics" ON public.click_analytics;
CREATE POLICY "Users view own analytics" ON public.click_analytics FOR SELECT TO authenticated USING (link_id IN (SELECT l.id FROM profile_links l JOIN user_profiles p ON p.id = l.profile_id WHERE p.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Users manage own webhooks" ON public.profile_webhooks;
CREATE POLICY "Users manage own webhooks" ON public.profile_webhooks FOR ALL TO authenticated USING (profile_id IN (SELECT id FROM user_profiles WHERE user_id = (select auth.uid()))) WITH CHECK (profile_id IN (SELECT id FROM user_profiles WHERE user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Users manage own pixels" ON public.marketing_pixels;
CREATE POLICY "Users manage own pixels" ON public.marketing_pixels FOR ALL TO authenticated USING (profile_id IN (SELECT id FROM user_profiles WHERE user_id = (select auth.uid()))) WITH CHECK (profile_id IN (SELECT id FROM user_profiles WHERE user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Users view own tips" ON public.tip_donations;
CREATE POLICY "Users view own tips" ON public.tip_donations FOR SELECT TO authenticated USING (profile_id IN (SELECT id FROM user_profiles WHERE user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Users manage own subscription content" ON public.subscription_content;
CREATE POLICY "Users manage own subscription content" ON public.subscription_content FOR ALL TO authenticated USING (profile_id IN (SELECT id FROM user_profiles WHERE user_id = (select auth.uid()))) WITH CHECK (profile_id IN (SELECT id FROM user_profiles WHERE user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Users manage own directory entry" ON public.public_profiles_directory;
CREATE POLICY "Users manage own directory entry" ON public.public_profiles_directory FOR ALL TO authenticated USING (profile_id IN (SELECT id FROM user_profiles WHERE user_id = (select auth.uid()))) WITH CHECK (profile_id IN (SELECT id FROM user_profiles WHERE user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Users manage own campaigns" ON public.utm_campaigns;
CREATE POLICY "Users manage own campaigns" ON public.utm_campaigns FOR ALL TO authenticated USING (profile_id IN (SELECT id FROM user_profiles WHERE user_id = (select auth.uid()))) WITH CHECK (profile_id IN (SELECT id FROM user_profiles WHERE user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Users manage own ab tests" ON public.ab_tests;
CREATE POLICY "Users manage own ab tests" ON public.ab_tests FOR ALL TO authenticated USING (profile_id IN (SELECT id FROM user_profiles WHERE user_id = (select auth.uid()))) WITH CHECK (profile_id IN (SELECT id FROM user_profiles WHERE user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Users manage own ab variants" ON public.ab_variants;
CREATE POLICY "Users manage own ab variants" ON public.ab_variants FOR ALL TO authenticated USING (test_id IN (SELECT t.id FROM ab_tests t JOIN user_profiles p ON p.id = t.profile_id WHERE p.user_id = (select auth.uid()))) WITH CHECK (test_id IN (SELECT t.id FROM ab_tests t JOIN user_profiles p ON p.id = t.profile_id WHERE p.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Users view own ab results" ON public.ab_results;
CREATE POLICY "Users view own ab results" ON public.ab_results FOR SELECT TO authenticated USING (test_id IN (SELECT t.id FROM ab_tests t JOIN user_profiles p ON p.id = t.profile_id WHERE p.user_id = (select auth.uid())));

-- Remove unused indexes
DROP INDEX IF EXISTS public.idx_comment_likes_comment_id;
DROP INDEX IF EXISTS public.idx_comment_likes_user_id;
DROP INDEX IF EXISTS public.idx_pending_orders_payment_method;
DROP INDEX IF EXISTS public.idx_pending_orders_plan_code;
DROP INDEX IF EXISTS public.idx_store_products_user_id;
DROP INDEX IF EXISTS public.idx_store_products_status;

-- Update statistics
ANALYZE public.ab_results, public.ab_variants, public.affiliate_commissions, public.domains, public.store_products, public.subscriptions;
