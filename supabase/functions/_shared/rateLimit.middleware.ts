/**
 * Rate Limiting Middleware for Supabase Edge Functions
 *
 * Usage:
 * import { rateLimitMiddleware } from '../_shared/rateLimit.middleware.ts';
 *
 * Deno.serve(async (req) => {
 *   const rateLimitResponse = await rateLimitMiddleware(req, 'POST:/api/your-endpoint');
 *   if (rateLimitResponse) return rateLimitResponse;
 *   // ... your function logic
 * });
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

// In-memory store (in production, use Redis/Upstash)
const rateLimitStore = new Map<string, RateLimitEntry>();

const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  'POST:/auth/login': { maxRequests: 5, windowMs: 60000, blockDurationMs: 600000 },
  'POST:/auth/register': { maxRequests: 3, windowMs: 60000, blockDurationMs: 600000 },
  'POST:/auth/reset-password': { maxRequests: 3, windowMs: 60000, blockDurationMs: 900000 },
  'POST:/paypal-create-order': { maxRequests: 10, windowMs: 60000 },
  'POST:/paypal-capture': { maxRequests: 10, windowMs: 60000 },
  'GET:/domains': { maxRequests: 20, windowMs: 60000 },
  'POST:/domains': { maxRequests: 10, windowMs: 60000 },
  'default': { maxRequests: 100, windowMs: 60000 }
};

function getConfig(route: string): RateLimitConfig {
  return RATE_LIMIT_CONFIGS[route] || RATE_LIMIT_CONFIGS.default;
}

function getRateLimitKey(route: string, ip: string, userId?: string): string {
  return `rl:${route}:${ip}${userId ? `:${userId}` : ''}`;
}

function getClientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
         req.headers.get('x-real-ip') ||
         req.headers.get('cf-connecting-ip') ||
         'unknown';
}

async function getUserIdFromRequest(req: Request): Promise<string | undefined> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return undefined;

  try {
    const token = authHeader.substring(7);
    // Decode JWT payload (simple base64 decode, no verification needed for rate limiting)
    const [, payloadB64] = token.split('.');
    const payload = JSON.parse(atob(payloadB64));
    return payload.sub;
  } catch {
    return undefined;
  }
}

function checkRateLimit(
  route: string,
  ip: string,
  userId?: string
): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
} {
  const key = getRateLimitKey(route, ip, userId);
  const config = getConfig(route);
  const now = Date.now();

  let entry = rateLimitStore.get(key);

  // Check if blocked
  if (entry?.blockedUntil && entry.blockedUntil > now) {
    const retryAfter = Math.ceil((entry.blockedUntil - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.blockedUntil,
      retryAfter
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

  // Increment
  entry.count++;

  // Check limit
  if (entry.count > config.maxRequests) {
    if (config.blockDurationMs) {
      entry.blockedUntil = now + config.blockDurationMs;
    }

    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfter
    };
  }

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt
  };
}

function getRateLimitHeaders(
  config: RateLimitConfig,
  result: { remaining: number; resetAt: number; retryAfter?: number }
): Record<string, string> {
  return {
    'X-RateLimit-Limit': config.maxRequests.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetAt.toString(),
    ...(result.retryAfter && {
      'Retry-After': result.retryAfter.toString()
    })
  };
}

export async function rateLimitMiddleware(
  req: Request,
  route: string
): Promise<Response | null> {
  const ip = getClientIp(req);
  const userId = await getUserIdFromRequest(req);

  const result = checkRateLimit(route, ip, userId);
  const config = getConfig(route);

  if (!result.allowed) {
    // Log to audit (optional, fire and forget)
    logRateLimitExceeded(route, ip, userId).catch(() => {});

    return new Response(
      JSON.stringify({
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.',
        retryAfter: result.retryAfter
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          ...getRateLimitHeaders(config, result)
        }
      }
    );
  }

  // Return null to allow request, but include headers in actual response
  return null;
}

export function getRateLimitHeadersForResponse(
  route: string,
  ip: string,
  userId?: string
): Record<string, string> {
  const key = getRateLimitKey(route, ip, userId);
  const config = getConfig(route);
  const entry = rateLimitStore.get(key);

  if (!entry) {
    return {
      'X-RateLimit-Limit': config.maxRequests.toString(),
      'X-RateLimit-Remaining': config.maxRequests.toString(),
      'X-RateLimit-Reset': (Date.now() + config.windowMs).toString()
    };
  }

  const remaining = Math.max(0, config.maxRequests - entry.count);
  return {
    'X-RateLimit-Limit': config.maxRequests.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': entry.resetAt.toString()
  };
}

async function logRateLimitExceeded(
  route: string,
  ip: string,
  userId?: string
): Promise<void> {
  try {
    // Use Supabase client to log
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    await fetch(`${supabaseUrl}/rest/v1/audit_logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({
        user_id: userId,
        action: 'rate_limit_exceeded',
        severity: 'medium',
        details: { route, ip },
        ip_address: ip,
        success: false
      })
    });
  } catch (error) {
    console.error('Failed to log rate limit:', error);
  }
}

// Cleanup expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt <= now && (!entry.blockedUntil || entry.blockedUntil <= now)) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);
