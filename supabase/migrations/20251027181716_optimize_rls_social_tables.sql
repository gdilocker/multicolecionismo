/*
  # Optimize RLS Policies - Social Network Tables
  
  1. Changes
    - Replace auth.uid() with (SELECT auth.uid())
    - Optimize all social_ tables policies
  
  2. Tables Updated
    - social_posts, social_likes, social_comments
    - social_shares, social_follows, social_reports
    - social_notifications, social_bookmarks
*/

-- ============================================
-- SOCIAL_POSTS TABLE
-- ============================================

DROP POLICY IF EXISTS "Paid users can create posts" ON social_posts;
DROP POLICY IF EXISTS "Users can view own posts" ON social_posts;
DROP POLICY IF EXISTS "Users can update own posts" ON social_posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON social_posts;

CREATE POLICY "Paid users can create posts"
  ON social_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()) AND can_user_post((SELECT auth.uid())));

CREATE POLICY "Users can view own posts"
  ON social_posts
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own posts"
  ON social_posts
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own posts"
  ON social_posts
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ============================================
-- SOCIAL_LIKES TABLE
-- ============================================

DROP POLICY IF EXISTS "Users can like posts" ON social_likes;
DROP POLICY IF EXISTS "Users can unlike posts" ON social_likes;

CREATE POLICY "Users can like posts"
  ON social_likes
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can unlike posts"
  ON social_likes
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ============================================
-- SOCIAL_COMMENTS TABLE
-- ============================================

DROP POLICY IF EXISTS "Users can create comments" ON social_comments;
DROP POLICY IF EXISTS "Users can update own comments" ON social_comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON social_comments;

CREATE POLICY "Users can create comments"
  ON social_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own comments"
  ON social_comments
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own comments"
  ON social_comments
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ============================================
-- SOCIAL_SHARES TABLE
-- ============================================

DROP POLICY IF EXISTS "Users can share posts" ON social_shares;

CREATE POLICY "Users can share posts"
  ON social_shares
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================
-- SOCIAL_FOLLOWS TABLE
-- ============================================

DROP POLICY IF EXISTS "Users can follow others" ON social_follows;
DROP POLICY IF EXISTS "Users can unfollow" ON social_follows;

CREATE POLICY "Users can follow others"
  ON social_follows
  FOR INSERT
  TO authenticated
  WITH CHECK (follower_id = (SELECT auth.uid()));

CREATE POLICY "Users can unfollow"
  ON social_follows
  FOR DELETE
  TO authenticated
  USING (follower_id = (SELECT auth.uid()));

-- ============================================
-- SOCIAL_REPORTS TABLE
-- ============================================

DROP POLICY IF EXISTS "Users can create reports" ON social_reports;
DROP POLICY IF EXISTS "Users can view own reports" ON social_reports;

CREATE POLICY "Users can create reports"
  ON social_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (reporter_id = (SELECT auth.uid()));

CREATE POLICY "Users can view own reports"
  ON social_reports
  FOR SELECT
  TO authenticated
  USING (reporter_id = (SELECT auth.uid()));

-- ============================================
-- SOCIAL_NOTIFICATIONS TABLE
-- ============================================

DROP POLICY IF EXISTS "Users can view own notifications" ON social_notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON social_notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON social_notifications;

CREATE POLICY "Users can view own notifications"
  ON social_notifications
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own notifications"
  ON social_notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own notifications"
  ON social_notifications
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ============================================
-- SOCIAL_BOOKMARKS TABLE
-- ============================================

DROP POLICY IF EXISTS "Users can create bookmarks" ON social_bookmarks;
DROP POLICY IF EXISTS "Users can view own bookmarks" ON social_bookmarks;
DROP POLICY IF EXISTS "Users can delete bookmarks" ON social_bookmarks;

CREATE POLICY "Users can create bookmarks"
  ON social_bookmarks
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can view own bookmarks"
  ON social_bookmarks
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete bookmarks"
  ON social_bookmarks
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));
