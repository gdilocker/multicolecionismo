/*
  # Adicionar Índices de Performance

  1. Índices Adicionados
    - Índices para queries frequentes em todas as tabelas principais
    - Índices compostos para queries com múltiplas condições
    - Índices para ordenação e filtragem

  2. Benefícios
    - Melhora performance de queries
    - Reduz tempo de resposta da API
    - Otimiza joins e lookups

  3. Notas
    - Índices em foreign keys já existem (migration 027_181533)
    - Focando em índices de queries específicas
*/

-- Orders: customer + status (query comum)
CREATE INDEX IF NOT EXISTS idx_orders_customer_status
  ON orders(customer_id, status);

-- Orders: created_at para admin (ordenação)
CREATE INDEX IF NOT EXISTS idx_orders_created_at_desc
  ON orders(created_at DESC);

-- Domains: customer + status (query comum)
CREATE INDEX IF NOT EXISTS idx_domains_customer_status
  ON domains(customer_id, registrar_status);

-- Domains: fqdn pattern matching (LIKE queries)
CREATE INDEX IF NOT EXISTS idx_domains_fqdn_pattern
  ON domains(fqdn text_pattern_ops);

-- DNS Records: domain lookups
CREATE INDEX IF NOT EXISTS idx_dns_records_domain
  ON dns_records(domain_id);

-- User Profiles: subdomain lookup (query comum)
CREATE INDEX IF NOT EXISTS idx_user_profiles_subdomain
  ON user_profiles(subdomain) WHERE subdomain IS NOT NULL;

-- User Profiles: user_id lookup
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id
  ON user_profiles(user_id);

-- Profile Links: profile + order (exibição)
CREATE INDEX IF NOT EXISTS idx_profile_links_profile_order
  ON profile_links(profile_id, display_order);

-- Profile Links: profile + active (filtro comum)
CREATE INDEX IF NOT EXISTS idx_profile_links_profile_active
  ON profile_links(profile_id, is_active);

-- Subscriptions: user + status (verificação de plano)
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status
  ON subscriptions(user_id, status);

-- Subscriptions: status + period_end (expiração)
CREATE INDEX IF NOT EXISTS idx_subscriptions_status_period_end
  ON subscriptions(status, current_period_end);

-- Premium Domains: status + listed (marketplace)
CREATE INDEX IF NOT EXISTS idx_premium_domains_status_listed
  ON premium_domains(status, is_listed) WHERE is_listed = true;

-- Premium Domains: price range queries
CREATE INDEX IF NOT EXISTS idx_premium_domains_price
  ON premium_domains(price_cents) WHERE is_listed = true AND status = 'available';

-- Social Posts: profile + created_at (feed)
CREATE INDEX IF NOT EXISTS idx_social_posts_profile_created
  ON social_posts(profile_id, created_at DESC);

-- Social Posts: visibility + created_at (public feed)
CREATE INDEX IF NOT EXISTS idx_social_posts_visibility_created
  ON social_posts(visibility, created_at DESC) WHERE visibility = 'public';

-- Social Likes: post lookup (contagem)
CREATE INDEX IF NOT EXISTS idx_social_likes_post
  ON social_likes(post_id);

-- Social Likes: user + post (verificar se já curtiu)
CREATE INDEX IF NOT EXISTS idx_social_likes_user_post
  ON social_likes(user_id, post_id);

-- Social Comments: post + created_at (exibição)
CREATE INDEX IF NOT EXISTS idx_social_comments_post_created
  ON social_comments(post_id, created_at);

-- Social Comments: user lookup
CREATE INDEX IF NOT EXISTS idx_social_comments_user
  ON social_comments(user_id);

-- Social Follows: follower lookup (quem eu sigo)
CREATE INDEX IF NOT EXISTS idx_social_follows_follower
  ON social_follows(follower_id);

-- Social Follows: following lookup (meus seguidores)
CREATE INDEX IF NOT EXISTS idx_social_follows_following
  ON social_follows(following_id);

-- Social Notifications: user + read status
CREATE INDEX IF NOT EXISTS idx_social_notifications_user_read
  ON social_notifications(user_id, is_read, created_at DESC);

-- Audit Logs: timestamp para cleanup e análise
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp_desc
  ON audit_logs(timestamp DESC);

-- Audit Logs: user_id lookup
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id
  ON audit_logs(user_id);

-- Audit Logs: action lookup (análise)
CREATE INDEX IF NOT EXISTS idx_audit_logs_action
  ON audit_logs(action);

-- Affiliates: user_id lookup
CREATE INDEX IF NOT EXISTS idx_affiliates_user_id
  ON affiliates(user_id);

-- Affiliates: code lookup (único, mas index ajuda)
CREATE INDEX IF NOT EXISTS idx_affiliates_code
  ON affiliates(code);

-- Affiliate Clicks: affiliate + created_at
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_affiliate_created
  ON affiliate_clicks(affiliate_id, created_at DESC);

-- Affiliate Commissions: affiliate + status
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_affiliate_status
  ON affiliate_commissions(affiliate_id, status);

-- Support Tickets: user + status
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_status
  ON support_tickets(user_id, status);

-- Support Tickets: status + updated_at (admin queue)
CREATE INDEX IF NOT EXISTS idx_support_tickets_status_updated
  ON support_tickets(status, updated_at DESC);

-- Ticket Messages: ticket + created_at
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_created
  ON ticket_messages(ticket_id, created_at);

-- Domain Transfers: user + status
CREATE INDEX IF NOT EXISTS idx_domain_transfers_user_status
  ON domain_transfers(user_id, status);

-- Pending Orders: user lookup
CREATE INDEX IF NOT EXISTS idx_pending_orders_user_id
  ON pending_orders(user_id);

-- Pending Orders: paypal_order_id lookup
CREATE INDEX IF NOT EXISTS idx_pending_orders_paypal_order_id
  ON pending_orders(paypal_order_id);

-- Domain Catalog: status filtering
CREATE INDEX IF NOT EXISTS idx_domain_catalog_status
  ON domain_catalog(status) WHERE status = 'available';
