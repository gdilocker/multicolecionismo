/**
 * Rate Limiting System
 *
 * Uses a sliding window algorithm to prevent abuse
 * Store in memory for now (can be migrated to Redis/KV later)
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  blockDurationMs?: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
  blockedUntil?: number;
}

// In-memory store (should be Redis/KV in production)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Default configurations
const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  // Authentication endpoints - strict limits
  'POST:/auth/login': {
    maxRequests: 5,
    windowMs: 60 * 1000, // 1 minute
    blockDurationMs: 10 * 60 * 1000 // 10 minutes block after exceeding
  },
  'POST:/auth/register': {
    maxRequests: 3,
    windowMs: 60 * 1000,
    blockDurationMs: 10 * 60 * 1000
  },
  'POST:/auth/reset-password': {
    maxRequests: 3,
    windowMs: 60 * 1000,
    blockDurationMs: 15 * 60 * 1000 // 15 minutes
  },

  // Domain search - moderate limits
  'GET:/domains/search': {
    maxRequests: 20,
    windowMs: 60 * 1000
  },
  'POST:/domains/register': {
    maxRequests: 10,
    windowMs: 60 * 1000
  },

  // API endpoints - generous limits
  'GET:/api/*': {
    maxRequests: 100,
    windowMs: 60 * 1000
  },
  'POST:/api/*': {
    maxRequests: 50,
    windowMs: 60 * 1000
  },

  // Default fallback
  'default': {
    maxRequests: 100,
    windowMs: 60 * 1000
  }
};

/**
 * Generate rate limit key
 */
export function getRateLimitKey(
  route: string,
  method: string,
  ip: string,
  userId?: string
): string {
  const baseKey = `${method}:${route}`;
  return `rl:${baseKey}:${ip}${userId ? `:${userId}` : ''}`;
}

/**
 * Get configuration for a specific route
 */
function getConfig(method: string, route: string): RateLimitConfig {
  const key = `${method}:${route}`;

  // Exact match
  if (RATE_LIMIT_CONFIGS[key]) {
    return RATE_LIMIT_CONFIGS[key];
  }

  // Wildcard match
  for (const [configKey, config] of Object.entries(RATE_LIMIT_CONFIGS)) {
    if (configKey.includes('*')) {
      const pattern = configKey.replace('*', '.*');
      if (new RegExp(pattern).test(key)) {
        return config;
      }
    }
  }

  return RATE_LIMIT_CONFIGS.default;
}

/**
 * Check if request should be rate limited
 * Returns { allowed: boolean, remaining: number, resetAt: number, retryAfter?: number }
 */
export function checkRateLimit(
  method: string,
  route: string,
  ip: string,
  userId?: string
): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
  reason?: string;
} {
  const key = getRateLimitKey(route, method, ip, userId);
  const config = getConfig(method, route);
  const now = Date.now();

  // Get or create entry
  let entry = rateLimitStore.get(key);

  // Check if currently blocked
  if (entry?.blockedUntil && entry.blockedUntil > now) {
    const retryAfter = Math.ceil((entry.blockedUntil - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.blockedUntil,
      retryAfter,
      reason: 'Rate limit exceeded - temporarily blocked'
    };
  }

  // Reset window if expired
  if (!entry || entry.resetAt <= now) {
    entry = {
      count: 0,
      resetAt: now + config.windowMs
    };
    rateLimitStore.set(key, entry);
  }

  // Increment counter
  entry.count++;

  // Check if limit exceeded
  if (entry.count > config.maxRequests) {
    // Block if configured
    if (config.blockDurationMs) {
      entry.blockedUntil = now + config.blockDurationMs;
    }

    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);

    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfter,
      reason: 'Rate limit exceeded'
    };
  }

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt
  };
}

/**
 * Middleware-style rate limiter
 */
export async function rateLimit(
  method: string,
  route: string,
  ip: string,
  userId?: string
): Promise<void> {
  const result = checkRateLimit(method, route, ip, userId);

  if (!result.allowed) {
    // Log to audit if we have the function
    try {
      const { logRateLimitExceeded } = await import('./audit');
      await logRateLimitExceeded(`${method} ${route}`, userId, ip);
    } catch {
      // Audit logging is optional
    }

    // Throw error with retry info
    const error = new Error(result.reason || 'Rate limit exceeded') as any;
    error.statusCode = 429;
    error.retryAfter = result.retryAfter;
    error.resetAt = result.resetAt;
    throw error;
  }
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(
  method: string,
  route: string,
  ip: string,
  userId?: string
): Record<string, string> {
  const result = checkRateLimit(method, route, ip, userId);
  const config = getConfig(method, route);

  return {
    'X-RateLimit-Limit': config.maxRequests.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetAt.toString(),
    ...(result.retryAfter && {
      'Retry-After': result.retryAfter.toString()
    })
  };
}

/**
 * Clear rate limit for a specific key (use carefully)
 */
export function clearRateLimit(
  route: string,
  method: string,
  ip: string,
  userId?: string
): void {
  const key = getRateLimitKey(route, method, ip, userId);
  rateLimitStore.delete(key);
}

/**
 * Clear all rate limits (admin only)
 */
export function clearAllRateLimits(): void {
  rateLimitStore.clear();
}

/**
 * Get current rate limit status
 */
export function getRateLimitStatus(
  route: string,
  method: string,
  ip: string,
  userId?: string
): RateLimitEntry | null {
  const key = getRateLimitKey(route, method, ip, userId);
  return rateLimitStore.get(key) || null;
}

/**
 * Cleanup expired entries (run periodically)
 */
export function cleanupExpiredRateLimits(): number {
  const now = Date.now();
  let cleaned = 0;

  for (const [key, entry] of rateLimitStore.entries()) {
    // Remove if window expired and not blocked
    if (entry.resetAt <= now && (!entry.blockedUntil || entry.blockedUntil <= now)) {
      rateLimitStore.delete(key);
      cleaned++;
    }
  }

  return cleaned;
}

// Auto-cleanup every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    const cleaned = cleanupExpiredRateLimits();
    if (cleaned > 0) {
      console.debug(`[RateLimit] Cleaned ${cleaned} expired entries`);
    }
  }, 5 * 60 * 1000);
}

/**
 * Detect suspicious patterns
 */
export function detectSuspiciousActivity(
  ip: string,
  userId?: string
): {
  suspicious: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  const now = Date.now();

  // Check for rapid-fire requests across different endpoints
  const userKeys = Array.from(rateLimitStore.keys()).filter(key =>
    key.includes(ip) && (userId ? key.includes(userId) : true)
  );

  // Count total requests in last minute
  const recentRequests = userKeys.reduce((sum, key) => {
    const entry = rateLimitStore.get(key);
    if (entry && entry.resetAt > now - 60000) {
      return sum + entry.count;
    }
    return sum;
  }, 0);

  if (recentRequests > 200) {
    reasons.push('Excessive request rate detected');
  }

  // Check for distributed attack pattern (same user, multiple IPs)
  if (userId) {
    const ipsForUser = new Set(
      userKeys
        .filter(key => key.includes(userId))
        .map(key => key.split(':')[2])
    );

    if (ipsForUser.size > 10) {
      reasons.push('Multiple IPs detected for same user');
    }
  }

  // Check for brute force pattern (many failed auth attempts)
  const authKeys = userKeys.filter(key => key.includes('/auth/'));
  const blockedAuth = authKeys.filter(key => {
    const entry = rateLimitStore.get(key);
    return entry?.blockedUntil && entry.blockedUntil > now;
  });

  if (blockedAuth.length >= 3) {
    reasons.push('Multiple authentication blocks detected');
  }

  return {
    suspicious: reasons.length > 0,
    reasons
  };
}

/**
 * Export for monitoring/debugging
 */
export function getRateLimitStats(): {
  totalKeys: number;
  blockedKeys: number;
  activeKeys: number;
} {
  const now = Date.now();
  let blocked = 0;
  let active = 0;

  for (const entry of rateLimitStore.values()) {
    if (entry.blockedUntil && entry.blockedUntil > now) {
      blocked++;
    }
    if (entry.resetAt > now) {
      active++;
    }
  }

  return {
    totalKeys: rateLimitStore.size,
    blockedKeys: blocked,
    activeKeys: active
  };
}
