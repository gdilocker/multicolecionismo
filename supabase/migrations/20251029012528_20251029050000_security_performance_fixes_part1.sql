/*
  # Security and Performance Fixes - Part 1: Missing Indexes

  1. Missing Foreign Key Indexes
    - Adds indexes to foreign keys that are missing covering indexes
    - Improves query performance for JOIN operations

  2. Tables affected:
    - domain_transfers (payment_id)
    - highlight_stories (story_id)
    - poll_votes (option_id)
    - profile_admins (invited_by)
    - profile_change_history (user_id)

  3. Performance Impact
    - Significant improvement in JOIN queries
    - Better query plan selection
    - Reduced table scans
*/

-- Add missing foreign key indexes
CREATE INDEX IF NOT EXISTS idx_domain_transfers_payment_id
  ON public.domain_transfers(payment_id);

CREATE INDEX IF NOT EXISTS idx_highlight_stories_story_id
  ON public.highlight_stories(story_id);

CREATE INDEX IF NOT EXISTS idx_poll_votes_option_id
  ON public.poll_votes(option_id);

CREATE INDEX IF NOT EXISTS idx_profile_admins_invited_by
  ON public.profile_admins(invited_by);

CREATE INDEX IF NOT EXISTS idx_profile_change_history_user_id
  ON public.profile_change_history(user_id);
