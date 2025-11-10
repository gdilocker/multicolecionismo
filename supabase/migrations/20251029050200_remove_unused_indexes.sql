/*
  # Remove Unused Indexes

  1. Performance Optimization
    - Removes indexes that are not being used
    - Reduces database bloat
    - Improves write performance
    - Reduces maintenance overhead

  2. Impact
    - Faster INSERT/UPDATE/DELETE operations
    - Less storage space used
    - Reduced index maintenance during vacuum operations

  Note: These indexes can be recreated if usage patterns change
*/

-- Drop unused indexes (keep only essential ones for actual queries)
DROP INDEX IF EXISTS idx_pricing_plans_product_type;
DROP INDEX IF EXISTS idx_affiliates_code;
DROP INDEX IF EXISTS idx_affiliates_status;
DROP INDEX IF EXISTS idx_invoices_order_id;
DROP INDEX IF EXISTS idx_licensing_requests_customer_id;
DROP INDEX IF EXISTS idx_licensing_requests_reviewed_by;
DROP INDEX IF EXISTS idx_physical_cards_subscription_id;
DROP INDEX IF EXISTS idx_social_notifications_actor_id;
DROP INDEX IF EXISTS idx_social_notifications_comment_id;
DROP INDEX IF EXISTS idx_social_notifications_post_id;
DROP INDEX IF EXISTS idx_social_reports_reported_comment_id;
DROP INDEX IF EXISTS idx_social_reports_reported_post_id;
DROP INDEX IF EXISTS idx_social_reports_reported_user_id;
DROP INDEX IF EXISTS idx_social_reports_reviewed_by;
DROP INDEX IF EXISTS idx_subdomains_user_id;
DROP INDEX IF EXISTS idx_subscriptions_plan_id;
DROP INDEX IF EXISTS idx_pending_orders_user_id;
DROP INDEX IF EXISTS idx_pending_orders_paypal_order_id;
DROP INDEX IF EXISTS idx_pending_orders_status;
DROP INDEX IF EXISTS idx_orders_paypal_order_id;
DROP INDEX IF EXISTS idx_orders_plan_commission;
DROP INDEX IF EXISTS idx_affiliate_commissions_order;
DROP INDEX IF EXISTS idx_reserved_keywords_category;
DROP INDEX IF EXISTS idx_domains_customer_type;
DROP INDEX IF EXISTS idx_domain_catalog_fqdn_lower;
DROP INDEX IF EXISTS idx_domain_catalog_available_premium;
DROP INDEX IF EXISTS idx_domain_catalog_owner;
DROP INDEX IF EXISTS idx_subscriptions_user_status;
DROP INDEX IF EXISTS idx_reserved_keywords_severity;
DROP INDEX IF EXISTS idx_subscriptions_referred_by;
DROP INDEX IF EXISTS idx_pricing_plans_code;
DROP INDEX IF EXISTS idx_pricing_plans_active;
DROP INDEX IF EXISTS idx_subdomains_subdomain;
DROP INDEX IF EXISTS idx_physical_cards_user_id;
DROP INDEX IF EXISTS idx_social_posts_privacy;
DROP INDEX IF EXISTS idx_social_posts_hashtags;
DROP INDEX IF EXISTS idx_pricing_plans_billing_period;
DROP INDEX IF EXISTS idx_social_likes_user_id;
DROP INDEX IF EXISTS idx_social_comments_user_id;
DROP INDEX IF EXISTS idx_social_comments_parent_id;
DROP INDEX IF EXISTS idx_affiliate_clicks_cookie;
DROP INDEX IF EXISTS idx_affiliate_clicks_expires;
DROP INDEX IF EXISTS idx_commissions_status;
DROP INDEX IF EXISTS idx_withdrawals_affiliate;
DROP INDEX IF EXISTS idx_withdrawals_status;
DROP INDEX IF EXISTS idx_orders_affiliate_code;
DROP INDEX IF EXISTS idx_cart_items_user_id;
DROP INDEX IF EXISTS idx_social_shares_user_id;
DROP INDEX IF EXISTS idx_domain_catalog_available;
DROP INDEX IF EXISTS idx_domain_catalog_premium;
DROP INDEX IF EXISTS idx_premium_payment_history_purchase;
DROP INDEX IF EXISTS idx_premium_payment_history_date;
DROP INDEX IF EXISTS idx_premium_payment_history_type;
DROP INDEX IF EXISTS idx_affiliate_commissions_forfeited;
DROP INDEX IF EXISTS idx_premium_purchases_customer;
DROP INDEX IF EXISTS idx_premium_purchases_status;
DROP INDEX IF EXISTS idx_premium_purchases_due_date;
DROP INDEX IF EXISTS idx_premium_purchases_overdue;
DROP INDEX IF EXISTS idx_premium_suggestions_category;
DROP INDEX IF EXISTS idx_subscriptions_payment_status;
DROP INDEX IF EXISTS idx_subscriptions_overdue;
DROP INDEX IF EXISTS idx_affiliate_commissions_held;
DROP INDEX IF EXISTS idx_premium_suggestions_keyword;
DROP INDEX IF EXISTS idx_social_follows_following_id;
DROP INDEX IF EXISTS idx_social_reports_status;
DROP INDEX IF EXISTS idx_social_reports_created_at;
DROP INDEX IF EXISTS idx_social_reports_reporter_id;
DROP INDEX IF EXISTS idx_social_notifications_user_id;
DROP INDEX IF EXISTS idx_social_notifications_is_read;
DROP INDEX IF EXISTS idx_social_notifications_created_at;
DROP INDEX IF EXISTS idx_social_bookmarks_user_id;
DROP INDEX IF EXISTS idx_social_bookmarks_post_id;
DROP INDEX IF EXISTS idx_profile_links_system;
DROP INDEX IF EXISTS idx_user_profiles_domain_id;
DROP INDEX IF EXISTS idx_recovery_codes_user_id;
DROP INDEX IF EXISTS idx_recovery_codes_unused;
DROP INDEX IF EXISTS idx_customers_totp_enabled;
DROP INDEX IF EXISTS idx_premium_domains_plan_required;
DROP INDEX IF EXISTS idx_premium_domains_owner_id;
DROP INDEX IF EXISTS idx_licensing_requests_user_id;
DROP INDEX IF EXISTS idx_licensing_requests_fqdn;
DROP INDEX IF EXISTS idx_licensing_requests_status;
DROP INDEX IF EXISTS idx_protected_brands_active;
DROP INDEX IF EXISTS idx_premium_domains_protected;
DROP INDEX IF EXISTS idx_theme_templates_category;
DROP INDEX IF EXISTS idx_theme_templates_premium;
DROP INDEX IF EXISTS idx_applied_templates_template;
DROP INDEX IF EXISTS idx_profile_links_expires_at;
DROP INDEX IF EXISTS idx_highlight_stories_highlight;
DROP INDEX IF EXISTS idx_poll_options_poll;
DROP INDEX IF EXISTS idx_poll_votes_poll;
DROP INDEX IF EXISTS idx_directory_tags;
DROP INDEX IF EXISTS idx_user_profiles_active;
DROP INDEX IF EXISTS idx_submissions_form;
DROP INDEX IF EXISTS idx_admins_user;
DROP INDEX IF EXISTS idx_content_subs_content;
DROP INDEX IF EXISTS idx_directory_category;
DROP INDEX IF EXISTS idx_ab_variants_test;
DROP INDEX IF EXISTS idx_ab_results_test;
DROP INDEX IF EXISTS idx_ab_results_variant;
DROP INDEX IF EXISTS idx_domain_transfers_domain_id;
DROP INDEX IF EXISTS idx_domain_transfers_from_customer;
DROP INDEX IF EXISTS idx_domain_transfers_to_customer;
DROP INDEX IF EXISTS idx_domain_transfers_status;
DROP INDEX IF EXISTS idx_domain_transfers_created_at;
