/*
  # Social Network System - Complete Implementation

  ## Overview
  Complete social network system with TikTok-style vertical feed, including posts, 
  likes, comments, shares, follows, notifications, reports, and moderation.

  ## New Tables

  ### 1. `social_posts`
  Main content table for user posts (text, images, videos)
  - `id` (uuid, primary key)
  - `user_id` (uuid, FK to auth.users)
  - `content_type` (text: 'text', 'image', 'video', 'mixed')
  - `caption` (text)
  - `media_urls` (jsonb array of media files)
  - `privacy` (text: 'public', 'followers', 'private')
  - `hashtags` (text array)
  - `is_active` (boolean - for soft delete/moderation)
  - `view_count` (bigint)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. `social_likes`
  Track likes on posts
  - `id` (uuid, primary key)
  - `post_id` (uuid, FK to social_posts)
  - `user_id` (uuid, FK to auth.users)
  - `created_at` (timestamptz)
  - Unique constraint on (post_id, user_id)

  ### 3. `social_comments`
  Comments and replies on posts
  - `id` (uuid, primary key)
  - `post_id` (uuid, FK to social_posts)
  - `user_id` (uuid, FK to auth.users)
  - `parent_comment_id` (uuid, nullable - for replies)
  - `content` (text)
  - `is_active` (boolean)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 4. `social_shares`
  Track when users share posts
  - `id` (uuid, primary key)
  - `post_id` (uuid, FK to social_posts)
  - `user_id` (uuid, FK to auth.users)
  - `shared_to` (text: 'profile', 'external', 'message')
  - `created_at` (timestamptz)

  ### 5. `social_follows`
  Follow relationships between users
  - `id` (uuid, primary key)
  - `follower_id` (uuid, FK to auth.users - who is following)
  - `following_id` (uuid, FK to auth.users - who is being followed)
  - `created_at` (timestamptz)
  - Unique constraint on (follower_id, following_id)

  ### 6. `social_reports`
  User reports for content moderation
  - `id` (uuid, primary key)
  - `reporter_id` (uuid, FK to auth.users)
  - `reported_post_id` (uuid, nullable, FK to social_posts)
  - `reported_comment_id` (uuid, nullable, FK to social_comments)
  - `reported_user_id` (uuid, nullable, FK to auth.users)
  - `reason` (text: 'spam', 'inappropriate', 'harassment', 'misleading', 'other')
  - `description` (text)
  - `status` (text: 'pending', 'reviewing', 'resolved', 'dismissed')
  - `reviewed_by` (uuid, nullable, FK to auth.users - admin)
  - `reviewed_at` (timestamptz, nullable)
  - `resolution_notes` (text, nullable)
  - `created_at` (timestamptz)

  ### 7. `social_notifications`
  User notifications for social interactions
  - `id` (uuid, primary key)
  - `user_id` (uuid, FK to auth.users - recipient)
  - `actor_id` (uuid, FK to auth.users - who triggered the notification)
  - `type` (text: 'like', 'comment', 'follow', 'share', 'mention', 'reply')
  - `post_id` (uuid, nullable, FK to social_posts)
  - `comment_id` (uuid, nullable, FK to social_comments)
  - `is_read` (boolean)
  - `created_at` (timestamptz)

  ### 8. `social_bookmarks`
  User saved/favorited posts
  - `id` (uuid, primary key)
  - `user_id` (uuid, FK to auth.users)
  - `post_id` (uuid, FK to social_posts)
  - `created_at` (timestamptz)
  - Unique constraint on (user_id, post_id)

  ## Security
  - RLS enabled on all tables
  - Free users: read, like, comment, share, follow
  - Paid users (Standard/Elite/Supreme): all free permissions + create posts
  - Post creators can edit/delete their own posts
  - Admins can moderate all content
  - Privacy settings enforced through RLS

  ## Indexes
  - Performance indexes for feeds, user lookups, and aggregations
*/

-- =====================================================
-- 1. SOCIAL POSTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS social_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type text NOT NULL CHECK (content_type IN ('text', 'image', 'video', 'mixed')),
  caption text,
  media_urls jsonb DEFAULT '[]'::jsonb,
  privacy text NOT NULL DEFAULT 'public' CHECK (privacy IN ('public', 'followers', 'private')),
  hashtags text[] DEFAULT ARRAY[]::text[],
  is_active boolean DEFAULT true,
  view_count bigint DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_social_posts_user_id ON social_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_created_at ON social_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_posts_is_active ON social_posts(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_social_posts_privacy ON social_posts(privacy);
CREATE INDEX IF NOT EXISTS idx_social_posts_hashtags ON social_posts USING gin(hashtags);

-- =====================================================
-- 2. SOCIAL LIKES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS social_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_social_likes_post_id ON social_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_social_likes_user_id ON social_likes(user_id);

-- =====================================================
-- 3. SOCIAL COMMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS social_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_comment_id uuid REFERENCES social_comments(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_social_comments_post_id ON social_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_social_comments_user_id ON social_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_social_comments_parent_id ON social_comments(parent_comment_id);

-- =====================================================
-- 4. SOCIAL SHARES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS social_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_to text NOT NULL CHECK (shared_to IN ('profile', 'external', 'message')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_social_shares_post_id ON social_shares(post_id);
CREATE INDEX IF NOT EXISTS idx_social_shares_user_id ON social_shares(user_id);

-- =====================================================
-- 5. SOCIAL FOLLOWS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS social_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

CREATE INDEX IF NOT EXISTS idx_social_follows_follower_id ON social_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_social_follows_following_id ON social_follows(following_id);

-- =====================================================
-- 6. SOCIAL REPORTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS social_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_post_id uuid REFERENCES social_posts(id) ON DELETE CASCADE,
  reported_comment_id uuid REFERENCES social_comments(id) ON DELETE CASCADE,
  reported_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL CHECK (reason IN ('spam', 'inappropriate', 'harassment', 'misleading', 'other')),
  description text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  resolution_notes text,
  created_at timestamptz DEFAULT now(),
  CHECK (
    (reported_post_id IS NOT NULL AND reported_comment_id IS NULL AND reported_user_id IS NULL) OR
    (reported_post_id IS NULL AND reported_comment_id IS NOT NULL AND reported_user_id IS NULL) OR
    (reported_post_id IS NULL AND reported_comment_id IS NULL AND reported_user_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_social_reports_status ON social_reports(status);
CREATE INDEX IF NOT EXISTS idx_social_reports_created_at ON social_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_reports_reporter_id ON social_reports(reporter_id);

-- =====================================================
-- 7. SOCIAL NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS social_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('like', 'comment', 'follow', 'share', 'mention', 'reply')),
  post_id uuid REFERENCES social_posts(id) ON DELETE CASCADE,
  comment_id uuid REFERENCES social_comments(id) ON DELETE CASCADE,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_social_notifications_user_id ON social_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_social_notifications_is_read ON social_notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_social_notifications_created_at ON social_notifications(created_at DESC);

-- =====================================================
-- 8. SOCIAL BOOKMARKS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS social_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_social_bookmarks_user_id ON social_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_social_bookmarks_post_id ON social_bookmarks(post_id);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_bookmarks ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES: SOCIAL POSTS
-- =====================================================

-- Anyone can view public posts
CREATE POLICY "Anyone can view public active posts"
  ON social_posts FOR SELECT
  TO authenticated
  USING (is_active = true AND privacy = 'public');

-- Users can view followers-only posts if they follow the author
CREATE POLICY "Followers can view followers-only posts"
  ON social_posts FOR SELECT
  TO authenticated
  USING (
    is_active = true 
    AND privacy = 'followers' 
    AND (
      user_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM social_follows 
        WHERE follower_id = auth.uid() AND following_id = social_posts.user_id
      )
    )
  );

-- Users can view their own posts regardless of privacy
CREATE POLICY "Users can view own posts"
  ON social_posts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Paid users (Standard/Elite/Supreme) can create posts
CREATE POLICY "Paid users can create posts"
  ON social_posts FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM subscriptions s
      JOIN subscription_plans sp ON s.plan_id = sp.id
      WHERE s.user_id = auth.uid() 
      AND s.status = 'active'
      AND sp.plan_type IN ('standard', 'elite', 'supreme')
    )
  );

-- Users can update their own posts
CREATE POLICY "Users can update own posts"
  ON social_posts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own posts
CREATE POLICY "Users can delete own posts"
  ON social_posts FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can moderate all posts
CREATE POLICY "Admins can moderate all posts"
  ON social_posts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- RLS POLICIES: SOCIAL LIKES
-- =====================================================

-- Anyone can view likes on posts they can see
CREATE POLICY "Users can view likes on visible posts"
  ON social_likes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM social_posts 
      WHERE id = social_likes.post_id
    )
  );

-- Authenticated users can like posts
CREATE POLICY "Users can like posts"
  ON social_likes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can unlike posts
CREATE POLICY "Users can unlike posts"
  ON social_likes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- =====================================================
-- RLS POLICIES: SOCIAL COMMENTS
-- =====================================================

-- Anyone can view active comments on posts they can see
CREATE POLICY "Users can view active comments on visible posts"
  ON social_comments FOR SELECT
  TO authenticated
  USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM social_posts 
      WHERE id = social_comments.post_id
    )
  );

-- Authenticated users can comment
CREATE POLICY "Users can create comments"
  ON social_comments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own comments
CREATE POLICY "Users can update own comments"
  ON social_comments FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
  ON social_comments FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- =====================================================
-- RLS POLICIES: SOCIAL SHARES
-- =====================================================

-- Users can view shares on posts they can see
CREATE POLICY "Users can view shares on visible posts"
  ON social_shares FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM social_posts 
      WHERE id = social_shares.post_id
    )
  );

-- Authenticated users can share posts
CREATE POLICY "Users can share posts"
  ON social_shares FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- RLS POLICIES: SOCIAL FOLLOWS
-- =====================================================

-- Anyone can view follow relationships
CREATE POLICY "Users can view follows"
  ON social_follows FOR SELECT
  TO authenticated
  USING (true);

-- Users can follow others
CREATE POLICY "Users can follow others"
  ON social_follows FOR INSERT
  TO authenticated
  WITH CHECK (follower_id = auth.uid());

-- Users can unfollow
CREATE POLICY "Users can unfollow"
  ON social_follows FOR DELETE
  TO authenticated
  USING (follower_id = auth.uid());

-- =====================================================
-- RLS POLICIES: SOCIAL REPORTS
-- =====================================================

-- Users can view their own reports
CREATE POLICY "Users can view own reports"
  ON social_reports FOR SELECT
  TO authenticated
  USING (reporter_id = auth.uid());

-- Admins can view all reports
CREATE POLICY "Admins can view all reports"
  ON social_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Authenticated users can create reports
CREATE POLICY "Users can create reports"
  ON social_reports FOR INSERT
  TO authenticated
  WITH CHECK (reporter_id = auth.uid());

-- Admins can update reports (review/resolve)
CREATE POLICY "Admins can update reports"
  ON social_reports FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- RLS POLICIES: SOCIAL NOTIFICATIONS
-- =====================================================

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON social_notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- System can create notifications (triggered by actions)
CREATE POLICY "System can create notifications"
  ON social_notifications FOR INSERT
  TO authenticated
  WITH CHECK (actor_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON social_notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON social_notifications FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- =====================================================
-- RLS POLICIES: SOCIAL BOOKMARKS
-- =====================================================

-- Users can view their own bookmarks
CREATE POLICY "Users can view own bookmarks"
  ON social_bookmarks FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can bookmark posts
CREATE POLICY "Users can create bookmarks"
  ON social_bookmarks FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can remove bookmarks
CREATE POLICY "Users can delete bookmarks"
  ON social_bookmarks FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get post stats (likes, comments, shares count)
CREATE OR REPLACE FUNCTION get_post_stats(post_uuid uuid)
RETURNS TABLE(likes_count bigint, comments_count bigint, shares_count bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM social_likes WHERE post_id = post_uuid),
    (SELECT COUNT(*) FROM social_comments WHERE post_id = post_uuid AND is_active = true),
    (SELECT COUNT(*) FROM social_shares WHERE post_id = post_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user stats (followers, following, posts count)
CREATE OR REPLACE FUNCTION get_user_social_stats(user_uuid uuid)
RETURNS TABLE(followers_count bigint, following_count bigint, posts_count bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM social_follows WHERE following_id = user_uuid),
    (SELECT COUNT(*) FROM social_follows WHERE follower_id = user_uuid),
    (SELECT COUNT(*) FROM social_posts WHERE user_id = user_uuid AND is_active = true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can post
CREATE OR REPLACE FUNCTION can_user_post(user_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM subscriptions s
    JOIN subscription_plans sp ON s.plan_id = sp.id
    WHERE s.user_id = user_uuid 
    AND s.status = 'active'
    AND sp.plan_type IN ('standard', 'elite', 'supreme')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
