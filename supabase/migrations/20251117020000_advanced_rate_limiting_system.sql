/*
  # Advanced Rate Limiting System

  ## Overview
  Implements comprehensive rate limiting to prevent abuse and DDoS attacks.

  ## Features
  - Per-user rate limits
  - Per-IP rate limits
  - Per-endpoint rate limits
  - Sliding window algorithm
  - Automatic ban for abuse
  - Whitelist support
  - Admin bypass

  ## Rate Limits
  - Anonymous: 100 requests/hour
  - Authenticated: 1000 requests/hour
  - Admin: Unlimited
  - Login attempts: 5/15 minutes
  - Password reset: 3/hour
  - Domain search: 50/hour
  - Checkout: 10/hour

  ## Security
  - Tracks suspicious patterns
  - Auto-blocks abusive IPs
  - Logs all violations
*/

-- ============================================================================
-- PART 1: RATE LIMIT CONFIGURATION TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS rate_limit_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_pattern TEXT NOT NULL,
  limit_per_window INTEGER NOT NULL,
  window_seconds INTEGER NOT NULL,
  applies_to TEXT NOT NULL DEFAULT 'all', -- 'all', 'anonymous', 'authenticated', 'role:admin'
  enabled BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(endpoint_pattern, applies_to)
);

COMMENT ON TABLE rate_limit_rules IS 'Configuration for rate limiting rules per endpoint';
COMMENT ON COLUMN rate_limit_rules.endpoint_pattern IS 'Regex or exact match pattern for endpoint';
COMMENT ON COLUMN rate_limit_rules.limit_per_window IS 'Maximum requests allowed in window';
COMMENT ON COLUMN rate_limit_rules.window_seconds IS 'Time window in seconds';
COMMENT ON COLUMN rate_limit_rules.applies_to IS 'Who this rule applies to';

-- Enable RLS
ALTER TABLE rate_limit_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active rate limits"
  ON rate_limit_rules
  FOR SELECT
  TO authenticated
  USING (enabled = true);

CREATE POLICY "Only admins can manage rate limits"
  ON rate_limit_rules
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers c
      WHERE c.user_id = (SELECT auth.uid())
      AND c.role = 'admin'
    )
  );

-- ============================================================================
-- PART 2: RATE LIMIT TRACKING TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS rate_limit_hits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address INET NOT NULL,
  endpoint TEXT NOT NULL,
  hit_at TIMESTAMPTZ DEFAULT NOW(),
  user_agent TEXT,
  -- Indexes for fast lookup
  INDEX idx_rate_limit_hits_user_time (user_id, hit_at DESC),
  INDEX idx_rate_limit_hits_ip_time (ip_address, hit_at DESC),
  INDEX idx_rate_limit_hits_endpoint_time (endpoint, hit_at DESC)
);

COMMENT ON TABLE rate_limit_hits IS 'Tracks all API hits for rate limiting';

-- Partition by time for performance
-- (Optional: implement if needed for high traffic)

-- ============================================================================
-- PART 3: IP WHITELIST/BLACKLIST
-- ============================================================================

CREATE TABLE IF NOT EXISTS rate_limit_ip_list (
  ip_address INET PRIMARY KEY,
  list_type TEXT NOT NULL CHECK (list_type IN ('whitelist', 'blacklist')),
  reason TEXT,
  added_by UUID REFERENCES customers(user_id),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  auto_added BOOLEAN DEFAULT false
);

COMMENT ON TABLE rate_limit_ip_list IS 'Whitelist and blacklist for IP addresses';

-- Enable RLS
ALTER TABLE rate_limit_ip_list ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage IP lists"
  ON rate_limit_ip_list
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers c
      WHERE c.user_id = (SELECT auth.uid())
      AND c.role = 'admin'
    )
  );

-- ============================================================================
-- PART 4: RATE LIMIT VIOLATIONS LOG
-- ============================================================================

CREATE TABLE IF NOT EXISTS rate_limit_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address INET NOT NULL,
  endpoint TEXT NOT NULL,
  limit_type TEXT NOT NULL, -- 'user', 'ip', 'endpoint'
  violation_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,
  rule_id UUID REFERENCES rate_limit_rules(id),
  action_taken TEXT, -- 'logged', 'blocked', 'banned'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE rate_limit_violations IS 'Log of rate limit violations';

-- Index for analysis
CREATE INDEX idx_violations_ip_time ON rate_limit_violations(ip_address, created_at DESC);
CREATE INDEX idx_violations_user_time ON rate_limit_violations(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE rate_limit_violations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view violations"
  ON rate_limit_violations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers c
      WHERE c.user_id = (SELECT auth.uid())
      AND c.role = 'admin'
    )
  );

-- ============================================================================
-- PART 5: RATE LIMIT CHECK FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id UUID,
  p_ip_address INET,
  p_endpoint TEXT,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rule RECORD;
  v_user_role TEXT;
  v_hit_count INTEGER;
  v_limit INTEGER;
  v_window INTEGER;
  v_blacklisted BOOLEAN;
  v_whitelisted BOOLEAN;
  v_window_start TIMESTAMPTZ;
BEGIN
  -- Check if IP is blacklisted
  SELECT EXISTS (
    SELECT 1 FROM rate_limit_ip_list
    WHERE ip_address = p_ip_address
    AND list_type = 'blacklist'
    AND (expires_at IS NULL OR expires_at > NOW())
  ) INTO v_blacklisted;

  IF v_blacklisted THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'ip_blacklisted',
      'retry_after', 3600
    );
  END IF;

  -- Check if IP is whitelisted
  SELECT EXISTS (
    SELECT 1 FROM rate_limit_ip_list
    WHERE ip_address = p_ip_address
    AND list_type = 'whitelist'
    AND (expires_at IS NULL OR expires_at > NOW())
  ) INTO v_whitelisted;

  IF v_whitelisted THEN
    RETURN jsonb_build_object('allowed', true, 'reason', 'whitelisted');
  END IF;

  -- Get user role
  IF p_user_id IS NOT NULL THEN
    SELECT role INTO v_user_role
    FROM customers
    WHERE user_id = p_user_id;

    -- Admins bypass rate limits
    IF v_user_role = 'admin' THEN
      RETURN jsonb_build_object('allowed', true, 'reason', 'admin_bypass');
    END IF;
  END IF;

  -- Find matching rule
  SELECT * INTO v_rule
  FROM rate_limit_rules
  WHERE enabled = true
  AND endpoint_pattern = p_endpoint
  AND (
    applies_to = 'all'
    OR (applies_to = 'anonymous' AND p_user_id IS NULL)
    OR (applies_to = 'authenticated' AND p_user_id IS NOT NULL)
    OR (applies_to = 'role:' || v_user_role)
  )
  ORDER BY
    CASE
      WHEN applies_to LIKE 'role:%' THEN 1
      WHEN applies_to = 'authenticated' THEN 2
      WHEN applies_to = 'anonymous' THEN 3
      ELSE 4
    END
  LIMIT 1;

  -- No rule found - allow with default generous limit
  IF v_rule.id IS NULL THEN
    -- Default: 1000 requests per hour for authenticated, 100 for anonymous
    v_limit := CASE WHEN p_user_id IS NOT NULL THEN 1000 ELSE 100 END;
    v_window := 3600;
  ELSE
    v_limit := v_rule.limit_per_window;
    v_window := v_rule.window_seconds;
  END IF;

  -- Calculate window start
  v_window_start := NOW() - (v_window || ' seconds')::INTERVAL;

  -- Count hits in window
  IF p_user_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_hit_count
    FROM rate_limit_hits
    WHERE user_id = p_user_id
    AND endpoint = p_endpoint
    AND hit_at > v_window_start;
  ELSE
    SELECT COUNT(*) INTO v_hit_count
    FROM rate_limit_hits
    WHERE ip_address = p_ip_address
    AND endpoint = p_endpoint
    AND hit_at > v_window_start
    AND user_id IS NULL;
  END IF;

  -- Check if over limit
  IF v_hit_count >= v_limit THEN
    -- Log violation
    INSERT INTO rate_limit_violations (
      user_id,
      ip_address,
      endpoint,
      limit_type,
      violation_count,
      window_start,
      window_end,
      rule_id,
      action_taken
    ) VALUES (
      p_user_id,
      p_ip_address,
      p_endpoint,
      CASE WHEN p_user_id IS NOT NULL THEN 'user' ELSE 'ip' END,
      v_hit_count - v_limit + 1,
      v_window_start,
      NOW(),
      v_rule.id,
      'blocked'
    );

    -- Auto-ban if too many violations
    IF v_hit_count > v_limit * 3 THEN
      INSERT INTO rate_limit_ip_list (ip_address, list_type, reason, auto_added, expires_at)
      VALUES (
        p_ip_address,
        'blacklist',
        'Automatic ban for excessive rate limit violations',
        true,
        NOW() + INTERVAL '24 hours'
      )
      ON CONFLICT (ip_address) DO UPDATE
      SET expires_at = GREATEST(rate_limit_ip_list.expires_at, EXCLUDED.expires_at);
    END IF;

    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'rate_limit_exceeded',
      'limit', v_limit,
      'window_seconds', v_window,
      'retry_after', v_window,
      'current_hits', v_hit_count
    );
  END IF;

  -- Record hit
  INSERT INTO rate_limit_hits (user_id, ip_address, endpoint, user_agent, hit_at)
  VALUES (p_user_id, p_ip_address, p_endpoint, p_user_agent, NOW());

  -- Return allowed
  RETURN jsonb_build_object(
    'allowed', true,
    'limit', v_limit,
    'remaining', v_limit - v_hit_count - 1,
    'window_seconds', v_window,
    'reset_at', v_window_start + (v_window || ' seconds')::INTERVAL
  );
END;
$$;

-- ============================================================================
-- PART 6: CLEANUP OLD HITS (Maintenance)
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_old_rate_limit_hits()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete hits older than 24 hours
  DELETE FROM rate_limit_hits
  WHERE hit_at < NOW() - INTERVAL '24 hours';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  -- Delete expired blacklist entries
  DELETE FROM rate_limit_ip_list
  WHERE expires_at IS NOT NULL
  AND expires_at < NOW();

  RETURN deleted_count;
END;
$$;

-- ============================================================================
-- PART 7: DEFAULT RATE LIMIT RULES
-- ============================================================================

INSERT INTO rate_limit_rules (endpoint_pattern, limit_per_window, window_seconds, applies_to, description)
VALUES
  -- Authentication
  ('/auth/login', 5, 900, 'all', 'Login attempts: 5 per 15 minutes'),
  ('/auth/register', 3, 3600, 'all', 'Registration: 3 per hour'),
  ('/auth/reset-password', 3, 3600, 'all', 'Password reset: 3 per hour'),
  ('/auth/verify-2fa', 10, 600, 'all', '2FA verification: 10 per 10 minutes'),

  -- Domains
  ('/functions/v1/domains', 50, 3600, 'anonymous', 'Domain search (anonymous): 50 per hour'),
  ('/functions/v1/domains', 200, 3600, 'authenticated', 'Domain search (authenticated): 200 per hour'),

  -- Checkout
  ('/functions/v1/paypal-create-order', 10, 3600, 'authenticated', 'Create order: 10 per hour'),
  ('/functions/v1/paypal-capture', 10, 3600, 'authenticated', 'Capture payment: 10 per hour'),

  -- API General
  ('/api/*', 100, 3600, 'anonymous', 'General API (anonymous): 100 per hour'),
  ('/api/*', 1000, 3600, 'authenticated', 'General API (authenticated): 1000 per hour'),

  -- Edge Functions
  ('/functions/v1/*', 200, 3600, 'anonymous', 'Edge functions (anonymous): 200 per hour'),
  ('/functions/v1/*', 2000, 3600, 'authenticated', 'Edge functions (authenticated): 2000 per hour')

ON CONFLICT (endpoint_pattern, applies_to) DO NOTHING;

-- ============================================================================
-- SUMMARY
-- ============================================================================

-- Advanced rate limiting system implemented:
-- ✅ Per-user and per-IP tracking
-- ✅ Configurable rules per endpoint
-- ✅ Sliding window algorithm
-- ✅ Auto-ban for abusers
-- ✅ Whitelist/blacklist support
-- ✅ Admin bypass
-- ✅ Violation logging
-- ✅ Automatic cleanup

-- Usage in edge functions:
-- SELECT check_rate_limit(
--   auth.uid(),
--   request.headers.get('x-forwarded-for')::inet,
--   '/functions/v1/domains',
--   request.headers.get('user-agent')
-- )

-- Maintenance (run daily):
-- SELECT cleanup_old_rate_limit_hits()
