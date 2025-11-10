/*
  # Content Limits Enforcement System
*/

CREATE TABLE IF NOT EXISTS plan_limits (
  plan_type text PRIMARY KEY,
  max_links int NOT NULL DEFAULT 5,
  max_products int NOT NULL DEFAULT 3,
  max_images int NOT NULL DEFAULT 10,
  max_videos int NOT NULL DEFAULT 0,
  can_use_custom_css boolean NOT NULL DEFAULT false,
  can_use_custom_domain boolean NOT NULL DEFAULT false,
  updated_at timestamptz DEFAULT now()
);

INSERT INTO plan_limits (plan_type, max_links, max_products, max_images, max_videos, can_use_custom_css, can_use_custom_domain) VALUES
  ('starter', 5, 3, 10, 0, false, false),
  ('prime', 10, 10, 50, 2, false, true),
  ('elite', 999999, 999999, 999999, 999999, true, true),
  ('supreme', 999999, 999999, 999999, 999999, true, true)
ON CONFLICT (plan_type) DO UPDATE SET
  max_links = EXCLUDED.max_links,
  max_products = EXCLUDED.max_products,
  max_images = EXCLUDED.max_images,
  max_videos = EXCLUDED.max_videos,
  can_use_custom_css = EXCLUDED.can_use_custom_css,
  can_use_custom_domain = EXCLUDED.can_use_custom_domain,
  updated_at = now();

CREATE OR REPLACE FUNCTION check_user_plan_limit(
  p_user_id uuid,
  p_content_type text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_plan_type text;
  v_current_count int;
  v_limit int;
BEGIN
  SELECT sp.plan_type INTO v_plan_type
  FROM subscriptions s
  JOIN subscription_plans sp ON sp.id = s.plan_id
  WHERE s.user_id = p_user_id
    AND s.status = 'active'
  ORDER BY s.created_at DESC
  LIMIT 1;

  v_plan_type := COALESCE(v_plan_type, 'starter');

  EXECUTE format('SELECT max_%s FROM plan_limits WHERE plan_type = $1', p_content_type)
  INTO v_limit
  USING v_plan_type;

  CASE p_content_type
    WHEN 'links' THEN
      SELECT COUNT(*) INTO v_current_count
      FROM profile_links
      WHERE user_id = p_user_id AND deleted_at IS NULL;

    WHEN 'products' THEN
      SELECT COUNT(*) INTO v_current_count
      FROM store_products
      WHERE user_id = p_user_id AND deleted_at IS NULL;

    ELSE
      RETURN true;
  END CASE;

  RETURN v_current_count < v_limit;
END;
$$;

CREATE OR REPLACE FUNCTION enforce_content_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_content_type text;
  v_can_create boolean;
BEGIN
  v_content_type := CASE TG_TABLE_NAME
    WHEN 'profile_links' THEN 'links'
    WHEN 'store_products' THEN 'products'
    ELSE 'unknown'
  END;

  IF v_content_type = 'unknown' THEN
    RETURN NEW;
  END IF;

  v_can_create := check_user_plan_limit(NEW.user_id, v_content_type);

  IF NOT v_can_create THEN
    RAISE EXCEPTION 'Content limit exceeded for %. Upgrade your plan to add more.', v_content_type
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_link_limit ON profile_links;
CREATE TRIGGER enforce_link_limit
  BEFORE INSERT ON profile_links
  FOR EACH ROW
  EXECUTE FUNCTION enforce_content_limit();

DROP TRIGGER IF EXISTS enforce_product_limit ON store_products;
CREATE TRIGGER enforce_product_limit
  BEFORE INSERT ON store_products
  FOR EACH ROW
  EXECUTE FUNCTION enforce_content_limit();

ALTER TABLE plan_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view plan limits"
  ON plan_limits FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can modify plan limits"
  ON plan_limits FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM customers WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM customers WHERE user_id = auth.uid() AND role = 'admin'));
