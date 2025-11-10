/*
  # New Subscription Plans System

  This migration creates a new subscription-based system for com.rich with two main plans:
  Standard ($50/month) and Elite ($100/month). Both plans provide subdomain access and
  profile pages within com.rich.

  ## Changes

  1. New Tables
    - `subscription_plans` - Defines the Standard and Elite plans
    - `subscriptions` - Tracks active user subscriptions
    - `user_profiles` - Stores user profile pages (bio, avatar, links)
    - `profile_links` - Links displayed on user profile pages
    - `profile_stats` - Tracks profile views and link clicks
    - `subdomains` - Manages user subdomains (username.com.rich)
    - `physical_cards` - Tracks Elite member physical cards

  2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users to manage their own data
    - Add policies for public access to profile pages

  3. Affiliate Program
    - Referral tracking integrated into subscriptions
    - 50% recurring commission for active referrals
*/

-- Create subscription_plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_name text NOT NULL UNIQUE,
  plan_type text NOT NULL CHECK (plan_type IN ('standard', 'elite')),
  price_usd numeric(10, 2) NOT NULL,
  billing_cycle text NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  description text,
  features jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES subscription_plans(id),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
  paypal_subscription_id text,
  started_at timestamptz DEFAULT now(),
  next_billing_date timestamptz,
  cancelled_at timestamptz,
  expires_at timestamptz,
  referred_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  subdomain text NOT NULL UNIQUE,
  display_name text,
  bio text,
  avatar_url text,
  theme text DEFAULT 'dark' CHECK (theme IN ('dark', 'light', 'auto')),
  is_public boolean DEFAULT true,
  custom_css text,
  view_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create profile_links table
CREATE TABLE IF NOT EXISTS profile_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  url text NOT NULL,
  icon text,
  position integer DEFAULT 0,
  click_count integer DEFAULT 0,
  is_visible boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create profile_stats table
CREATE TABLE IF NOT EXISTS profile_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  views integer DEFAULT 0,
  unique_visitors integer DEFAULT 0,
  link_clicks integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(profile_id, date)
);

-- Create subdomains table
CREATE TABLE IF NOT EXISTS subdomains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subdomain text NOT NULL UNIQUE,
  status text DEFAULT 'active' CHECK (status IN ('active', 'reserved', 'suspended')),
  dns_configured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create physical_cards table (Elite only)
CREATE TABLE IF NOT EXISTS physical_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id uuid NOT NULL REFERENCES subscriptions(id),
  card_number text UNIQUE,
  qr_code_url text,
  shipping_status text DEFAULT 'pending' CHECK (shipping_status IN ('pending', 'processing', 'shipped', 'delivered')),
  tracking_number text,
  shipping_address jsonb,
  ordered_at timestamptz DEFAULT now(),
  shipped_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE subdomains ENABLE ROW LEVEL SECURITY;
ALTER TABLE physical_cards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_plans (public read)
CREATE POLICY "Anyone can view active subscription plans"
  ON subscription_plans FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

CREATE POLICY "Admins can manage subscription plans"
  ON subscription_plans FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = auth.uid()
      AND customers.role = 'admin'
    )
  );

-- RLS Policies for subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions"
  ON subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions"
  ON subscriptions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all subscriptions"
  ON subscriptions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = auth.uid()
      AND customers.role = 'admin'
    )
  );

-- RLS Policies for user_profiles (public read for published profiles)
CREATE POLICY "Anyone can view public profiles"
  ON user_profiles FOR SELECT
  TO authenticated, anon
  USING (is_public = true);

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile"
  ON user_profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for profile_links
CREATE POLICY "Anyone can view links from public profiles"
  ON profile_links FOR SELECT
  TO authenticated, anon
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = profile_links.profile_id
      AND user_profiles.is_public = true
    )
  );

CREATE POLICY "Users can manage own profile links"
  ON profile_links FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = profile_links.profile_id
      AND user_profiles.user_id = auth.uid()
    )
  );

-- RLS Policies for profile_stats
CREATE POLICY "Users can view own profile stats"
  ON profile_stats FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = profile_stats.profile_id
      AND user_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert profile stats"
  ON profile_stats FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update profile stats"
  ON profile_stats FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for subdomains
CREATE POLICY "Users can view own subdomains"
  ON subdomains FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subdomains"
  ON subdomains FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all subdomains"
  ON subdomains FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = auth.uid()
      AND customers.role = 'admin'
    )
  );

-- RLS Policies for physical_cards
CREATE POLICY "Users can view own physical cards"
  ON physical_cards FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all physical cards"
  ON physical_cards FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.user_id = auth.uid()
      AND customers.role = 'admin'
    )
  );

-- Insert default subscription plans
INSERT INTO subscription_plans (plan_name, plan_type, price_usd, description, features) VALUES
  (
    'Standard',
    'standard',
    50.00,
    'Presença digital premium. Ideal para quem deseja ter um endereço digital exclusivo dentro de com.rich.',
    '[
      "Subdomínio personalizado (seunome.com.rich)",
      "Página de perfil pública (estilo Linktree de luxo)",
      "Editor de bio, avatar e links ilimitados",
      "Estatísticas de acessos e cliques",
      "Acesso ao marketplace de nomes premium",
      "Participação no programa de afiliados (50% de comissão recorrente)",
      "Suporte via plataforma"
    ]'::jsonb
  ),
  (
    'Elite',
    'elite',
    100.00,
    'Identidade digital e física de alto padrão. Voltado para quem deseja ir além da imagem online.',
    '[
      "Tudo do plano Standard",
      "Cartão físico personalizado com QR Code dinâmico",
      "Design Black & Gold Edition exclusivo",
      "Selo Elite Member no painel e na página pública",
      "Destaque nas listagens e buscas internas",
      "Acesso antecipado ao marketplace de nomes premium",
      "Convites e benefícios exclusivos",
      "Suporte prioritário"
    ]'::jsonb
  )
ON CONFLICT (plan_name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_referred_by ON subscriptions(referred_by);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subdomain ON user_profiles(subdomain);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_links_profile_id ON profile_links(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_stats_profile_id_date ON profile_stats(profile_id, date);
CREATE INDEX IF NOT EXISTS idx_subdomains_subdomain ON subdomains(subdomain);
CREATE INDEX IF NOT EXISTS idx_physical_cards_user_id ON physical_cards(user_id);
