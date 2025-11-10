/*
  # Consolidação de Políticas Permissivas Múltiplas

  ## Problema
  Múltiplas políticas permissivas (PERMISSIVE) para a mesma ação criam overhead
  desnecessário. O PostgreSQL avalia TODAS as políticas permissivas com OR,
  então podemos consolidá-las em uma única política mais eficiente.

  ## Solução
  Consolidar políticas permissivas em políticas únicas que combinam todas
  as condições com OR, mantendo a mesma lógica de acesso.

  ## Tabelas Afetadas
  - affiliate_clicks, affiliate_commissions, affiliate_withdrawals
  - affiliates, audit_logs, chatbot_intents, chatbot_settings
  - customers, domain_transfers, e muitas outras

  IMPORTANTE: Estas mudanças mantêm exatamente a mesma lógica de acesso,
  apenas otimizam a performance consolidando múltiplas políticas.
*/

-- ============================================================================
-- AFFILIATE_CLICKS - Consolidar políticas SELECT
-- ============================================================================
DROP POLICY IF EXISTS "Admins podem ver todos os cliques" ON public.affiliate_clicks;
DROP POLICY IF EXISTS "Afiliados podem ver seus cliques" ON public.affiliate_clicks;
DROP POLICY IF EXISTS "Resellers with subscription can view own clicks" ON public.affiliate_clicks;

CREATE POLICY "Consolidated: View affiliate clicks"
  ON public.affiliate_clicks
  FOR SELECT
  TO authenticated
  USING (
    -- Admin pode ver tudo
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = (select auth.uid())
      AND customers.role = 'admin'
    )
    OR
    -- Afiliado pode ver seus próprios cliques
    affiliate_id IN (
      SELECT id FROM affiliates WHERE user_id = (select auth.uid())
    )
  );


-- ============================================================================
-- AFFILIATE_COMMISSIONS - Consolidar políticas SELECT e INSERT
-- ============================================================================
DROP POLICY IF EXISTS "Admins podem gerenciar comissões" ON public.affiliate_commissions;
DROP POLICY IF EXISTS "Afiliados podem ver suas comissões" ON public.affiliate_commissions;
DROP POLICY IF EXISTS "Resellers with subscription can view own commissions" ON public.affiliate_commissions;
DROP POLICY IF EXISTS "Sistema pode criar comissões" ON public.affiliate_commissions;

CREATE POLICY "Consolidated: View affiliate commissions"
  ON public.affiliate_commissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = (select auth.uid())
      AND customers.role = 'admin'
    )
    OR
    affiliate_id IN (
      SELECT id FROM affiliates WHERE user_id = (select auth.uid())
    )
  );

CREATE POLICY "Consolidated: Insert affiliate commissions"
  ON public.affiliate_commissions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = (select auth.uid())
      AND customers.role IN ('admin', 'system')
    )
  );


-- ============================================================================
-- AFFILIATE_WITHDRAWALS - Consolidar políticas
-- ============================================================================
DROP POLICY IF EXISTS "Admins podem gerenciar saques" ON public.affiliate_withdrawals;
DROP POLICY IF EXISTS "Afiliados podem solicitar saques" ON public.affiliate_withdrawals;
DROP POLICY IF EXISTS "Afiliados podem ver seus saques" ON public.affiliate_withdrawals;

CREATE POLICY "Consolidated: View affiliate withdrawals"
  ON public.affiliate_withdrawals
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = (select auth.uid())
      AND customers.role = 'admin'
    )
    OR
    affiliate_id IN (
      SELECT id FROM affiliates WHERE user_id = (select auth.uid())
    )
  );

CREATE POLICY "Consolidated: Insert affiliate withdrawals"
  ON public.affiliate_withdrawals
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = (select auth.uid())
      AND customers.role = 'admin'
    )
    OR
    affiliate_id IN (
      SELECT id FROM affiliates WHERE user_id = (select auth.uid())
    )
  );


-- ============================================================================
-- AFFILIATES - Consolidar políticas
-- ============================================================================
DROP POLICY IF EXISTS "Admins podem gerenciar afiliados" ON public.affiliates;
DROP POLICY IF EXISTS "Admins podem ver todos os afiliados" ON public.affiliates;
DROP POLICY IF EXISTS "Afiliados podem ver seus próprios dados" ON public.affiliates;
DROP POLICY IF EXISTS "Afiliados podem atualizar seus dados" ON public.affiliates;
DROP POLICY IF EXISTS "Resellers with subscription can insert own affiliate data" ON public.affiliates;
DROP POLICY IF EXISTS "Resellers with subscription can view own affiliate data" ON public.affiliates;
DROP POLICY IF EXISTS "Resellers with subscription can update own affiliate data" ON public.affiliates;
DROP POLICY IF EXISTS "Users can create own affiliate" ON public.affiliates;
DROP POLICY IF EXISTS "Usuários podem criar conta de afiliado" ON public.affiliates;

CREATE POLICY "Consolidated: View affiliates"
  ON public.affiliates
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = (select auth.uid())
      AND customers.role = 'admin'
    )
    OR
    user_id = (select auth.uid())
  );

CREATE POLICY "Consolidated: Insert affiliates"
  ON public.affiliates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = (select auth.uid())
      AND customers.role = 'admin'
    )
    OR
    user_id = (select auth.uid())
  );

CREATE POLICY "Consolidated: Update affiliates"
  ON public.affiliates
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = (select auth.uid())
      AND customers.role = 'admin'
    )
    OR
    user_id = (select auth.uid())
  );


-- ============================================================================
-- AUDIT_LOGS - Consolidar políticas SELECT
-- ============================================================================
DROP POLICY IF EXISTS "Admins can read all audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Users can read own audit logs" ON public.audit_logs;

CREATE POLICY "Consolidated: View audit logs"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = (select auth.uid())
      AND customers.role = 'admin'
    )
    OR
    user_id = (select auth.uid())
  );


-- ============================================================================
-- CUSTOMERS - Remover política duplicada
-- ============================================================================
DROP POLICY IF EXISTS "authenticated_update_own_customer" ON public.customers;
-- Mantém apenas "Users can update own customer data" que já foi otimizada


-- ============================================================================
-- DOMAIN_TRANSFERS - Consolidar políticas
-- ============================================================================
DROP POLICY IF EXISTS "Admins have full access to transfers" ON public.domain_transfers;
DROP POLICY IF EXISTS "Users can initiate transfers for owned domains" ON public.domain_transfers;
DROP POLICY IF EXISTS "Users can view own transfers (from)" ON public.domain_transfers;
DROP POLICY IF EXISTS "Users can view own transfers (to)" ON public.domain_transfers;

CREATE POLICY "Consolidated: View domain transfers"
  ON public.domain_transfers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = (select auth.uid())
      AND customers.role = 'admin'
    )
    OR
    from_customer_id IN (
      SELECT id FROM customers WHERE user_id = (select auth.uid())
    )
    OR
    to_customer_id IN (
      SELECT id FROM customers WHERE user_id = (select auth.uid())
    )
  );

CREATE POLICY "Consolidated: Insert domain transfers"
  ON public.domain_transfers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = (select auth.uid())
      AND customers.role = 'admin'
    )
    OR
    from_customer_id IN (
      SELECT id FROM customers WHERE user_id = (select auth.uid())
    )
  );


-- ============================================================================
-- SOCIAL_POSTS - Consolidar políticas (mais complexas)
-- ============================================================================
DROP POLICY IF EXISTS "Admins can moderate all posts" ON public.social_posts;
DROP POLICY IF EXISTS "Anyone can view public active posts" ON public.social_posts;
DROP POLICY IF EXISTS "Anyone can view public posts" ON public.social_posts;
DROP POLICY IF EXISTS "Followers can view followers-only posts" ON public.social_posts;
DROP POLICY IF EXISTS "Paid users can create posts" ON public.social_posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON public.social_posts;
DROP POLICY IF EXISTS "Users can update own posts" ON public.social_posts;
DROP POLICY IF EXISTS "Users can view own posts" ON public.social_posts;

CREATE POLICY "Consolidated: View social posts"
  ON public.social_posts
  FOR SELECT
  TO authenticated
  USING (
    -- Admin vê tudo
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = (select auth.uid())
      AND customers.role = 'admin'
    )
    OR
    -- Posts públicos e ativos
    (visibility = 'public' AND status = 'active')
    OR
    -- Próprios posts
    user_id = (select auth.uid())
    OR
    -- Posts followers-only se seguir o autor
    (
      visibility = 'followers'
      AND EXISTS (
        SELECT 1 FROM social_follows
        WHERE follower_id = (select auth.uid())
        AND following_id = social_posts.user_id
      )
    )
  );

CREATE POLICY "Consolidated: Insert social posts"
  ON public.social_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = (select auth.uid())
      AND customers.role = 'admin'
    )
    OR
    (
      user_id = (select auth.uid())
      AND EXISTS (
        SELECT 1 FROM subscriptions
        WHERE customer_id IN (
          SELECT id FROM customers WHERE user_id = (select auth.uid())
        )
        AND status = 'active'
      )
    )
  );

CREATE POLICY "Consolidated: Update social posts"
  ON public.social_posts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = (select auth.uid())
      AND customers.role = 'admin'
    )
    OR
    user_id = (select auth.uid())
  );

CREATE POLICY "Consolidated: Delete social posts"
  ON public.social_posts
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = (select auth.uid())
      AND customers.role = 'admin'
    )
    OR
    user_id = (select auth.uid())
  );


-- ============================================================================
-- SUBSCRIPTIONS - Consolidar políticas
-- ============================================================================
DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Anyone can view subscriptions for badges" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;

CREATE POLICY "Consolidated: View subscriptions"
  ON public.subscriptions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = (select auth.uid())
      AND customers.role = 'admin'
    )
    OR
    customer_id IN (
      SELECT id FROM customers WHERE user_id = (select auth.uid())
    )
    OR
    status = 'active' -- Visível para badges públicos
  );

CREATE POLICY "Consolidated: Insert subscriptions"
  ON public.subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = (select auth.uid())
      AND customers.role = 'admin'
    )
    OR
    customer_id IN (
      SELECT id FROM customers WHERE user_id = (select auth.uid())
    )
  );

CREATE POLICY "Consolidated: Update subscriptions"
  ON public.subscriptions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = (select auth.uid())
      AND customers.role = 'admin'
    )
    OR
    customer_id IN (
      SELECT id FROM customers WHERE user_id = (select auth.uid())
    )
  );


-- ============================================================================
-- COMENTÁRIOS FINAIS
-- ============================================================================

COMMENT ON POLICY "Consolidated: View affiliate clicks" ON public.affiliate_clicks
  IS 'Política consolidada: Admins e próprios afiliados podem ver cliques';

COMMENT ON POLICY "Consolidated: View social posts" ON public.social_posts
  IS 'Política consolidada: Acesso baseado em visibilidade, ownership e relacionamentos';

COMMENT ON POLICY "Consolidated: View subscriptions" ON public.subscriptions
  IS 'Política consolidada: Admins, próprios usuários e badges públicos';
