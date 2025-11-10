/*
  # Polls/Surveys System
  
  1. New Tables
    - `profile_polls`
      - Polls/surveys that users can create
      - Support for multiple choice questions
    
    - `poll_options`
      - Options for each poll
    
    - `poll_votes`
      - Track user votes
  
  2. Security
    - Enable RLS
    - Users manage their own polls
    - Public can vote on public profile polls
*/

-- Create profile_polls table
CREATE TABLE IF NOT EXISTS profile_polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  question text NOT NULL,
  is_active boolean DEFAULT true,
  allow_multiple_votes boolean DEFAULT false,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create poll_options table
CREATE TABLE IF NOT EXISTS poll_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES profile_polls(id) ON DELETE CASCADE,
  option_text text NOT NULL,
  vote_count integer DEFAULT 0,
  position integer DEFAULT 0
);

-- Create poll_votes table (track who voted)
CREATE TABLE IF NOT EXISTS poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES profile_polls(id) ON DELETE CASCADE,
  option_id uuid NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
  voter_ip text,
  voter_fingerprint text,
  voted_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profile_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

-- RLS for profile_polls
CREATE POLICY "Anyone can view active polls from public profiles"
  ON profile_polls FOR SELECT
  USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = profile_polls.profile_id
      AND user_profiles.is_public = true
    )
  );

CREATE POLICY "Users can manage own polls"
  ON profile_polls FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = profile_polls.profile_id
      AND user_profiles.user_id = auth.uid()
    )
  );

-- RLS for poll_options
CREATE POLICY "Anyone can view poll options"
  ON poll_options FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profile_polls
      JOIN user_profiles ON user_profiles.id = profile_polls.profile_id
      WHERE profile_polls.id = poll_options.poll_id
      AND profile_polls.is_active = true
      AND user_profiles.is_public = true
    )
  );

CREATE POLICY "Users can manage own poll options"
  ON poll_options FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profile_polls
      JOIN user_profiles ON user_profiles.id = profile_polls.profile_id
      WHERE profile_polls.id = poll_options.poll_id
      AND user_profiles.user_id = auth.uid()
    )
  );

-- RLS for poll_votes
CREATE POLICY "Users can view poll votes"
  ON poll_votes FOR SELECT
  USING (true);

CREATE POLICY "Anyone can vote on public polls"
  ON poll_votes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profile_polls
      JOIN user_profiles ON user_profiles.id = profile_polls.profile_id
      WHERE profile_polls.id = poll_votes.poll_id
      AND profile_polls.is_active = true
      AND user_profiles.is_public = true
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_polls_profile ON profile_polls(profile_id);
CREATE INDEX IF NOT EXISTS idx_poll_options_poll ON poll_options(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_poll ON poll_votes(poll_id);
