/*
  # Fix RLS Performance Issues - Auth Function Optimization

  1. Problem
    - Multiple RLS policies re-evaluate auth.<function>() for each row
    - This causes suboptimal query performance at scale

  2. Solution
    - Replace direct auth.<function>() calls with (SELECT auth.<function>())
    - This evaluates the function once per query instead of per row

  3. Tables Fixed
    - profile_highlights (4 policies)
    - highlight_stories (2 policies)
    - profile_polls (1 policy)
    - poll_options (1 policy)
    - lead_capture_forms (1 policy)
    - form_submissions (1 policy)
    - product_catalog (1 policy)
    - profile_faqs (1 policy)
    - profile_comments (1 policy)
    - profile_meta_tags (1 policy)
    - click_analytics (1 policy)
    - profile_webhooks (1 policy)
    - marketing_pixels (1 policy)
    - profile_admins (2 policies)
    - profile_change_history (1 policy)
    - tip_donations (1 policy)
    - subscription_content (1 policy)
    - content_subscriptions (1 policy)
    - public_profiles_directory (1 policy)
    - utm_campaigns (1 policy)
    - ab_tests (1 policy)
    - ab_variants (1 policy)
    - ab_results (1 policy)
    - domain_transfers (4 policies)
*/

-- profile_highlights policies
DROP POLICY IF EXISTS "Users can create own highlights" ON public.profile_highlights;
CREATE POLICY "Users can create own highlights"
  ON public.profile_highlights
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete own highlights" ON public.profile_highlights;
CREATE POLICY "Users can delete own highlights"
  ON public.profile_highlights
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own highlights" ON public.profile_highlights;
CREATE POLICY "Users can update own highlights"
  ON public.profile_highlights
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can view own highlights or public profile highlights" ON public.profile_highlights;
CREATE POLICY "Users can view own highlights or public profile highlights"
  ON public.profile_highlights
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid()) OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = profile_highlights.user_id
      AND user_profiles.is_public = true
    )
  );

-- highlight_stories policies
DROP POLICY IF EXISTS "Users can manage own highlight_stories" ON public.highlight_stories;
CREATE POLICY "Users can manage own highlight_stories"
  ON public.highlight_stories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profile_highlights
      WHERE profile_highlights.id = highlight_stories.highlight_id
      AND profile_highlights.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can view highlight_stories" ON public.highlight_stories;
CREATE POLICY "Users can view highlight_stories"
  ON public.highlight_stories
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profile_highlights ph
      JOIN user_profiles up ON ph.user_id = up.user_id
      WHERE ph.id = highlight_stories.highlight_id
      AND (up.is_public = true OR up.user_id = (SELECT auth.uid()))
    )
  );

-- profile_polls policies
DROP POLICY IF EXISTS "Users can manage own polls" ON public.profile_polls;
CREATE POLICY "Users can manage own polls"
  ON public.profile_polls
  FOR ALL
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- poll_options policies
DROP POLICY IF EXISTS "Users can manage own poll options" ON public.poll_options;
CREATE POLICY "Users can manage own poll options"
  ON public.poll_options
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profile_polls
      WHERE profile_polls.id = poll_options.poll_id
      AND profile_polls.user_id = (SELECT auth.uid())
    )
  );

-- lead_capture_forms policies
DROP POLICY IF EXISTS "Users manage own forms" ON public.lead_capture_forms;
CREATE POLICY "Users manage own forms"
  ON public.lead_capture_forms
  FOR ALL
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- form_submissions policies
DROP POLICY IF EXISTS "Users view own submissions" ON public.form_submissions;
CREATE POLICY "Users view own submissions"
  ON public.form_submissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lead_capture_forms
      WHERE lead_capture_forms.id = form_submissions.form_id
      AND lead_capture_forms.user_id = (SELECT auth.uid())
    )
  );

-- product_catalog policies
DROP POLICY IF EXISTS "Users manage own products" ON public.product_catalog;
CREATE POLICY "Users manage own products"
  ON public.product_catalog
  FOR ALL
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- profile_faqs policies
DROP POLICY IF EXISTS "Users manage own FAQs" ON public.profile_faqs;
CREATE POLICY "Users manage own FAQs"
  ON public.profile_faqs
  FOR ALL
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- profile_comments policies
DROP POLICY IF EXISTS "Users manage own profile comments" ON public.profile_comments;
CREATE POLICY "Users manage own profile comments"
  ON public.profile_comments
  FOR ALL
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- profile_meta_tags policies
DROP POLICY IF EXISTS "Users manage own meta tags" ON public.profile_meta_tags;
CREATE POLICY "Users manage own meta tags"
  ON public.profile_meta_tags
  FOR ALL
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- click_analytics policies
DROP POLICY IF EXISTS "Users view own analytics" ON public.click_analytics;
CREATE POLICY "Users view own analytics"
  ON public.click_analytics
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- profile_webhooks policies
DROP POLICY IF EXISTS "Users manage own webhooks" ON public.profile_webhooks;
CREATE POLICY "Users manage own webhooks"
  ON public.profile_webhooks
  FOR ALL
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- marketing_pixels policies
DROP POLICY IF EXISTS "Users manage own pixels" ON public.marketing_pixels;
CREATE POLICY "Users manage own pixels"
  ON public.marketing_pixels
  FOR ALL
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- profile_admins policies
DROP POLICY IF EXISTS "Profile owners manage admins" ON public.profile_admins;
CREATE POLICY "Profile owners manage admins"
  ON public.profile_admins
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = profile_admins.profile_id
      AND user_profiles.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can view own profile admins" ON public.profile_admins;
CREATE POLICY "Users can view own profile admins"
  ON public.profile_admins
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- profile_change_history policies
DROP POLICY IF EXISTS "Users view own change history" ON public.profile_change_history;
CREATE POLICY "Users view own change history"
  ON public.profile_change_history
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- tip_donations policies
DROP POLICY IF EXISTS "Users view own tips" ON public.tip_donations;
CREATE POLICY "Users view own tips"
  ON public.tip_donations
  FOR SELECT
  TO authenticated
  USING (
    recipient_user_id = (SELECT auth.uid()) OR
    donor_user_id = (SELECT auth.uid())
  );

-- subscription_content policies
DROP POLICY IF EXISTS "Users manage own subscription content" ON public.subscription_content;
CREATE POLICY "Users manage own subscription content"
  ON public.subscription_content
  FOR ALL
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- content_subscriptions policies
DROP POLICY IF EXISTS "Users view own content subscriptions" ON public.content_subscriptions;
CREATE POLICY "Users view own content subscriptions"
  ON public.content_subscriptions
  FOR SELECT
  TO authenticated
  USING (subscriber_user_id = (SELECT auth.uid()));

-- public_profiles_directory policies
DROP POLICY IF EXISTS "Users manage own directory entry" ON public.public_profiles_directory;
CREATE POLICY "Users manage own directory entry"
  ON public.public_profiles_directory
  FOR ALL
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- utm_campaigns policies
DROP POLICY IF EXISTS "Users manage own campaigns" ON public.utm_campaigns;
CREATE POLICY "Users manage own campaigns"
  ON public.utm_campaigns
  FOR ALL
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ab_tests policies
DROP POLICY IF EXISTS "Users manage own ab tests" ON public.ab_tests;
CREATE POLICY "Users manage own ab tests"
  ON public.ab_tests
  FOR ALL
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ab_variants policies
DROP POLICY IF EXISTS "Users manage own ab variants" ON public.ab_variants;
CREATE POLICY "Users manage own ab variants"
  ON public.ab_variants
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ab_tests
      WHERE ab_tests.id = ab_variants.test_id
      AND ab_tests.user_id = (SELECT auth.uid())
    )
  );

-- ab_results policies
DROP POLICY IF EXISTS "Users view own ab results" ON public.ab_results;
CREATE POLICY "Users view own ab results"
  ON public.ab_results
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ab_tests
      WHERE ab_tests.id = ab_results.test_id
      AND ab_tests.user_id = (SELECT auth.uid())
    )
  );

-- domain_transfers policies
DROP POLICY IF EXISTS "Admins have full access to transfers" ON public.domain_transfers;
CREATE POLICY "Admins have full access to transfers"
  ON public.domain_transfers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = (SELECT auth.uid())
      AND customers.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can initiate transfers for owned domains" ON public.domain_transfers;
CREATE POLICY "Users can initiate transfers for owned domains"
  ON public.domain_transfers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM domains
      WHERE domains.id = domain_transfers.domain_id
      AND domains.customer_id IN (
        SELECT id FROM customers WHERE user_id = (SELECT auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "Users can view own transfers (from)" ON public.domain_transfers;
CREATE POLICY "Users can view own transfers (from)"
  ON public.domain_transfers
  FOR SELECT
  TO authenticated
  USING (
    from_customer_id IN (
      SELECT id FROM customers WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can view own transfers (to)" ON public.domain_transfers;
CREATE POLICY "Users can view own transfers (to)"
  ON public.domain_transfers
  FOR SELECT
  TO authenticated
  USING (
    to_customer_id IN (
      SELECT id FROM customers WHERE user_id = (SELECT auth.uid())
    )
  );
