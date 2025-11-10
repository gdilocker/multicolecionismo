/*
  # RLS Policy Optimization - Part 2

  1. Optimizations
    - Continue optimizing RLS policies with (select auth.uid())
    - Fix remaining performance issues

  2. Tables Covered
    - domain_catalog
    - reserved_keywords
    - subdomains
    - physical_cards
    - profile_links
    - affiliates
    - cart_items
    - social tables
*/

-- =====================================================
-- DOMAIN_CATALOG
-- =====================================================

DROP POLICY IF EXISTS "Admins can delete domains" ON public.domain_catalog;
DROP POLICY IF EXISTS "Admins can insert domains" ON public.domain_catalog;
DROP POLICY IF EXISTS "Admins can update domains" ON public.domain_catalog;

CREATE POLICY "Admins can delete domains"
  ON public.domain_catalog FOR DELETE
  TO authenticated
  USING (public.get_user_role((select auth.uid())) = 'admin');

CREATE POLICY "Admins can insert domains"
  ON public.domain_catalog FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role((select auth.uid())) = 'admin');

CREATE POLICY "Admins can update domains"
  ON public.domain_catalog FOR UPDATE
  TO authenticated
  USING (public.get_user_role((select auth.uid())) = 'admin');

-- =====================================================
-- RESERVED_KEYWORDS
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage reserved keywords" ON public.reserved_keywords;

CREATE POLICY "Admins can manage reserved keywords"
  ON public.reserved_keywords
  TO authenticated
  USING (public.get_user_role((select auth.uid())) = 'admin');

-- =====================================================
-- PRICING_PLANS
-- =====================================================

DROP POLICY IF EXISTS "Only admins can insert pricing plans" ON public.pricing_plans;

CREATE POLICY "Only admins can insert pricing plans"
  ON public.pricing_plans FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role((select auth.uid())) = 'admin');

-- =====================================================
-- PROFILE_STATS
-- =====================================================

DROP POLICY IF EXISTS "Users can view own profile stats" ON public.profile_stats;

CREATE POLICY "Users can view own profile stats"
  ON public.profile_stats FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

-- =====================================================
-- SUBDOMAINS
-- =====================================================

DROP POLICY IF EXISTS "Users can delete own subdomains" ON public.subdomains;
DROP POLICY IF EXISTS "Users can insert own subdomains" ON public.subdomains;
DROP POLICY IF EXISTS "Users can update own subdomains" ON public.subdomains;
DROP POLICY IF EXISTS "Users can view own subdomains" ON public.subdomains;

CREATE POLICY "Users can delete own subdomains"
  ON public.subdomains FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own subdomains"
  ON public.subdomains FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own subdomains"
  ON public.subdomains FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can view own subdomains"
  ON public.subdomains FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

-- =====================================================
-- PHYSICAL_CARDS
-- =====================================================

DROP POLICY IF EXISTS "Users can delete own physical cards" ON public.physical_cards;
DROP POLICY IF EXISTS "Users can insert own physical cards" ON public.physical_cards;
DROP POLICY IF EXISTS "Users can update own physical cards" ON public.physical_cards;
DROP POLICY IF EXISTS "Users can view own physical cards" ON public.physical_cards;

CREATE POLICY "Users can delete own physical cards"
  ON public.physical_cards FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own physical cards"
  ON public.physical_cards FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own physical cards"
  ON public.physical_cards FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can view own physical cards"
  ON public.physical_cards FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

-- =====================================================
-- PROFILE_LINKS
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage all system links" ON public.profile_links;
DROP POLICY IF EXISTS "Users can delete own non-system profile links" ON public.profile_links;
DROP POLICY IF EXISTS "Users can manage own profile links" ON public.profile_links;
DROP POLICY IF EXISTS "Users can update own non-system profile links" ON public.profile_links;

CREATE POLICY "Admins can manage all system links"
  ON public.profile_links
  TO authenticated
  USING (public.get_user_role((select auth.uid())) = 'admin');

CREATE POLICY "Users can delete own non-system profile links"
  ON public.profile_links FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = profile_links.profile_id
      AND user_profiles.user_id = (select auth.uid())
    ) AND NOT is_system_link
  );

CREATE POLICY "Users can manage own profile links"
  ON public.profile_links
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = profile_links.profile_id
      AND user_profiles.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update own non-system profile links"
  ON public.profile_links FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = profile_links.profile_id
      AND user_profiles.user_id = (select auth.uid())
    ) AND NOT is_system_link
  );

-- =====================================================
-- ADMIN_SETTINGS
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage settings" ON public.admin_settings;

CREATE POLICY "Admins can manage settings"
  ON public.admin_settings
  TO authenticated
  USING (public.get_user_role((select auth.uid())) = 'admin');

-- =====================================================
-- AFFILIATES
-- =====================================================

DROP POLICY IF EXISTS "Admins podem gerenciar afiliados" ON public.affiliates;
DROP POLICY IF EXISTS "Admins podem ver todos os afiliados" ON public.affiliates;
DROP POLICY IF EXISTS "Afiliados podem atualizar seus dados" ON public.affiliates;
DROP POLICY IF EXISTS "Afiliados podem ver seus próprios dados" ON public.affiliates;
DROP POLICY IF EXISTS "Resellers with subscription can insert own affiliate data" ON public.affiliates;
DROP POLICY IF EXISTS "Resellers with subscription can update own affiliate data" ON public.affiliates;
DROP POLICY IF EXISTS "Resellers with subscription can view own affiliate data" ON public.affiliates;
DROP POLICY IF EXISTS "Users can create own affiliate" ON public.affiliates;
DROP POLICY IF EXISTS "Usuários podem criar conta de afiliado" ON public.affiliates;

CREATE POLICY "Admins can manage affiliates"
  ON public.affiliates
  TO authenticated
  USING (public.get_user_role((select auth.uid())) = 'admin');

CREATE POLICY "Users can manage own affiliate"
  ON public.affiliates
  TO authenticated
  USING (user_id = (select auth.uid()));

-- =====================================================
-- AFFILIATE_CLICKS
-- =====================================================

DROP POLICY IF EXISTS "Admins podem ver todos os cliques" ON public.affiliate_clicks;
DROP POLICY IF EXISTS "Afiliados podem ver seus cliques" ON public.affiliate_clicks;
DROP POLICY IF EXISTS "Resellers with subscription can view own clicks" ON public.affiliate_clicks;

CREATE POLICY "Users can view own clicks"
  ON public.affiliate_clicks FOR SELECT
  TO authenticated
  USING (
    public.get_user_role((select auth.uid())) = 'admin' OR
    EXISTS (
      SELECT 1 FROM public.affiliates
      WHERE affiliates.affiliate_code = affiliate_clicks.affiliate_code
      AND affiliates.user_id = (select auth.uid())
    )
  );

-- =====================================================
-- AFFILIATE_WITHDRAWALS
-- =====================================================

DROP POLICY IF EXISTS "Admins podem gerenciar saques" ON public.affiliate_withdrawals;
DROP POLICY IF EXISTS "Afiliados podem solicitar saques" ON public.affiliate_withdrawals;
DROP POLICY IF EXISTS "Afiliados podem ver seus saques" ON public.affiliate_withdrawals;

CREATE POLICY "Users can manage own withdrawals"
  ON public.affiliate_withdrawals
  TO authenticated
  USING (
    public.get_user_role((select auth.uid())) = 'admin' OR
    EXISTS (
      SELECT 1 FROM public.affiliates
      WHERE affiliates.id = affiliate_withdrawals.affiliate_id
      AND affiliates.user_id = (select auth.uid())
    )
  );

-- =====================================================
-- CART_ITEMS
-- =====================================================

DROP POLICY IF EXISTS "Users can delete own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can insert own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can update own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can view own cart items" ON public.cart_items;

CREATE POLICY "Users can delete own cart items"
  ON public.cart_items FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own cart items"
  ON public.cart_items FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own cart items"
  ON public.cart_items FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can view own cart items"
  ON public.cart_items FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

-- =====================================================
-- PREMIUM_PAYMENT_HISTORY
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage premium payment history" ON public.premium_payment_history;
DROP POLICY IF EXISTS "Admins can view all premium payment history" ON public.premium_payment_history;
DROP POLICY IF EXISTS "Users can view own premium payment history" ON public.premium_payment_history;

CREATE POLICY "Admins can manage premium payment history"
  ON public.premium_payment_history
  TO authenticated
  USING (public.get_user_role((select auth.uid())) = 'admin');

CREATE POLICY "Users can view own premium payment history"
  ON public.premium_payment_history FOR SELECT
  TO authenticated
  USING (
    public.get_user_role((select auth.uid())) = 'admin' OR
    EXISTS (
      SELECT 1 FROM public.premium_domain_purchases
      WHERE premium_domain_purchases.id = premium_payment_history.purchase_id
      AND premium_domain_purchases.customer_id IN (
        SELECT id FROM public.customers WHERE user_id = (select auth.uid())
      )
    )
  );

-- =====================================================
-- AFFILIATE_COMMISSIONS
-- =====================================================

DROP POLICY IF EXISTS "Admins podem gerenciar comissões" ON public.affiliate_commissions;
DROP POLICY IF EXISTS "Afiliados podem ver suas comissões" ON public.affiliate_commissions;
DROP POLICY IF EXISTS "Resellers with subscription can view own commissions" ON public.affiliate_commissions;

CREATE POLICY "Users can view own commissions"
  ON public.affiliate_commissions FOR SELECT
  TO authenticated
  USING (
    public.get_user_role((select auth.uid())) = 'admin' OR
    affiliate_user_id = (select auth.uid())
  );

CREATE POLICY "System can insert commissions"
  ON public.affiliate_commissions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- =====================================================
-- PREMIUM_DOMAIN_PURCHASES
-- =====================================================

DROP POLICY IF EXISTS "Admins can create premium domain purchases" ON public.premium_domain_purchases;
DROP POLICY IF EXISTS "Admins can delete premium domain purchases" ON public.premium_domain_purchases;
DROP POLICY IF EXISTS "Admins can update premium domain purchases" ON public.premium_domain_purchases;
DROP POLICY IF EXISTS "Admins can view all premium domain purchases" ON public.premium_domain_purchases;
DROP POLICY IF EXISTS "Users can view own premium domain purchases" ON public.premium_domain_purchases;

CREATE POLICY "Admins can manage premium domain purchases"
  ON public.premium_domain_purchases
  TO authenticated
  USING (public.get_user_role((select auth.uid())) = 'admin');

CREATE POLICY "Users can view own premium domain purchases"
  ON public.premium_domain_purchases FOR SELECT
  TO authenticated
  USING (
    public.get_user_role((select auth.uid())) = 'admin' OR
    customer_id IN (
      SELECT id FROM public.customers WHERE user_id = (select auth.uid())
    )
  );

-- =====================================================
-- PREMIUM_DOMAIN_SUGGESTIONS
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage suggestions" ON public.premium_domain_suggestions;

CREATE POLICY "Admins can manage suggestions"
  ON public.premium_domain_suggestions
  TO authenticated
  USING (public.get_user_role((select auth.uid())) = 'admin');
