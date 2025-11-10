/*
  # RLS Policy Optimization - Social Tables

  1. Optimizations
    - Optimize all social network RLS policies
    - Fix performance issues with auth.uid() calls

  2. Tables Covered
    - social_posts
    - social_likes
    - social_comments
    - social_shares
    - social_follows
    - social_reports
    - social_notifications
    - social_bookmarks
    - recovery_codes
    - protected_brands
    - licensing_requests
    - premium_domains
*/

-- =====================================================
-- SOCIAL_POSTS
-- =====================================================

DROP POLICY IF EXISTS "Admins can moderate all posts" ON public.social_posts;
DROP POLICY IF EXISTS "Paid users can create posts" ON public.social_posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON public.social_posts;
DROP POLICY IF EXISTS "Users can update own posts" ON public.social_posts;
DROP POLICY IF EXISTS "Users can view own posts" ON public.social_posts;
DROP POLICY IF EXISTS "Followers can view followers-only posts" ON public.social_posts;

CREATE POLICY "Admins can moderate all posts"
  ON public.social_posts
  TO authenticated
  USING (public.get_user_role((select auth.uid())) = 'admin');

CREATE POLICY "Paid users can create posts"
  ON public.social_posts FOR INSERT
  TO authenticated
  WITH CHECK (
    public.can_user_post((select auth.uid()))
  );

CREATE POLICY "Users can delete own posts"
  ON public.social_posts FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can update own posts"
  ON public.social_posts FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can view own posts"
  ON public.social_posts FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Followers can view followers-only posts"
  ON public.social_posts FOR SELECT
  TO authenticated
  USING (
    privacy = 'followers' AND
    EXISTS (
      SELECT 1 FROM public.social_follows
      WHERE social_follows.following_id = social_posts.user_id
      AND social_follows.follower_id = (select auth.uid())
    )
  );

-- =====================================================
-- SOCIAL_LIKES
-- =====================================================

DROP POLICY IF EXISTS "Users can like posts" ON public.social_likes;
DROP POLICY IF EXISTS "Users can unlike posts" ON public.social_likes;

CREATE POLICY "Users can like posts"
  ON public.social_likes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can unlike posts"
  ON public.social_likes FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- =====================================================
-- SOCIAL_COMMENTS
-- =====================================================

DROP POLICY IF EXISTS "Users can create comments" ON public.social_comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.social_comments;
DROP POLICY IF EXISTS "Users can update own comments" ON public.social_comments;

CREATE POLICY "Users can create comments"
  ON public.social_comments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own comments"
  ON public.social_comments FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can update own comments"
  ON public.social_comments FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- =====================================================
-- SOCIAL_SHARES
-- =====================================================

DROP POLICY IF EXISTS "Users can share posts" ON public.social_shares;

CREATE POLICY "Users can share posts"
  ON public.social_shares FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- =====================================================
-- SOCIAL_FOLLOWS
-- =====================================================

DROP POLICY IF EXISTS "Users can follow others" ON public.social_follows;
DROP POLICY IF EXISTS "Users can unfollow" ON public.social_follows;

CREATE POLICY "Users can follow others"
  ON public.social_follows FOR INSERT
  TO authenticated
  WITH CHECK (follower_id = (select auth.uid()));

CREATE POLICY "Users can unfollow"
  ON public.social_follows FOR DELETE
  TO authenticated
  USING (follower_id = (select auth.uid()));

-- =====================================================
-- SOCIAL_REPORTS
-- =====================================================

DROP POLICY IF EXISTS "Admins can update reports" ON public.social_reports;
DROP POLICY IF EXISTS "Admins can view all reports" ON public.social_reports;
DROP POLICY IF EXISTS "Users can create reports" ON public.social_reports;
DROP POLICY IF EXISTS "Users can view own reports" ON public.social_reports;

CREATE POLICY "Admins can update reports"
  ON public.social_reports FOR UPDATE
  TO authenticated
  USING (public.get_user_role((select auth.uid())) = 'admin');

CREATE POLICY "Admins can view all reports"
  ON public.social_reports FOR SELECT
  TO authenticated
  USING (public.get_user_role((select auth.uid())) = 'admin');

CREATE POLICY "Users can create reports"
  ON public.social_reports FOR INSERT
  TO authenticated
  WITH CHECK (reporter_id = (select auth.uid()));

CREATE POLICY "Users can view own reports"
  ON public.social_reports FOR SELECT
  TO authenticated
  USING (reporter_id = (select auth.uid()));

-- =====================================================
-- SOCIAL_NOTIFICATIONS
-- =====================================================

DROP POLICY IF EXISTS "System can create notifications" ON public.social_notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.social_notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.social_notifications;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.social_notifications;

CREATE POLICY "System can create notifications"
  ON public.social_notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can delete own notifications"
  ON public.social_notifications FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can update own notifications"
  ON public.social_notifications FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can view own notifications"
  ON public.social_notifications FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

-- =====================================================
-- SOCIAL_BOOKMARKS
-- =====================================================

DROP POLICY IF EXISTS "Users can create bookmarks" ON public.social_bookmarks;
DROP POLICY IF EXISTS "Users can delete bookmarks" ON public.social_bookmarks;
DROP POLICY IF EXISTS "Users can view own bookmarks" ON public.social_bookmarks;

CREATE POLICY "Users can create bookmarks"
  ON public.social_bookmarks FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete bookmarks"
  ON public.social_bookmarks FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can view own bookmarks"
  ON public.social_bookmarks FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

-- =====================================================
-- RECOVERY_CODES
-- =====================================================

DROP POLICY IF EXISTS "Admins can view all recovery codes" ON public.recovery_codes;
DROP POLICY IF EXISTS "Users can create own recovery codes" ON public.recovery_codes;
DROP POLICY IF EXISTS "Users can update own recovery codes" ON public.recovery_codes;
DROP POLICY IF EXISTS "Users can view own recovery codes" ON public.recovery_codes;

CREATE POLICY "Admins can view all recovery codes"
  ON public.recovery_codes FOR SELECT
  TO authenticated
  USING (public.get_user_role((select auth.uid())) = 'admin');

CREATE POLICY "Users can create own recovery codes"
  ON public.recovery_codes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own recovery codes"
  ON public.recovery_codes FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can view own recovery codes"
  ON public.recovery_codes FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

-- =====================================================
-- PROTECTED_BRANDS
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage protected brands" ON public.protected_brands;

CREATE POLICY "Admins can manage protected brands"
  ON public.protected_brands
  TO authenticated
  USING (public.get_user_role((select auth.uid())) = 'admin');

-- =====================================================
-- LICENSING_REQUESTS
-- =====================================================

DROP POLICY IF EXISTS "Admins can update licensing requests" ON public.licensing_requests;
DROP POLICY IF EXISTS "Admins can view all licensing requests" ON public.licensing_requests;
DROP POLICY IF EXISTS "Users can create licensing requests" ON public.licensing_requests;
DROP POLICY IF EXISTS "Users can view own licensing requests" ON public.licensing_requests;

CREATE POLICY "Admins can update licensing requests"
  ON public.licensing_requests FOR UPDATE
  TO authenticated
  USING (public.get_user_role((select auth.uid())) = 'admin');

CREATE POLICY "Admins can view all licensing requests"
  ON public.licensing_requests FOR SELECT
  TO authenticated
  USING (public.get_user_role((select auth.uid())) = 'admin');

CREATE POLICY "Users can create licensing requests"
  ON public.licensing_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    customer_id IN (
      SELECT id FROM public.customers WHERE user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can view own licensing requests"
  ON public.licensing_requests FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM public.customers WHERE user_id = (select auth.uid())
    )
  );

-- =====================================================
-- PREMIUM_DOMAINS
-- =====================================================

DROP POLICY IF EXISTS "Admins can delete premium domains" ON public.premium_domains;
DROP POLICY IF EXISTS "Admins can insert premium domains" ON public.premium_domains;
DROP POLICY IF EXISTS "Admins can update premium domains" ON public.premium_domains;

CREATE POLICY "Admins can delete premium domains"
  ON public.premium_domains FOR DELETE
  TO authenticated
  USING (public.get_user_role((select auth.uid())) = 'admin');

CREATE POLICY "Admins can insert premium domains"
  ON public.premium_domains FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role((select auth.uid())) = 'admin');

CREATE POLICY "Admins can update premium domains"
  ON public.premium_domains FOR UPDATE
  TO authenticated
  USING (public.get_user_role((select auth.uid())) = 'admin');
