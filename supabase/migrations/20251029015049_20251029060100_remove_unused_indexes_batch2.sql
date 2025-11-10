/*
  # Remove Unused Indexes - Batch 2

  1. Problem
    - Multiple indexes are not being used by queries
    - They consume storage space and slow down write operations
    - No query benefit

  2. Solution
    - Drop all unused indexes identified by Supabase performance analysis
    - Keep only indexes that are actively used by queries

  3. Indexes Removed (101 total)
    - Affiliate and commission related indexes
    - Domain and catalog indexes
    - Social network indexes
    - Subscription and plan indexes
    - Profile and user indexes
    - Various other feature indexes
*/

-- Pricing and Plans
DROP INDEX IF EXISTS idx_pricing_plans_product_type;
DROP INDEX IF EXISTS idx_pricing_plans_code;
DROP INDEX IF EXISTS idx_pricing_plans_active;
DROP INDEX IF EXISTS idx_pricing_plans_billing_period;

-- Affiliates
DROP INDEX IF EXISTS idx_affiliates_code;
DROP INDEX IF EXISTS idx_affiliates_status;
DROP INDEX IF EXISTS idx_affiliate_clicks_cookie;
DROP INDEX IF EXISTS idx_affiliate_clicks_expires;
DROP INDEX IF EXISTS idx_commissions_status;
DROP INDEX IF EXISTS idx_withdrawals_affiliate;
DROP INDEX IF EXISTS idx_withdrawals_status;
DROP INDEX IF EXISTS idx_orders_affiliate_code;
DROP INDEX IF EXISTS idx_affiliate_commissions_order;
DROP INDEX IF EXISTS idx_affiliate_commissions_forfeited;
DROP INDEX IF EXISTS idx_affiliate_commissions_held;

-- Invoices
DROP INDEX IF EXISTS idx_invoices_order_id;

-- Licensing
DROP INDEX IF EXISTS idx_licensing_requests_customer_id;
DROP INDEX IF EXISTS idx_licensing_requests_reviewed_by;
DROP INDEX IF EXISTS idx_licensing_requests_user_id;
DROP INDEX IF EXISTS idx_licensing_requests_fqdn;
DROP INDEX IF EXISTS idx_licensing_requests_status;

-- Physical Cards
DROP INDEX IF EXISTS idx_physical_cards_subscription_id;
DROP INDEX IF EXISTS idx_physical_cards_user_id;

-- Social Network
DROP INDEX IF EXISTS idx_social_notifications_actor_id;
DROP INDEX IF EXISTS idx_social_notifications_comment_id;
DROP INDEX IF EXISTS idx_social_notifications_post_id;
DROP INDEX IF EXISTS idx_social_notifications_user_id;
DROP INDEX IF EXISTS idx_social_notifications_is_read;
DROP INDEX IF EXISTS idx_social_notifications_created_at;

DROP INDEX IF EXISTS idx_social_reports_reported_comment_id;
DROP INDEX IF EXISTS idx_social_reports_reported_post_id;
DROP INDEX IF EXISTS idx_social_reports_reported_user_id;
DROP INDEX IF EXISTS idx_social_reports_reviewed_by;
DROP INDEX IF EXISTS idx_social_reports_status;
DROP INDEX IF EXISTS idx_social_reports_created_at;
DROP INDEX IF EXISTS idx_social_reports_reporter_id;

DROP INDEX IF EXISTS idx_social_bookmarks_user_id;
DROP INDEX IF EXISTS idx_social_bookmarks_post_id;

DROP INDEX IF EXISTS idx_social_posts_privacy;
DROP INDEX IF EXISTS idx_social_posts_hashtags;

DROP INDEX IF EXISTS idx_social_likes_user_id;

DROP INDEX IF EXISTS idx_social_comments_user_id;
DROP INDEX IF EXISTS idx_social_comments_parent_id;

DROP INDEX IF EXISTS idx_social_shares_user_id;

DROP INDEX IF EXISTS idx_social_follows_following_id;

-- Subdomains
DROP INDEX IF EXISTS idx_subdomains_user_id;
DROP INDEX IF EXISTS idx_subdomains_subdomain;

-- Subscriptions
DROP INDEX IF EXISTS idx_subscriptions_plan_id;
DROP INDEX IF EXISTS idx_subscriptions_user_status;
DROP INDEX IF EXISTS idx_subscriptions_referred_by;
DROP INDEX IF EXISTS idx_subscriptions_payment_status;
DROP INDEX IF EXISTS idx_subscriptions_overdue;

-- Pending Orders
DROP INDEX IF EXISTS idx_pending_orders_user_id;
DROP INDEX IF EXISTS idx_pending_orders_paypal_order_id;
DROP INDEX IF EXISTS idx_pending_orders_status;

-- Orders
DROP INDEX IF EXISTS idx_orders_paypal_order_id;
DROP INDEX IF EXISTS idx_orders_plan_commission;

-- Reserved Keywords
DROP INDEX IF EXISTS idx_reserved_keywords_category;
DROP INDEX IF EXISTS idx_reserved_keywords_severity;

-- Domains
DROP INDEX IF EXISTS idx_domains_customer_type;

-- Domain Catalog
DROP INDEX IF EXISTS idx_domain_catalog_fqdn_lower;
DROP INDEX IF EXISTS idx_domain_catalog_available_premium;
DROP INDEX IF EXISTS idx_domain_catalog_owner;
DROP INDEX IF EXISTS idx_domain_catalog_available;
DROP INDEX IF EXISTS idx_domain_catalog_premium;

-- Cart
DROP INDEX IF EXISTS idx_cart_items_user_id;

-- Premium Domains
DROP INDEX IF EXISTS idx_premium_payment_history_purchase;
DROP INDEX IF EXISTS idx_premium_payment_history_date;
DROP INDEX IF EXISTS idx_premium_payment_history_type;

DROP INDEX IF EXISTS idx_premium_purchases_customer;
DROP INDEX IF EXISTS idx_premium_purchases_status;
DROP INDEX IF EXISTS idx_premium_purchases_due_date;
DROP INDEX IF EXISTS idx_premium_purchases_overdue;

DROP INDEX IF EXISTS idx_premium_suggestions_category;
DROP INDEX IF EXISTS idx_premium_suggestions_keyword;

DROP INDEX IF EXISTS idx_premium_domains_plan_required;
DROP INDEX IF EXISTS idx_premium_domains_owner_id;
DROP INDEX IF EXISTS idx_premium_domains_protected;

-- Profile Links
DROP INDEX IF EXISTS idx_profile_links_system;
DROP INDEX IF EXISTS idx_profile_links_expires_at;

-- User Profiles
DROP INDEX IF EXISTS idx_user_profiles_domain_id;
DROP INDEX IF EXISTS idx_user_profiles_active;

-- Recovery Codes
DROP INDEX IF EXISTS idx_recovery_codes_user_id;
DROP INDEX IF EXISTS idx_recovery_codes_unused;

-- Customers
DROP INDEX IF EXISTS idx_customers_totp_enabled;

-- Protected Brands
DROP INDEX IF EXISTS idx_protected_brands_active;

-- Theme Templates
DROP INDEX IF EXISTS idx_theme_templates_category;
DROP INDEX IF EXISTS idx_theme_templates_premium;
DROP INDEX IF EXISTS idx_applied_templates_template;

-- Highlights and Stories
DROP INDEX IF EXISTS idx_highlight_stories_highlight;
DROP INDEX IF EXISTS idx_highlight_stories_story_id;

-- Polls
DROP INDEX IF EXISTS idx_poll_options_poll;
DROP INDEX IF EXISTS idx_poll_votes_poll;
DROP INDEX IF EXISTS idx_poll_votes_option_id;

-- Directory
DROP INDEX IF EXISTS idx_directory_tags;
DROP INDEX IF EXISTS idx_directory_category;

-- Domain Transfers
DROP INDEX IF EXISTS idx_domain_transfers_payment_id;
DROP INDEX IF EXISTS idx_domain_transfers_domain_id;
DROP INDEX IF EXISTS idx_domain_transfers_from_customer;
DROP INDEX IF EXISTS idx_domain_transfers_to_customer;
DROP INDEX IF EXISTS idx_domain_transfers_status;
DROP INDEX IF EXISTS idx_domain_transfers_created_at;

-- Profile Admins
DROP INDEX IF EXISTS idx_profile_admins_invited_by;
DROP INDEX IF EXISTS idx_admins_user;

-- Profile Change History
DROP INDEX IF EXISTS idx_profile_change_history_user_id;

-- Form Submissions
DROP INDEX IF EXISTS idx_submissions_form;

-- Content Subscriptions
DROP INDEX IF EXISTS idx_content_subs_content;

-- A/B Testing
DROP INDEX IF EXISTS idx_ab_variants_test;
DROP INDEX IF EXISTS idx_ab_results_test;
DROP INDEX IF EXISTS idx_ab_results_variant;
