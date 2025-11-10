/*
  # Comprehensive Security and Performance Fixes

  This migration addresses critical security and performance issues:

  ## 1. Missing Foreign Key Indexes
  - Add indexes for all unindexed foreign keys to improve join performance

  ## 2. RLS Performance Optimization
  - Wrap all auth.uid() calls in SELECT subqueries to prevent re-evaluation
  - This significantly improves query performance at scale

  ## 3. Unused Index Cleanup
  - Remove unused indexes to reduce storage and write overhead

  ## 4. Function Search Path Security
  - Fix mutable search paths in functions

  ## Security Impact
  - HIGH: Prevents RLS performance degradation at scale
  - MEDIUM: Improves foreign key join performance
  - LOW: Reduces storage overhead
*/

-- =====================================================
-- PART 1: ADD MISSING FOREIGN KEY INDEXES
-- =====================================================

-- chatbot_conversations.customer_id
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_customer_id
ON chatbot_conversations(customer_id);

-- chatbot_handoffs.resolved_by
CREATE INDEX IF NOT EXISTS idx_chatbot_handoffs_resolved_by
ON chatbot_handoffs(resolved_by);

-- social_comment_likes.user_id
CREATE INDEX IF NOT EXISTS idx_social_comment_likes_user_id
ON social_comment_likes(user_id);

-- system_settings.updated_by
CREATE INDEX IF NOT EXISTS idx_system_settings_updated_by
ON system_settings(updated_by);

-- =====================================================
-- PART 2: OPTIMIZE RLS POLICIES - WRAP auth.uid()
-- =====================================================

-- chatbot_settings policies
DROP POLICY IF EXISTS "Admins can manage chatbot settings" ON chatbot_settings;
CREATE POLICY "Admins can manage chatbot settings"
  ON chatbot_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE user_id = (SELECT auth.uid())
      AND role = 'admin'
    )
  );

-- chatbot_intents policies
DROP POLICY IF EXISTS "Admins can manage intents" ON chatbot_intents;
CREATE POLICY "Admins can manage intents"
  ON chatbot_intents
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE user_id = (SELECT auth.uid())
      AND role = 'admin'
    )
  );

-- profile_links policies
DROP POLICY IF EXISTS "Users can delete own links" ON profile_links;
CREATE POLICY "Users can delete own links"
  ON profile_links
  FOR DELETE
  TO authenticated
  USING (
    profile_id IN (
      SELECT id FROM user_profiles
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert own links" ON profile_links;
CREATE POLICY "Users can insert own links"
  ON profile_links
  FOR INSERT
  TO authenticated
  WITH CHECK (
    profile_id IN (
      SELECT id FROM user_profiles
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update own links" ON profile_links;
CREATE POLICY "Users can update own links"
  ON profile_links
  FOR UPDATE
  TO authenticated
  USING (
    profile_id IN (
      SELECT id FROM user_profiles
      WHERE user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    profile_id IN (
      SELECT id FROM user_profiles
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can view own links" ON profile_links;
CREATE POLICY "Users can view own links"
  ON profile_links
  FOR SELECT
  TO authenticated
  USING (
    profile_id IN (
      SELECT id FROM user_profiles
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- user_profiles policies
DROP POLICY IF EXISTS "Admins can control feature permissions" ON user_profiles;
CREATE POLICY "Admins can control feature permissions"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE user_id = (SELECT auth.uid())
      AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can update own feature controls" ON user_profiles;
CREATE POLICY "Users can update own feature controls"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "auth_delete_own_profile" ON user_profiles;
CREATE POLICY "auth_delete_own_profile"
  ON user_profiles
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "auth_insert_own_profile" ON user_profiles;
CREATE POLICY "auth_insert_own_profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "auth_update_own_profile" ON user_profiles;
CREATE POLICY "auth_update_own_profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "auth_view_own_profile" ON user_profiles;
CREATE POLICY "auth_view_own_profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- chatbot_conversations policies
DROP POLICY IF EXISTS "Users can update own conversations" ON chatbot_conversations;
CREATE POLICY "Users can update own conversations"
  ON chatbot_conversations
  FOR UPDATE
  TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM customers
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can view own conversations" ON chatbot_conversations;
CREATE POLICY "Users can view own conversations"
  ON chatbot_conversations
  FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM customers
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- chatbot_messages policies
DROP POLICY IF EXISTS "Users can view messages from own conversations" ON chatbot_messages;
CREATE POLICY "Users can view messages from own conversations"
  ON chatbot_messages
  FOR SELECT
  TO authenticated
  USING (
    conversation_id IN (
      SELECT id FROM chatbot_conversations
      WHERE customer_id IN (
        SELECT id FROM customers
        WHERE user_id = (SELECT auth.uid())
      )
    )
  );

-- system_settings policies
DROP POLICY IF EXISTS "Admins can update system settings" ON system_settings;
CREATE POLICY "Admins can update system settings"
  ON system_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE user_id = (SELECT auth.uid())
      AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can view system settings" ON system_settings;
CREATE POLICY "Admins can view system settings"
  ON system_settings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE user_id = (SELECT auth.uid())
      AND role = 'admin'
    )
  );

-- content_subscriptions policies (skip - no user_id column)

-- domain_suggestions policies
DROP POLICY IF EXISTS "Admins can create domain suggestions" ON domain_suggestions;
CREATE POLICY "Admins can create domain suggestions"
  ON domain_suggestions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers
      WHERE user_id = (SELECT auth.uid())
      AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can delete domain suggestions" ON domain_suggestions;
CREATE POLICY "Admins can delete domain suggestions"
  ON domain_suggestions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE user_id = (SELECT auth.uid())
      AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update domain suggestions" ON domain_suggestions;
CREATE POLICY "Admins can update domain suggestions"
  ON domain_suggestions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE user_id = (SELECT auth.uid())
      AND role = 'admin'
    )
  );

-- chatbot_analytics policies
DROP POLICY IF EXISTS "Admins can manage analytics" ON chatbot_analytics;
CREATE POLICY "Admins can manage analytics"
  ON chatbot_analytics
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE user_id = (SELECT auth.uid())
      AND role = 'admin'
    )
  );

-- chatbot_handoffs policies
DROP POLICY IF EXISTS "Staff can update handoffs" ON chatbot_handoffs;
CREATE POLICY "Staff can update handoffs"
  ON chatbot_handoffs
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE user_id = (SELECT auth.uid())
      AND role IN ('admin', 'staff')
    )
  );

DROP POLICY IF EXISTS "Users can view own handoffs" ON chatbot_handoffs;
CREATE POLICY "Users can view own handoffs"
  ON chatbot_handoffs
  FOR SELECT
  TO authenticated
  USING (
    conversation_id IN (
      SELECT id FROM chatbot_conversations
      WHERE customer_id IN (
        SELECT id FROM customers
        WHERE user_id = (SELECT auth.uid())
      )
    )
  );

-- chatbot_feedback policies
DROP POLICY IF EXISTS "Admins can view all feedback" ON chatbot_feedback;
CREATE POLICY "Admins can view all feedback"
  ON chatbot_feedback
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE user_id = (SELECT auth.uid())
      AND role = 'admin'
    )
  );

-- =====================================================
-- PART 3: REMOVE UNUSED INDEXES
-- =====================================================

-- Drop unused indexes to reduce storage and write overhead
DROP INDEX IF EXISTS idx_domains_display_order;
DROP INDEX IF EXISTS idx_profile_links_profile_id;
DROP INDEX IF EXISTS idx_profile_links_sort_order;
DROP INDEX IF EXISTS idx_chatbot_conversations_session;
DROP INDEX IF EXISTS idx_chatbot_conversations_user;
DROP INDEX IF EXISTS idx_chatbot_conversations_status;
DROP INDEX IF EXISTS idx_chatbot_conversations_activity;
DROP INDEX IF EXISTS idx_chatbot_messages_conversation;
DROP INDEX IF EXISTS idx_chatbot_messages_created;
DROP INDEX IF EXISTS idx_chatbot_messages_intent;
DROP INDEX IF EXISTS idx_user_profiles_store_enabled;
DROP INDEX IF EXISTS idx_user_profiles_social_enabled;
DROP INDEX IF EXISTS idx_user_profiles_is_public;
DROP INDEX IF EXISTS idx_articles_popular;
DROP INDEX IF EXISTS idx_articles_published;
DROP INDEX IF EXISTS idx_chatbot_handoffs_conversation;
DROP INDEX IF EXISTS idx_chatbot_handoffs_resolved;
DROP INDEX IF EXISTS idx_system_settings_features;
DROP INDEX IF EXISTS idx_ab_results_test_id;
DROP INDEX IF EXISTS idx_ab_results_variant_id;
DROP INDEX IF EXISTS idx_ab_variants_test_id;
DROP INDEX IF EXISTS idx_affiliate_commissions_order_id;
DROP INDEX IF EXISTS idx_domain_catalog_owner_user_id;
DROP INDEX IF EXISTS idx_domain_transfers_domain_id;
DROP INDEX IF EXISTS idx_domain_transfers_from_customer_id;
DROP INDEX IF EXISTS idx_domain_transfers_payment_id;
DROP INDEX IF EXISTS idx_domain_transfers_to_customer_id;
DROP INDEX IF EXISTS idx_domains_customer_id;
DROP INDEX IF EXISTS idx_form_submissions_form_id;
DROP INDEX IF EXISTS idx_highlight_stories_story_id;
DROP INDEX IF EXISTS idx_invoices_order_id;
DROP INDEX IF EXISTS idx_pending_orders_user_id;
DROP INDEX IF EXISTS idx_licensing_requests_customer_id;
DROP INDEX IF EXISTS idx_licensing_requests_fqdn;
DROP INDEX IF EXISTS idx_licensing_requests_reviewed_by;
DROP INDEX IF EXISTS idx_licensing_requests_user_id;
DROP INDEX IF EXISTS idx_physical_cards_subscription_id;
DROP INDEX IF EXISTS idx_physical_cards_user_id;
DROP INDEX IF EXISTS idx_poll_options_poll_id;
DROP INDEX IF EXISTS idx_poll_votes_option_id;
DROP INDEX IF EXISTS idx_poll_votes_poll_id;
DROP INDEX IF EXISTS idx_premium_domain_purchases_customer_id;
DROP INDEX IF EXISTS idx_premium_domains_owner_id;
DROP INDEX IF EXISTS idx_premium_payment_history_purchase_id;
DROP INDEX IF EXISTS idx_profile_admins_invited_by;
DROP INDEX IF EXISTS idx_profile_admins_user_id;
DROP INDEX IF EXISTS idx_profile_applied_templates_template_id;
DROP INDEX IF EXISTS idx_profile_change_history_user_id;
DROP INDEX IF EXISTS idx_recovery_codes_user_id;
DROP INDEX IF EXISTS idx_social_bookmarks_post_id;
DROP INDEX IF EXISTS idx_social_comments_parent_comment_id;
DROP INDEX IF EXISTS idx_social_comments_user_id;
DROP INDEX IF EXISTS idx_social_notifications_actor_id;
DROP INDEX IF EXISTS idx_social_notifications_comment_id;
DROP INDEX IF EXISTS idx_social_notifications_post_id;
DROP INDEX IF EXISTS idx_social_notifications_user_id;
DROP INDEX IF EXISTS idx_social_reports_reported_comment_id;
DROP INDEX IF EXISTS idx_social_reports_reported_post_id;
DROP INDEX IF EXISTS idx_social_reports_reported_user_id;
DROP INDEX IF EXISTS idx_social_reports_reporter_id;
DROP INDEX IF EXISTS idx_social_reports_reviewed_by;
DROP INDEX IF EXISTS idx_social_shares_user_id;
DROP INDEX IF EXISTS idx_subdomains_user_id;
DROP INDEX IF EXISTS idx_subscriptions_plan_id;
DROP INDEX IF EXISTS idx_subscriptions_referred_by;
DROP INDEX IF EXISTS idx_subscriptions_trial;
DROP INDEX IF EXISTS idx_domain_suggestions_category;
DROP INDEX IF EXISTS idx_domain_suggestions_status;
DROP INDEX IF EXISTS idx_domain_suggestions_domain_name;
DROP INDEX IF EXISTS idx_domain_suggestions_popularity;
DROP INDEX IF EXISTS idx_chatbot_feedback_message;
DROP INDEX IF EXISTS idx_chatbot_feedback_conversation;
DROP INDEX IF EXISTS idx_chatbot_analytics_date;
DROP INDEX IF EXISTS idx_chatbot_analytics_metric;

-- =====================================================
-- PART 4: FIX FUNCTION SEARCH PATHS
-- =====================================================

-- Drop functions first to allow parameter name changes
DROP FUNCTION IF EXISTS increment_link_clicks(uuid);
DROP FUNCTION IF EXISTS count_user_links(uuid);

-- Fix update_profile_links_updated_at
CREATE OR REPLACE FUNCTION update_profile_links_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix update_conversation_activity
CREATE OR REPLACE FUNCTION update_conversation_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE chatbot_conversations
  SET last_activity_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

-- Fix increment_link_clicks
CREATE OR REPLACE FUNCTION increment_link_clicks(link_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE profile_links
  SET click_count = click_count + 1
  WHERE id = link_id_param;
END;
$$;

-- Fix count_user_links
CREATE OR REPLACE FUNCTION count_user_links(profile_id_param uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  link_count integer;
BEGIN
  SELECT COUNT(*) INTO link_count
  FROM profile_links
  WHERE profile_id = profile_id_param;

  RETURN link_count;
END;
$$;

-- Fix check_links_limit
CREATE OR REPLACE FUNCTION check_links_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  current_count integer;
  max_links integer;
BEGIN
  SELECT COUNT(*) INTO current_count
  FROM profile_links
  WHERE profile_id = NEW.profile_id;

  max_links := 50;

  IF current_count >= max_links THEN
    RAISE EXCEPTION 'Link limit reached for this profile';
  END IF;

  RETURN NEW;
END;
$$;

-- Fix update_domain_suggestions_updated_at
CREATE OR REPLACE FUNCTION update_domain_suggestions_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix log_chatbot_metric
CREATE OR REPLACE FUNCTION log_chatbot_metric(
  metric_name_param text,
  metric_value_param integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO chatbot_analytics (metric_name, metric_value, recorded_at)
  VALUES (metric_name_param, metric_value_param, now());
END;
$$;
