/*
  # Remove Email Functionality

  Remove all email-related tables and functionality as the system will only handle domain registration.

  ## Changes
  
  1. Drop Tables
    - Drop `aliases` table (email aliases)
    - Drop `mailboxes` table (email mailboxes)
    - Drop `mail_domains` table (email domain provisioning)
    
  2. Update Tables
    - Remove email-related columns from `pricing_plans`
    - Keep only domain-related plans
    
  ## Notes
  - This is a destructive operation - all email data will be lost
  - Only domain registration functionality will remain
*/

-- Drop tables in correct order (respecting foreign keys)
DROP TABLE IF EXISTS aliases CASCADE;
DROP TABLE IF EXISTS mailboxes CASCADE;
DROP TABLE IF EXISTS mail_domains CASCADE;

-- Clean up pricing_plans - remove email plans
DELETE FROM pricing_plans WHERE product_type = 'email' OR product_type IS NULL;

-- Remove email-related columns from pricing_plans (optional, keeping for backwards compatibility)
-- ALTER TABLE pricing_plans DROP COLUMN IF EXISTS mailboxes_included;
-- ALTER TABLE pricing_plans DROP COLUMN IF EXISTS mailbox_quota_mb;
-- ALTER TABLE pricing_plans DROP COLUMN IF EXISTS aliases_limit;

-- Remove DKIM columns from domains table as they're email-specific
ALTER TABLE domains DROP COLUMN IF EXISTS dkim_selector;
ALTER TABLE domains DROP COLUMN IF EXISTS dkim_public;