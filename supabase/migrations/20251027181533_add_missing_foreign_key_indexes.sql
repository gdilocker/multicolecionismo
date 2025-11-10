/*
  # Add Missing Foreign Key Indexes
  
  1. Performance Improvements
    - Add indexes on all unindexed foreign keys
    - Improves JOIN performance and query optimization
    - Reduces table scan costs
  
  2. Indexes Added
    - dns_records.domain_id
    - invoices.order_id
    - licensing_requests.customer_id
    - licensing_requests.reviewed_by
    - orders.customer_id
    - physical_cards.subscription_id
    - social_notifications (actor_id, comment_id, post_id)
    - social_reports (reported_comment_id, reported_post_id, reported_user_id, reviewed_by)
    - subdomains.user_id
    - subscriptions.plan_id
*/

-- dns_records indexes
CREATE INDEX IF NOT EXISTS idx_dns_records_domain_id 
  ON dns_records(domain_id);

-- invoices indexes
CREATE INDEX IF NOT EXISTS idx_invoices_order_id 
  ON invoices(order_id);

-- licensing_requests indexes
CREATE INDEX IF NOT EXISTS idx_licensing_requests_customer_id 
  ON licensing_requests(customer_id);

CREATE INDEX IF NOT EXISTS idx_licensing_requests_reviewed_by 
  ON licensing_requests(reviewed_by);

-- orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_customer_id 
  ON orders(customer_id);

-- physical_cards indexes
CREATE INDEX IF NOT EXISTS idx_physical_cards_subscription_id 
  ON physical_cards(subscription_id);

-- social_notifications indexes
CREATE INDEX IF NOT EXISTS idx_social_notifications_actor_id 
  ON social_notifications(actor_id);

CREATE INDEX IF NOT EXISTS idx_social_notifications_comment_id 
  ON social_notifications(comment_id);

CREATE INDEX IF NOT EXISTS idx_social_notifications_post_id 
  ON social_notifications(post_id);

-- social_reports indexes
CREATE INDEX IF NOT EXISTS idx_social_reports_reported_comment_id 
  ON social_reports(reported_comment_id);

CREATE INDEX IF NOT EXISTS idx_social_reports_reported_post_id 
  ON social_reports(reported_post_id);

CREATE INDEX IF NOT EXISTS idx_social_reports_reported_user_id 
  ON social_reports(reported_user_id);

CREATE INDEX IF NOT EXISTS idx_social_reports_reviewed_by 
  ON social_reports(reviewed_by);

-- subdomains indexes
CREATE INDEX IF NOT EXISTS idx_subdomains_user_id 
  ON subdomains(user_id);

-- subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id 
  ON subscriptions(plan_id);
