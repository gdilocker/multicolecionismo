/*
  # Add Comment Likes Table

  1. New Table
    - `social_comment_likes`
      - `id` (uuid, primary key)
      - `comment_id` (uuid, foreign key to social_comments)
      - `user_id` (uuid, foreign key to auth.users)
      - `created_at` (timestamp)
  
  2. Security
    - Enable RLS
    - Users can like/unlike comments
    - Anyone can view likes
*/

-- Create comment likes table
CREATE TABLE IF NOT EXISTS public.social_comment_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES public.social_comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON public.social_comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON public.social_comment_likes(user_id);

-- Enable RLS
ALTER TABLE public.social_comment_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view comment likes"
  ON public.social_comment_likes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can like comments"
  ON public.social_comment_likes
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can unlike own likes"
  ON public.social_comment_likes
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));
