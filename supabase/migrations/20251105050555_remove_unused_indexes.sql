/*
  # Remove Unused Indexes

  ## Summary
  Removes 4 indexes that have never been used (0 scans) to improve
  INSERT/UPDATE performance and reduce storage overhead.

  ## Impact
  - Reduces storage overhead
  - Faster INSERT/UPDATE operations
  - Cleaner database structure
  - Zero risk - indexes have 0 scans, meaning they're never used
*/

-- Remove unused chatbot conversation customer index
DROP INDEX IF EXISTS public.idx_chatbot_conversations_customer_id;

-- Remove unused chatbot handoff resolved_by index
DROP INDEX IF EXISTS public.idx_chatbot_handoffs_resolved_by;

-- Remove unused social comment likes user_id index
DROP INDEX IF EXISTS public.idx_social_comment_likes_user_id;

-- Remove unused system settings updated_by index
DROP INDEX IF EXISTS public.idx_system_settings_updated_by;
