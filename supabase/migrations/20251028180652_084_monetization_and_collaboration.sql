/*
  # Monetization and Collaboration Features
  
  1. New Tables
    - `profile_admins` - Multi-admin support
    - `profile_change_history` - Audit log
    - `tip_donations` - Tips/donations tracking
    - `subscription_content` - Paywalled content
    - `content_subscriptions` - User subscriptions
    - `public_profiles_directory` - Directory listing
  
  2. Security
    - Enable RLS
*/

-- Multi-Admin Support
CREATE TABLE IF NOT EXISTS profile_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'editor')),
  permissions jsonb DEFAULT '[]'::jsonb,
  invited_by uuid REFERENCES auth.users(id),
  invited_at timestamptz DEFAULT now(),
  UNIQUE(profile_id, user_id)
);

-- Change History / Audit Log
CREATE TABLE IF NOT EXISTS profile_change_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  change_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  old_value jsonb,
  new_value jsonb,
  changed_at timestamptz DEFAULT now()
);

-- Tips / Donations
CREATE TABLE IF NOT EXISTS tip_donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  currency text DEFAULT 'USD',
  donor_name text,
  donor_email text,
  message text,
  payment_provider text NOT NULL,
  payment_id text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  created_at timestamptz DEFAULT now()
);

-- Subscription-based Content
CREATE TABLE IF NOT EXISTS subscription_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  content_type text CHECK (content_type IN ('link', 'file', 'video', 'text')),
  content_url text,
  price_monthly numeric(10,2),
  price_yearly numeric(10,2),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS content_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL REFERENCES subscription_content(id) ON DELETE CASCADE,
  subscriber_email text NOT NULL,
  subscription_type text CHECK (subscription_type IN ('monthly', 'yearly')),
  payment_provider text NOT NULL,
  subscription_id text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'paused')),
  started_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  UNIQUE(content_id, subscriber_email)
);

-- Public Profiles Directory
CREATE TABLE IF NOT EXISTS public_profiles_directory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  category text,
  tags text[],
  featured boolean DEFAULT false,
  view_count integer DEFAULT 0,
  added_at timestamptz DEFAULT now(),
  UNIQUE(profile_id)
);

-- UTM Parameters Tracking
CREATE TABLE IF NOT EXISTS utm_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  campaign_name text NOT NULL,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  click_count integer DEFAULT 0,
  conversion_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profile_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_change_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE tip_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_profiles_directory ENABLE ROW LEVEL SECURITY;
ALTER TABLE utm_campaigns ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admins
CREATE POLICY "Users can view own profile admins" ON profile_admins FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = profile_admins.profile_id AND user_profiles.user_id = auth.uid()));
CREATE POLICY "Profile owners manage admins" ON profile_admins FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = profile_admins.profile_id AND user_profiles.user_id = auth.uid()));

-- Change History
CREATE POLICY "Users view own change history" ON profile_change_history FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = profile_change_history.profile_id AND user_profiles.user_id = auth.uid()));
CREATE POLICY "System creates change history" ON profile_change_history FOR INSERT WITH CHECK (true);

-- Tips
CREATE POLICY "Anyone can create tips" ON tip_donations FOR INSERT WITH CHECK (true);
CREATE POLICY "Users view own tips" ON tip_donations FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = tip_donations.profile_id AND user_profiles.user_id = auth.uid()));

-- Subscription Content
CREATE POLICY "Public can view active subscription content" ON subscription_content FOR SELECT USING (is_active = true);
CREATE POLICY "Users manage own subscription content" ON subscription_content FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = subscription_content.profile_id AND user_profiles.user_id = auth.uid()));

-- Content Subscriptions
CREATE POLICY "Users view own content subscriptions" ON content_subscriptions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM subscription_content JOIN user_profiles ON user_profiles.id = subscription_content.profile_id WHERE subscription_content.id = content_subscriptions.content_id AND user_profiles.user_id = auth.uid()));

-- Public Directory
CREATE POLICY "Anyone can view directory" ON public_profiles_directory FOR SELECT USING (true);
CREATE POLICY "Users manage own directory entry" ON public_profiles_directory FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = public_profiles_directory.profile_id AND user_profiles.user_id = auth.uid()));

-- UTM Campaigns
CREATE POLICY "Users manage own campaigns" ON utm_campaigns FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = utm_campaigns.profile_id AND user_profiles.user_id = auth.uid()));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_admins_profile ON profile_admins(profile_id);
CREATE INDEX IF NOT EXISTS idx_admins_user ON profile_admins(user_id);
CREATE INDEX IF NOT EXISTS idx_change_history_profile ON profile_change_history(profile_id);
CREATE INDEX IF NOT EXISTS idx_tips_profile ON tip_donations(profile_id);
CREATE INDEX IF NOT EXISTS idx_subscription_content_profile ON subscription_content(profile_id);
CREATE INDEX IF NOT EXISTS idx_content_subs_content ON content_subscriptions(content_id);
CREATE INDEX IF NOT EXISTS idx_directory_category ON public_profiles_directory(category);
CREATE INDEX IF NOT EXISTS idx_directory_tags ON public_profiles_directory USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_utm_profile ON utm_campaigns(profile_id);
