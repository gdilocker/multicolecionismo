/*
  # Advanced Profile Features
  
  1. New Tables
    - `lead_capture_forms` - Lead generation forms
    - `form_submissions` - Form submission data
    - `product_catalog` - Products showcase
    - `profile_faqs` - FAQ sections
    - `profile_comments` - Public profile comments
    - `profile_meta_tags` - Custom SEO meta tags
    - `click_analytics` - Track link clicks
    - `profile_webhooks` - Webhook integrations
  
  2. Security
    - Enable RLS on all tables
    - Proper access control
*/

-- Lead Capture Forms
CREATE TABLE IF NOT EXISTS lead_capture_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS form_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL REFERENCES lead_capture_forms(id) ON DELETE CASCADE,
  data jsonb NOT NULL,
  submitted_at timestamptz DEFAULT now(),
  ip_address text,
  user_agent text
);

-- Product Catalog
CREATE TABLE IF NOT EXISTS product_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric(10,2),
  currency text DEFAULT 'USD',
  image_url text,
  external_url text,
  is_available boolean DEFAULT true,
  position integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- FAQs
CREATE TABLE IF NOT EXISTS profile_faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text NOT NULL,
  position integer DEFAULT 0,
  is_visible boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Profile Comments
CREATE TABLE IF NOT EXISTS profile_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  author_email text,
  comment_text text NOT NULL,
  is_approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Custom Meta Tags
CREATE TABLE IF NOT EXISTS profile_meta_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  title text,
  description text,
  keywords text,
  og_image text,
  twitter_card_type text DEFAULT 'summary_large_image',
  updated_at timestamptz DEFAULT now(),
  UNIQUE(profile_id)
);

-- Click Analytics
CREATE TABLE IF NOT EXISTS click_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id uuid REFERENCES profile_links(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  clicked_at timestamptz DEFAULT now(),
  ip_address text,
  user_agent text,
  referrer text,
  country text,
  city text
);

-- Webhooks
CREATE TABLE IF NOT EXISTS profile_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  webhook_url text NOT NULL,
  secret_key text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Marketing Pixels
CREATE TABLE IF NOT EXISTS marketing_pixels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  pixel_type text NOT NULL CHECK (pixel_type IN ('facebook', 'google', 'tiktok', 'twitter')),
  pixel_id text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE lead_capture_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_meta_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE click_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_pixels ENABLE ROW LEVEL SECURITY;

-- RLS Policies (simplified for space)
-- Forms
CREATE POLICY "Public can view active forms" ON lead_capture_forms FOR SELECT USING (is_active = true);
CREATE POLICY "Users manage own forms" ON lead_capture_forms FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = lead_capture_forms.profile_id AND user_profiles.user_id = auth.uid()));

-- Form Submissions  
CREATE POLICY "Anyone can submit forms" ON form_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Users view own submissions" ON form_submissions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM lead_capture_forms JOIN user_profiles ON user_profiles.id = lead_capture_forms.profile_id WHERE lead_capture_forms.id = form_submissions.form_id AND user_profiles.user_id = auth.uid()));

-- Products
CREATE POLICY "Public can view available products" ON product_catalog FOR SELECT USING (is_available = true);
CREATE POLICY "Users manage own products" ON product_catalog FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = product_catalog.profile_id AND user_profiles.user_id = auth.uid()));

-- FAQs
CREATE POLICY "Public can view visible FAQs" ON profile_faqs FOR SELECT USING (is_visible = true);
CREATE POLICY "Users manage own FAQs" ON profile_faqs FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = profile_faqs.profile_id AND user_profiles.user_id = auth.uid()));

-- Comments
CREATE POLICY "Anyone can create comments" ON profile_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can view approved comments" ON profile_comments FOR SELECT USING (is_approved = true);
CREATE POLICY "Users manage own profile comments" ON profile_comments FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = profile_comments.profile_id AND user_profiles.user_id = auth.uid()));

-- Meta Tags
CREATE POLICY "Public can view meta tags" ON profile_meta_tags FOR SELECT USING (true);
CREATE POLICY "Users manage own meta tags" ON profile_meta_tags FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = profile_meta_tags.profile_id AND user_profiles.user_id = auth.uid()));

-- Analytics
CREATE POLICY "Anyone can create analytics" ON click_analytics FOR INSERT WITH CHECK (true);
CREATE POLICY "Users view own analytics" ON click_analytics FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = click_analytics.profile_id AND user_profiles.user_id = auth.uid()));

-- Webhooks
CREATE POLICY "Users manage own webhooks" ON profile_webhooks FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = profile_webhooks.profile_id AND user_profiles.user_id = auth.uid()));

-- Pixels
CREATE POLICY "Users manage own pixels" ON marketing_pixels FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = marketing_pixels.profile_id AND user_profiles.user_id = auth.uid()));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_forms_profile ON lead_capture_forms(profile_id);
CREATE INDEX IF NOT EXISTS idx_submissions_form ON form_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_products_profile ON product_catalog(profile_id);
CREATE INDEX IF NOT EXISTS idx_faqs_profile ON profile_faqs(profile_id);
CREATE INDEX IF NOT EXISTS idx_comments_profile ON profile_comments(profile_id);
CREATE INDEX IF NOT EXISTS idx_analytics_profile ON click_analytics(profile_id);
CREATE INDEX IF NOT EXISTS idx_analytics_link ON click_analytics(link_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_profile ON profile_webhooks(profile_id);
CREATE INDEX IF NOT EXISTS idx_pixels_profile ON marketing_pixels(profile_id);
