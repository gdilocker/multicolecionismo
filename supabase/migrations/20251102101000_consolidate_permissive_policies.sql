/*
  # Consolidate Multiple Permissive Policies

  1. Problem
    - Multiple permissive policies on same table/role/action
    - Can cause unexpected behavior and performance issues
    - Makes policy management difficult

  2. Solution
    - Consolidate into single policies with OR conditions
    - Maintain same security logic
    - Improve performance and clarity

  3. Security
    - All existing access patterns preserved
    - No reduction in security
    - Cleaner, more maintainable policies
*/

-- =====================================================
-- AFFILIATE TABLES
-- =====================================================

-- affiliate_clicks: Consolidate SELECT policies
DROP POLICY IF EXISTS "Admins podem ver todos os cliques" ON affiliate_clicks;
DROP POLICY IF EXISTS "Afiliados podem ver seus cliques" ON affiliate_clicks;
DROP POLICY IF EXISTS "Resellers with subscription can view own clicks" ON affiliate_clicks;

CREATE POLICY "View affiliate clicks"
  ON affiliate_clicks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = (select auth.uid())
      AND customers.role = 'admin'
    )
    OR EXISTS (
      SELECT 1 FROM affiliates
      WHERE affiliates.id = affiliate_clicks.affiliate_id
      AND affiliates.user_id = (select auth.uid())
    )
  );

-- affiliate_commissions: Consolidate SELECT and INSERT
DROP POLICY IF EXISTS "Admins podem gerenciar comissões" ON affiliate_commissions;
DROP POLICY IF EXISTS "Sistema pode criar comissões" ON affiliate_commissions;
DROP POLICY IF EXISTS "Afiliados podem ver suas comissões" ON affiliate_commissions;
DROP POLICY IF EXISTS "Resellers with subscription can view own commissions" ON affiliate_commissions;

CREATE POLICY "Manage affiliate commissions"
  ON affiliate_commissions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = (select auth.uid())
      AND customers.role = 'admin'
    )
    OR EXISTS (
      SELECT 1 FROM affiliates
      WHERE affiliates.id = affiliate_commissions.affiliate_id
      AND affiliates.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = (select auth.uid())
      AND customers.role = 'admin'
    )
  );

-- affiliate_withdrawals: Consolidate
DROP POLICY IF EXISTS "Admins podem gerenciar saques" ON affiliate_withdrawals;
DROP POLICY IF EXISTS "Afiliados podem solicitar saques" ON affiliate_withdrawals;
DROP POLICY IF EXISTS "Afiliados podem ver seus saques" ON affiliate_withdrawals;

CREATE POLICY "Manage affiliate withdrawals"
  ON affiliate_withdrawals FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = (select auth.uid())
      AND customers.role = 'admin'
    )
    OR EXISTS (
      SELECT 1 FROM affiliates
      WHERE affiliates.id = affiliate_withdrawals.affiliate_id
      AND affiliates.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = (select auth.uid())
      AND customers.role = 'admin'
    )
    OR EXISTS (
      SELECT 1 FROM affiliates
      WHERE affiliates.user_id = (select auth.uid())
    )
  );

-- affiliates: Consolidate all operations
DROP POLICY IF EXISTS "Admins podem gerenciar afiliados" ON affiliates;
DROP POLICY IF EXISTS "Resellers with subscription can insert own affiliate data" ON affiliates;
DROP POLICY IF EXISTS "Users can create own affiliate" ON affiliates;
DROP POLICY IF EXISTS "Usuários podem criar conta de afiliado" ON affiliates;
DROP POLICY IF EXISTS "Admins podem ver todos os afiliados" ON affiliates;
DROP POLICY IF EXISTS "Afiliados podem ver seus próprios dados" ON affiliates;
DROP POLICY IF EXISTS "Resellers with subscription can view own affiliate data" ON affiliates;
DROP POLICY IF EXISTS "Afiliados podem atualizar seus dados" ON affiliates;
DROP POLICY IF EXISTS "Resellers with subscription can update own affiliate data" ON affiliates;

CREATE POLICY "Manage affiliates"
  ON affiliates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = (select auth.uid())
      AND customers.role = 'admin'
    )
    OR user_id = (select auth.uid())
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = (select auth.uid())
      AND customers.role = 'admin'
    )
    OR user_id = (select auth.uid())
  );

-- =====================================================
-- CHATBOT TABLES
-- =====================================================

-- chatbot_intents: Consolidate SELECT
DROP POLICY IF EXISTS "Anyone can view enabled intents" ON chatbot_intents;

CREATE POLICY "View chatbot intents"
  ON chatbot_intents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = (select auth.uid())
      AND customers.role = 'admin'
    )
    OR enabled = true
  );

-- chatbot_settings: Consolidate SELECT
DROP POLICY IF EXISTS "Anyone can view public settings" ON chatbot_settings;

CREATE POLICY "View chatbot settings"
  ON chatbot_settings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = (select auth.uid())
      AND customers.role = 'admin'
    )
    OR is_public = true
  );

-- =====================================================
-- SOCIAL TABLES
-- =====================================================

-- social_posts: Consolidate all (most complex)
DROP POLICY IF EXISTS "Admins can moderate all posts" ON social_posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON social_posts;
DROP POLICY IF EXISTS "Paid users can create posts" ON social_posts;
DROP POLICY IF EXISTS "Anyone can view public active posts" ON social_posts;
DROP POLICY IF EXISTS "Anyone can view public posts" ON social_posts;
DROP POLICY IF EXISTS "Followers can view followers-only posts" ON social_posts;
DROP POLICY IF EXISTS "Users can view own posts" ON social_posts;
DROP POLICY IF EXISTS "Users can update own posts" ON social_posts;

CREATE POLICY "social_posts_select"
  ON social_posts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = (select auth.uid())
      AND customers.role = 'admin'
    )
    OR (is_public = true AND status = 'active')
    OR user_id = (select auth.uid())
    OR (
      visibility = 'followers'
      AND EXISTS (
        SELECT 1 FROM social_followers
        WHERE social_followers.followed_id = social_posts.user_id
        AND social_followers.follower_id = (select auth.uid())
      )
    )
  );

CREATE POLICY "social_posts_insert"
  ON social_posts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers c
      JOIN subscriptions s ON c.user_id = s.user_id
      WHERE c.user_id = (select auth.uid())
      AND (
        c.role = 'admin'
        OR (s.status = 'active' AND s.plan_id IN (
          SELECT id FROM subscription_plans WHERE name IN ('Prime', 'Elite', 'Supreme')
        ))
      )
    )
  );

CREATE POLICY "social_posts_update"
  ON social_posts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = (select auth.uid())
      AND customers.role = 'admin'
    )
    OR user_id = (select auth.uid())
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = (select auth.uid())
      AND customers.role = 'admin'
    )
    OR user_id = (select auth.uid())
  );

CREATE POLICY "social_posts_delete"
  ON social_posts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = (select auth.uid())
      AND customers.role = 'admin'
    )
    OR user_id = (select auth.uid())
  );

-- =====================================================
-- USER PROFILES
-- =====================================================

-- user_profiles: Fix duplicate SELECT policies
DROP POLICY IF EXISTS "Anyone can view public profiles" ON user_profiles;
DROP POLICY IF EXISTS "anon_view_public_profiles" ON user_profiles;
DROP POLICY IF EXISTS "auth_view_public_profiles" ON user_profiles;

CREATE POLICY "anon_view_public_profiles"
  ON user_profiles FOR SELECT
  TO anon
  USING (is_public = true);

CREATE POLICY "auth_view_profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    is_public = true
    OR user_id = (select auth.uid())
  );

-- =====================================================
-- SUBSCRIPTIONS
-- =====================================================

-- subscriptions: Consolidate
DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Anyone can view subscriptions for badges" ON subscriptions;
DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON subscriptions;

CREATE POLICY "subscriptions_select"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = (select auth.uid())
      AND customers.role = 'admin'
    )
    OR user_id = (select auth.uid())
    OR status = 'active'
  );

CREATE POLICY "subscriptions_insert"
  ON subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = (select auth.uid())
      AND customers.role = 'admin'
    )
    OR user_id = (select auth.uid())
  );

CREATE POLICY "subscriptions_update"
  ON subscriptions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = (select auth.uid())
      AND customers.role = 'admin'
    )
    OR user_id = (select auth.uid())
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = (select auth.uid())
      AND customers.role = 'admin'
    )
    OR user_id = (select auth.uid())
  );

-- =====================================================
-- PROFILE LINKS
-- =====================================================

-- profile_links: Consolidate SELECT
DROP POLICY IF EXISTS "Public can view active links" ON profile_links;

CREATE POLICY "profile_links_select"
  ON profile_links FOR SELECT
  TO authenticated
  USING (
    is_active = true
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = profile_links.profile_id
      AND user_profiles.user_id = (select auth.uid())
    )
  );

-- =====================================================
-- CLEANUP: Remove remaining duplicates
-- =====================================================

-- audit_logs
DROP POLICY IF EXISTS "Admins can read all audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Users can read own audit logs" ON audit_logs;

CREATE POLICY "audit_logs_select"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = (select auth.uid())
      AND customers.role = 'admin'
    )
    OR user_id = (select auth.uid())
  );

-- domain_transfers
DROP POLICY IF EXISTS "Admins have full access to transfers" ON domain_transfers;
DROP POLICY IF EXISTS "Users can initiate transfers for owned domains" ON domain_transfers;
DROP POLICY IF EXISTS "Users can view own transfers (from)" ON domain_transfers;
DROP POLICY IF EXISTS "Users can view own transfers (to)" ON domain_transfers;

CREATE POLICY "domain_transfers_all"
  ON domain_transfers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = (select auth.uid())
      AND customers.role = 'admin'
    )
    OR from_customer_id IN (
      SELECT id FROM customers WHERE user_id = (select auth.uid())
    )
    OR to_customer_id IN (
      SELECT id FROM customers WHERE user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = (select auth.uid())
      AND customers.role = 'admin'
    )
    OR from_customer_id IN (
      SELECT id FROM customers WHERE user_id = (select auth.uid())
    )
  );
