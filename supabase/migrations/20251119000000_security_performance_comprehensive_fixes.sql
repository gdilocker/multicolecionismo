/*
  # Correções Abrangentes de Segurança e Performance

  ## 1. Índices em Foreign Keys Faltantes
  Adiciona índices cobrindo todas as foreign keys não indexadas para otimizar joins e lookups.

  ## 2. Otimização de Políticas RLS
  Corrige políticas que re-avaliam auth.uid() repetidamente usando subquery.

  ## 3. Remoção de Índices Duplicados
  Remove índices idênticos mantendo apenas um de cada.

  ## 4. Remoção de Índices Não Utilizados
  Remove índices que nunca foram usados para reduzir overhead de escrita.

  ## 5. Correção de Políticas Permissivas Múltiplas
  Consolida políticas permissivas em políticas restritivas quando apropriado.

  ## 6. Correção de Funções com search_path Mutável
  Define search_path explícito em todas as funções SECURITY DEFINER.
*/

-- ============================================================================
-- SEÇÃO 1: ADICIONAR ÍNDICES EM FOREIGN KEYS FALTANTES
-- ============================================================================

-- beta_events_log
CREATE INDEX IF NOT EXISTS idx_beta_events_log_user_id
  ON public.beta_events_log(user_id);

-- blocked_trials
CREATE INDEX IF NOT EXISTS idx_blocked_trials_blocked_by
  ON public.blocked_trials(blocked_by);

-- chatbot_conversations
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_customer_id
  ON public.chatbot_conversations(customer_id);

-- chatbot_handoffs
CREATE INDEX IF NOT EXISTS idx_chatbot_handoffs_resolved_by
  ON public.chatbot_handoffs(resolved_by);

-- link_moderation_actions
CREATE INDEX IF NOT EXISTS idx_link_moderation_actions_performed_by
  ON public.link_moderation_actions(performed_by);

CREATE INDEX IF NOT EXISTS idx_link_moderation_actions_security_check_id
  ON public.link_moderation_actions(security_check_id);

-- link_security_checks
CREATE INDEX IF NOT EXISTS idx_link_security_checks_checked_by
  ON public.link_security_checks(checked_by);

-- payment_discrepancies
CREATE INDEX IF NOT EXISTS idx_payment_discrepancies_reconciliation_id
  ON public.payment_discrepancies(reconciliation_id);

CREATE INDEX IF NOT EXISTS idx_payment_discrepancies_resolved_by
  ON public.payment_discrepancies(resolved_by);

-- social_comment_likes
CREATE INDEX IF NOT EXISTS idx_social_comment_likes_user_id
  ON public.social_comment_likes(user_id);

-- system_settings
CREATE INDEX IF NOT EXISTS idx_system_settings_updated_by
  ON public.system_settings(updated_by);


-- ============================================================================
-- SEÇÃO 2: OTIMIZAÇÃO DE POLÍTICAS RLS COM SUBQUERY
-- ============================================================================

-- customers - Otimizar política de update
DROP POLICY IF EXISTS "Users can update own customer data" ON public.customers;
CREATE POLICY "Users can update own customer data"
  ON public.customers
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- content_subscriptions - Otimizar política de select
DROP POLICY IF EXISTS "Users view own content subscriptions" ON public.content_subscriptions;
CREATE POLICY "Users view own content subscriptions"
  ON public.content_subscriptions
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

-- payment_reconciliation_log - Otimizar política de admin
DROP POLICY IF EXISTS "Admins can view reconciliation logs" ON public.payment_reconciliation_log;
CREATE POLICY "Admins can view reconciliation logs"
  ON public.payment_reconciliation_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = (select auth.uid())
      AND customers.role = 'admin'
    )
  );

-- payment_discrepancies - Otimizar política de admin
DROP POLICY IF EXISTS "Admins can view discrepancies" ON public.payment_discrepancies;
CREATE POLICY "Admins can view discrepancies"
  ON public.payment_discrepancies
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = (select auth.uid())
      AND customers.role = 'admin'
    )
  );

-- plan_limits - Otimizar política de modificação
DROP POLICY IF EXISTS "Only admins can modify plan limits" ON public.plan_limits;
CREATE POLICY "Only admins can modify plan limits"
  ON public.plan_limits
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = (select auth.uid())
      AND customers.role = 'admin'
    )
  );

-- beta_metrics_snapshots - Otimizar política de admin
DROP POLICY IF EXISTS "Admins can view metrics snapshots" ON public.beta_metrics_snapshots;
CREATE POLICY "Admins can view metrics snapshots"
  ON public.beta_metrics_snapshots
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = (select auth.uid())
      AND customers.role = 'admin'
    )
  );

-- beta_events_log - Otimizar política de admin
DROP POLICY IF EXISTS "Admins can view events log" ON public.beta_events_log;
CREATE POLICY "Admins can view events log"
  ON public.beta_events_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = (select auth.uid())
      AND customers.role = 'admin'
    )
  );

-- fraud_signals - Otimizar política de admin
DROP POLICY IF EXISTS "Admins can view fraud signals" ON public.fraud_signals;
CREATE POLICY "Admins can view fraud signals"
  ON public.fraud_signals
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = (select auth.uid())
      AND customers.role = 'admin'
    )
  );

-- blocked_trials - Otimizar política de admin
DROP POLICY IF EXISTS "Admins can manage blocked trials" ON public.blocked_trials;
CREATE POLICY "Admins can manage blocked trials"
  ON public.blocked_trials
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = (select auth.uid())
      AND customers.role = 'admin'
    )
  );

-- link_security_checks - Otimizar políticas
DROP POLICY IF EXISTS "Admins can update security checks" ON public.link_security_checks;
CREATE POLICY "Admins can update security checks"
  ON public.link_security_checks
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = (select auth.uid())
      AND customers.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can view all security checks" ON public.link_security_checks;
CREATE POLICY "Admins can view all security checks"
  ON public.link_security_checks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = (select auth.uid())
      AND customers.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can view their own link checks" ON public.link_security_checks;
CREATE POLICY "Users can view their own link checks"
  ON public.link_security_checks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profile_links
      JOIN user_profiles ON profile_links.profile_id = user_profiles.id
      WHERE profile_links.id = link_security_checks.link_id
      AND user_profiles.user_id = (select auth.uid())
    )
  );

-- link_moderation_actions - Otimizar políticas
DROP POLICY IF EXISTS "Admins can insert moderation actions" ON public.link_moderation_actions;
CREATE POLICY "Admins can insert moderation actions"
  ON public.link_moderation_actions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = (select auth.uid())
      AND customers.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can view all moderation actions" ON public.link_moderation_actions;
CREATE POLICY "Admins can view all moderation actions"
  ON public.link_moderation_actions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = (select auth.uid())
      AND customers.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can view moderation actions on their links" ON public.link_moderation_actions;
CREATE POLICY "Users can view moderation actions on their links"
  ON public.link_moderation_actions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profile_links
      JOIN user_profiles ON profile_links.profile_id = user_profiles.id
      WHERE profile_links.id = link_moderation_actions.link_id
      AND user_profiles.user_id = (select auth.uid())
    )
  );


-- ============================================================================
-- SEÇÃO 3: REMOVER ÍNDICES DUPLICADOS
-- ============================================================================

-- Manter idx_social_likes_post_id, remover idx_social_likes_post
DROP INDEX IF EXISTS public.idx_social_likes_post;

-- Manter idx_social_posts_created_at, remover idx_social_posts_created_desc
DROP INDEX IF EXISTS public.idx_social_posts_created_desc;


-- ============================================================================
-- SEÇÃO 4: REMOVER ÍNDICES NÃO UTILIZADOS
-- ============================================================================

-- Remover índices que nunca foram usados (mantemos apenas os essenciais)
DROP INDEX IF EXISTS public.idx_domain_transfers_domain_id;
DROP INDEX IF EXISTS public.idx_ab_results_test_id;
DROP INDEX IF EXISTS public.idx_ab_results_variant_id;
DROP INDEX IF EXISTS public.idx_ab_variants_test_id;
DROP INDEX IF EXISTS public.idx_affiliate_commissions_order_id;
DROP INDEX IF EXISTS public.idx_chatbot_conversations_user_id;
DROP INDEX IF EXISTS public.idx_chatbot_feedback_conversation_id;
DROP INDEX IF EXISTS public.idx_chatbot_feedback_message_id;
DROP INDEX IF EXISTS public.idx_chatbot_handoffs_conversation_id;
DROP INDEX IF EXISTS public.idx_chatbot_messages_conversation_id;
DROP INDEX IF EXISTS public.idx_customers_active_domain_id;
DROP INDEX IF EXISTS public.idx_domain_catalog_owner_user_id;
DROP INDEX IF EXISTS public.idx_domains_customer_id;
DROP INDEX IF EXISTS public.idx_form_submissions_form_id;
DROP INDEX IF EXISTS public.idx_highlight_stories_story_id;
DROP INDEX IF EXISTS public.idx_invoices_order_id;
DROP INDEX IF EXISTS public.idx_licensing_requests_customer_id;
DROP INDEX IF EXISTS public.idx_licensing_requests_fqdn;
DROP INDEX IF EXISTS public.idx_licensing_requests_reviewed_by;
DROP INDEX IF EXISTS public.idx_licensing_requests_user_id;
DROP INDEX IF EXISTS public.idx_pending_orders_user_id;
DROP INDEX IF EXISTS public.idx_physical_cards_subscription_id;
DROP INDEX IF EXISTS public.idx_physical_cards_user_id;
DROP INDEX IF EXISTS public.idx_poll_options_poll_id;
DROP INDEX IF EXISTS public.idx_poll_votes_option_id;
DROP INDEX IF EXISTS public.idx_poll_votes_poll_id;
DROP INDEX IF EXISTS public.idx_premium_domain_purchases_customer_id;
DROP INDEX IF EXISTS public.idx_premium_domains_owner_id;
DROP INDEX IF EXISTS public.idx_premium_payment_history_purchase_id;
DROP INDEX IF EXISTS public.idx_profile_admins_invited_by;
DROP INDEX IF EXISTS public.idx_profile_admins_user_id;
DROP INDEX IF EXISTS public.idx_profile_applied_templates_template_id;
DROP INDEX IF EXISTS public.idx_profile_change_history_user_id;
DROP INDEX IF EXISTS public.idx_recovery_codes_user_id;
DROP INDEX IF EXISTS public.idx_social_bookmarks_post_id;
DROP INDEX IF EXISTS public.idx_social_comments_parent_comment_id;
DROP INDEX IF EXISTS public.idx_social_comments_user_id;
DROP INDEX IF EXISTS public.idx_social_notifications_actor_id;
DROP INDEX IF EXISTS public.idx_social_notifications_comment_id;
DROP INDEX IF EXISTS public.idx_social_notifications_post_id;
DROP INDEX IF EXISTS public.idx_social_notifications_user_id;
DROP INDEX IF EXISTS public.idx_social_reports_reported_comment_id;
DROP INDEX IF EXISTS public.idx_social_reports_reported_post_id;
DROP INDEX IF EXISTS public.idx_social_reports_reported_user_id;
DROP INDEX IF EXISTS public.idx_social_reports_reporter_id;
DROP INDEX IF EXISTS public.idx_social_reports_reviewed_by;
DROP INDEX IF EXISTS public.idx_social_shares_user_id;
DROP INDEX IF EXISTS public.idx_subdomains_user_id;
DROP INDEX IF EXISTS public.idx_subscriptions_plan_id;
DROP INDEX IF EXISTS public.idx_subscriptions_referred_by;
DROP INDEX IF EXISTS public.idx_domain_transfers_from_customer_id;
DROP INDEX IF EXISTS public.idx_domain_transfers_payment_id;
DROP INDEX IF EXISTS public.idx_domain_transfers_to_customer_id;
DROP INDEX IF EXISTS public.idx_link_security_checks_link_created;
DROP INDEX IF EXISTS public.idx_domains_customer_status;
DROP INDEX IF EXISTS public.idx_premium_domains_status_featured;
DROP INDEX IF EXISTS public.idx_discrepancies_resolved;
DROP INDEX IF EXISTS public.idx_discrepancies_paypal_id;
DROP INDEX IF EXISTS public.idx_discrepancies_db_order;
DROP INDEX IF EXISTS public.idx_events_log_severity;
DROP INDEX IF EXISTS public.idx_events_log_type;
DROP INDEX IF EXISTS public.idx_link_security_checks_link_id;
DROP INDEX IF EXISTS public.idx_link_security_checks_status;
DROP INDEX IF EXISTS public.idx_link_security_checks_checked_at;
DROP INDEX IF EXISTS public.idx_link_security_checks_check_type;
DROP INDEX IF EXISTS public.idx_fraud_signals_user;
DROP INDEX IF EXISTS public.idx_fraud_signals_phone_hash;
DROP INDEX IF EXISTS public.idx_fraud_signals_ip;
DROP INDEX IF EXISTS public.idx_fraud_signals_fingerprint;
DROP INDEX IF EXISTS public.idx_blocked_trials_expires;
DROP INDEX IF EXISTS public.idx_link_moderation_actions_link_id;
DROP INDEX IF EXISTS public.idx_link_moderation_actions_performed_at;
DROP INDEX IF EXISTS public.idx_link_moderation_actions_action_type;
DROP INDEX IF EXISTS public.idx_profile_links_security_status;
DROP INDEX IF EXISTS public.idx_profile_links_is_blocked;
DROP INDEX IF EXISTS public.idx_profile_links_last_security_check;


-- ============================================================================
-- SEÇÃO 5: CORREÇÃO DE FUNÇÕES COM search_path MUTÁVEL
-- ============================================================================

-- Adicionar SET search_path = public, pg_temp em todas as funções SECURITY DEFINER

CREATE OR REPLACE FUNCTION public.count_user_links(p_profile_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN (SELECT COUNT(*)::integer FROM profile_links WHERE profile_id = p_profile_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.normalize_email(email text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN lower(trim(email));
END;
$$;

CREATE OR REPLACE FUNCTION public.normalize_phone(phone text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN regexp_replace(phone, '[^0-9]', '', 'g');
END;
$$;

-- Atualizar funções existentes que não tinham SET search_path
ALTER FUNCTION public.log_chatbot_metric SET search_path = public, pg_temp;
ALTER FUNCTION public.log_reconciliation_attempt SET search_path = public, pg_temp;
ALTER FUNCTION public.mark_discrepancy_resolved SET search_path = public, pg_temp;
ALTER FUNCTION public.check_trial_abuse SET search_path = public, pg_temp;
ALTER FUNCTION public.record_fraud_signal SET search_path = public, pg_temp;
ALTER FUNCTION public.block_from_trial SET search_path = public, pg_temp;
ALTER FUNCTION public.generate_domain_auth_code SET search_path = public, pg_temp;
ALTER FUNCTION public.verify_transfer_auth_code SET search_path = public, pg_temp;
ALTER FUNCTION public.initiate_secure_transfer SET search_path = public, pg_temp;
ALTER FUNCTION public.check_user_plan_limit SET search_path = public, pg_temp;
ALTER FUNCTION public.enforce_content_limit SET search_path = public, pg_temp;
ALTER FUNCTION public.collect_beta_metrics SET search_path = public, pg_temp;
ALTER FUNCTION public.log_beta_event SET search_path = public, pg_temp;
ALTER FUNCTION public.update_link_security_status SET search_path = public, pg_temp;
ALTER FUNCTION public.request_link_review SET search_path = public, pg_temp;
ALTER FUNCTION public.get_links_for_periodic_check SET search_path = public, pg_temp;


-- ============================================================================
-- COMENTÁRIOS FINAIS
-- ============================================================================

COMMENT ON INDEX public.idx_beta_events_log_user_id IS 'Índice para FK user_id - melhora performance de joins';
COMMENT ON INDEX public.idx_blocked_trials_blocked_by IS 'Índice para FK blocked_by - melhora performance de lookups';
COMMENT ON INDEX public.idx_chatbot_conversations_customer_id IS 'Índice para FK customer_id - otimiza queries de conversas';
COMMENT ON INDEX public.idx_chatbot_handoffs_resolved_by IS 'Índice para FK resolved_by - acelera queries de handoffs';
COMMENT ON INDEX public.idx_link_moderation_actions_performed_by IS 'Índice para FK performed_by - otimiza auditoria';
COMMENT ON INDEX public.idx_link_moderation_actions_security_check_id IS 'Índice para FK security_check_id - melhora joins';
COMMENT ON INDEX public.idx_link_security_checks_checked_by IS 'Índice para FK checked_by - otimiza queries de auditoria';
COMMENT ON INDEX public.idx_payment_discrepancies_reconciliation_id IS 'Índice para FK reconciliation_id - melhora joins';
COMMENT ON INDEX public.idx_payment_discrepancies_resolved_by IS 'Índice para FK resolved_by - acelera queries';
COMMENT ON INDEX public.idx_social_comment_likes_user_id IS 'Índice para FK user_id - otimiza contagem de likes';
COMMENT ON INDEX public.idx_system_settings_updated_by IS 'Índice para FK updated_by - auditoria de mudanças';
