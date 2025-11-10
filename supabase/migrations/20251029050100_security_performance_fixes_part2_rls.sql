/*
  # Security and Performance Fixes - Part 2: RLS Optimization

  1. RLS Policy Optimization
    - Replaces auth.uid() with (select auth.uid()) in RLS policies
    - Prevents re-evaluation of auth functions for each row
    - Dramatically improves query performance at scale

  2. Tables affected:
    - user_profiles
    - profile_theme_templates
    - profile_applied_templates
    - profile_stories
    - profile_highlights
    - highlight_stories
    - profile_polls
    - poll_options
    - lead_capture_forms
    - form_submissions
    - product_catalog
    - profile_faqs
    - profile_comments
    - profile_meta_tags
    - click_analytics
    - profile_webhooks
    - marketing_pixels
    - profile_admins
    - profile_change_history
    - tip_donations
    - subscription_content
    - content_subscriptions
    - public_profiles_directory
    - utm_campaigns
    - ab_tests
    - ab_variants
    - ab_results
    - domain_transfers

  3. Performance Impact
    - Auth functions called once per query instead of per row
    - Significant performance improvement on large datasets
*/

-- user_profiles
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- profile_theme_templates
DROP POLICY IF EXISTS "Admins can delete templates" ON public.profile_theme_templates;
CREATE POLICY "Admins can delete templates"
  ON public.profile_theme_templates
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.customers
      WHERE id = (select auth.uid())
      AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can insert templates" ON public.profile_theme_templates;
CREATE POLICY "Admins can insert templates"
  ON public.profile_theme_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.customers
      WHERE id = (select auth.uid())
      AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update templates" ON public.profile_theme_templates;
CREATE POLICY "Admins can update templates"
  ON public.profile_theme_templates
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.customers
      WHERE id = (select auth.uid())
      AND role = 'admin'
    )
  );

-- profile_applied_templates
DROP POLICY IF EXISTS "Users can apply templates to own profiles" ON public.profile_applied_templates;
CREATE POLICY "Users can apply templates to own profiles"
  ON public.profile_applied_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = profile_applied_templates.profile_id
      AND user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can delete own applied templates" ON public.profile_applied_templates;
CREATE POLICY "Users can delete own applied templates"
  ON public.profile_applied_templates
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = profile_applied_templates.profile_id
      AND user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update own applied templates" ON public.profile_applied_templates;
CREATE POLICY "Users can update own applied templates"
  ON public.profile_applied_templates
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = profile_applied_templates.profile_id
      AND user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can view own applied templates" ON public.profile_applied_templates;
CREATE POLICY "Users can view own applied templates"
  ON public.profile_applied_templates
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = profile_applied_templates.profile_id
      AND user_id = (select auth.uid())
    )
  );

-- profile_stories
DROP POLICY IF EXISTS "Users can create own stories" ON public.profile_stories;
CREATE POLICY "Users can create own stories"
  ON public.profile_stories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = profile_stories.profile_id
      AND user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can delete own stories" ON public.profile_stories;
CREATE POLICY "Users can delete own stories"
  ON public.profile_stories
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = profile_stories.profile_id
      AND user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update own stories" ON public.profile_stories;
CREATE POLICY "Users can update own stories"
  ON public.profile_stories
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = profile_stories.profile_id
      AND user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can view own stories or public profile stories" ON public.profile_stories;
CREATE POLICY "Users can view own stories or public profile stories"
  ON public.profile_stories
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = profile_stories.profile_id
      AND (up.user_id = (select auth.uid()) OR up.is_public = true)
    )
  );

-- profile_highlights
DROP POLICY IF EXISTS "Users can create own highlights" ON public.profile_highlights;
CREATE POLICY "Users can create own highlights"
  ON public.profile_highlights
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = profile_highlights.profile_id
      AND user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can delete own highlights" ON public.profile_highlights;
CREATE POLICY "Users can delete own highlights"
  ON public.profile_highlights
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = profile_highlights.profile_id
      AND user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update own highlights" ON public.profile_highlights;
CREATE POLICY "Users can update own highlights"
  ON public.profile_highlights
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = profile_highlights.profile_id
      AND user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can view own highlights or public profile highlights" ON public.profile_highlights;
CREATE POLICY "Users can view own highlights or public profile highlights"
  ON public.profile_highlights
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = profile_highlights.profile_id
      AND (up.user_id = (select auth.uid()) OR up.is_public = true)
    )
  );

-- highlight_stories
DROP POLICY IF EXISTS "Users can manage own highlight_stories" ON public.highlight_stories;
CREATE POLICY "Users can manage own highlight_stories"
  ON public.highlight_stories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profile_highlights ph
      JOIN public.user_profiles up ON up.id = ph.profile_id
      WHERE ph.id = highlight_stories.highlight_id
      AND up.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can view highlight_stories" ON public.highlight_stories;
CREATE POLICY "Users can view highlight_stories"
  ON public.highlight_stories
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profile_highlights ph
      JOIN public.user_profiles up ON up.id = ph.profile_id
      WHERE ph.id = highlight_stories.highlight_id
      AND (up.user_id = (select auth.uid()) OR up.is_public = true)
    )
  );

-- profile_polls
DROP POLICY IF EXISTS "Users can manage own polls" ON public.profile_polls;
CREATE POLICY "Users can manage own polls"
  ON public.profile_polls
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = profile_polls.profile_id
      AND user_id = (select auth.uid())
    )
  );

-- poll_options
DROP POLICY IF EXISTS "Users can manage own poll options" ON public.poll_options;
CREATE POLICY "Users can manage own poll options"
  ON public.poll_options
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profile_polls pp
      JOIN public.user_profiles up ON up.id = pp.profile_id
      WHERE pp.id = poll_options.poll_id
      AND up.user_id = (select auth.uid())
    )
  );

-- lead_capture_forms
DROP POLICY IF EXISTS "Users manage own forms" ON public.lead_capture_forms;
CREATE POLICY "Users manage own forms"
  ON public.lead_capture_forms
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = lead_capture_forms.profile_id
      AND user_id = (select auth.uid())
    )
  );

-- form_submissions
DROP POLICY IF EXISTS "Users view own submissions" ON public.form_submissions;
CREATE POLICY "Users view own submissions"
  ON public.form_submissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lead_capture_forms lcf
      JOIN public.user_profiles up ON up.id = lcf.profile_id
      WHERE lcf.id = form_submissions.form_id
      AND up.user_id = (select auth.uid())
    )
  );

-- product_catalog
DROP POLICY IF EXISTS "Users manage own products" ON public.product_catalog;
CREATE POLICY "Users manage own products"
  ON public.product_catalog
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = product_catalog.profile_id
      AND user_id = (select auth.uid())
    )
  );

-- profile_faqs
DROP POLICY IF EXISTS "Users manage own FAQs" ON public.profile_faqs;
CREATE POLICY "Users manage own FAQs"
  ON public.profile_faqs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = profile_faqs.profile_id
      AND user_id = (select auth.uid())
    )
  );

-- profile_comments
DROP POLICY IF EXISTS "Users manage own profile comments" ON public.profile_comments;
CREATE POLICY "Users manage own profile comments"
  ON public.profile_comments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = profile_comments.profile_id
      AND user_id = (select auth.uid())
    )
    OR commenter_id = (select auth.uid())
  );

-- profile_meta_tags
DROP POLICY IF EXISTS "Users manage own meta tags" ON public.profile_meta_tags;
CREATE POLICY "Users manage own meta tags"
  ON public.profile_meta_tags
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = profile_meta_tags.profile_id
      AND user_id = (select auth.uid())
    )
  );

-- click_analytics
DROP POLICY IF EXISTS "Users view own analytics" ON public.click_analytics;
CREATE POLICY "Users view own analytics"
  ON public.click_analytics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profile_links pl
      JOIN public.user_profiles up ON up.id = pl.profile_id
      WHERE pl.id = click_analytics.link_id
      AND up.user_id = (select auth.uid())
    )
  );

-- profile_webhooks
DROP POLICY IF EXISTS "Users manage own webhooks" ON public.profile_webhooks;
CREATE POLICY "Users manage own webhooks"
  ON public.profile_webhooks
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = profile_webhooks.profile_id
      AND user_id = (select auth.uid())
    )
  );

-- marketing_pixels
DROP POLICY IF EXISTS "Users manage own pixels" ON public.marketing_pixels;
CREATE POLICY "Users manage own pixels"
  ON public.marketing_pixels
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = marketing_pixels.profile_id
      AND user_id = (select auth.uid())
    )
  );

-- profile_admins
DROP POLICY IF EXISTS "Profile owners manage admins" ON public.profile_admins;
CREATE POLICY "Profile owners manage admins"
  ON public.profile_admins
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = profile_admins.profile_id
      AND user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can view own profile admins" ON public.profile_admins;
CREATE POLICY "Users can view own profile admins"
  ON public.profile_admins
  FOR SELECT
  TO authenticated
  USING (admin_user_id = (select auth.uid()));

-- profile_change_history
DROP POLICY IF EXISTS "Users view own change history" ON public.profile_change_history;
CREATE POLICY "Users view own change history"
  ON public.profile_change_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = profile_change_history.profile_id
      AND user_id = (select auth.uid())
    )
  );

-- tip_donations
DROP POLICY IF EXISTS "Users view own tips" ON public.tip_donations;
CREATE POLICY "Users view own tips"
  ON public.tip_donations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = tip_donations.profile_id
      AND user_id = (select auth.uid())
    )
    OR sender_id = (select auth.uid())
  );

-- subscription_content
DROP POLICY IF EXISTS "Users manage own subscription content" ON public.subscription_content;
CREATE POLICY "Users manage own subscription content"
  ON public.subscription_content
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = subscription_content.profile_id
      AND user_id = (select auth.uid())
    )
  );

-- content_subscriptions
DROP POLICY IF EXISTS "Users view own content subscriptions" ON public.content_subscriptions;
CREATE POLICY "Users view own content subscriptions"
  ON public.content_subscriptions
  FOR SELECT
  TO authenticated
  USING (subscriber_id = (select auth.uid()));

-- public_profiles_directory
DROP POLICY IF EXISTS "Users manage own directory entry" ON public.public_profiles_directory;
CREATE POLICY "Users manage own directory entry"
  ON public.public_profiles_directory
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = public_profiles_directory.profile_id
      AND user_id = (select auth.uid())
    )
  );

-- utm_campaigns
DROP POLICY IF EXISTS "Users manage own campaigns" ON public.utm_campaigns;
CREATE POLICY "Users manage own campaigns"
  ON public.utm_campaigns
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = utm_campaigns.profile_id
      AND user_id = (select auth.uid())
    )
  );

-- ab_tests
DROP POLICY IF EXISTS "Users manage own ab tests" ON public.ab_tests;
CREATE POLICY "Users manage own ab tests"
  ON public.ab_tests
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = ab_tests.profile_id
      AND user_id = (select auth.uid())
    )
  );

-- ab_variants
DROP POLICY IF EXISTS "Users manage own ab variants" ON public.ab_variants;
CREATE POLICY "Users manage own ab variants"
  ON public.ab_variants
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ab_tests abt
      JOIN public.user_profiles up ON up.id = abt.profile_id
      WHERE abt.id = ab_variants.test_id
      AND up.user_id = (select auth.uid())
    )
  );

-- ab_results
DROP POLICY IF EXISTS "Users view own ab results" ON public.ab_results;
CREATE POLICY "Users view own ab results"
  ON public.ab_results
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ab_tests abt
      JOIN public.user_profiles up ON up.id = abt.profile_id
      WHERE abt.id = ab_results.test_id
      AND up.user_id = (select auth.uid())
    )
  );

-- domain_transfers
DROP POLICY IF EXISTS "Admins have full access to transfers" ON public.domain_transfers;
CREATE POLICY "Admins have full access to transfers"
  ON public.domain_transfers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.customers
      WHERE id = (select auth.uid())
      AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can initiate transfers for owned domains" ON public.domain_transfers;
CREATE POLICY "Users can initiate transfers for owned domains"
  ON public.domain_transfers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.domains d
      WHERE d.id = domain_transfers.domain_id
      AND d.customer_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can view own transfers (from)" ON public.domain_transfers;
CREATE POLICY "Users can view own transfers (from)"
  ON public.domain_transfers
  FOR SELECT
  TO authenticated
  USING (from_customer_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can view own transfers (to)" ON public.domain_transfers;
CREATE POLICY "Users can view own transfers (to)"
  ON public.domain_transfers
  FOR SELECT
  TO authenticated
  USING (to_customer_id = (select auth.uid()));
