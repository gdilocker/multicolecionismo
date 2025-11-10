/**
 * Advanced Rate Limiting Middleware
 *
 * Integrates with database-based rate limiting system
 *
 * Usage:
 * ```typescript
 * import { checkRateLimit } from '../_shared/rateLimit.advanced.ts';
 *
 * const result = await checkRateLimit(req, supabaseClient, '/functions/v1/domains');
 * if (!result.allowed) {
 *   return new Response(JSON.stringify({ error: result.reason }), {
 *     status: 429,
 *     headers: {
 *       'Retry-After': result.retry_after?.toString() || '3600',
 *       'X-RateLimit-Limit': result.limit?.toString() || '0',
 *       'X-RateLimit-Remaining': '0',
 *     }
 *   });
 * }
 * ```
 */

import { createClient, SupabaseClient } from 'npm:@supabase/supabase-js@2';

export interface RateLimitResult {
  allowed: boolean;
  reason?: string;
  limit?: number;
  remaining?: number;
  window_seconds?: number;
  retry_after?: number;
  reset_at?: string;
  current_hits?: number;
}

/**
 * Extract IP address from request
 */
function getClientIP(req: Request): string {
  // Try various headers (Netlify, Cloudflare, etc.)
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIP = req.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  const cfConnectingIP = req.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Fallback
  return '0.0.0.0';
}

/**
 * Check rate limit for current request
 */
export async function checkRateLimit(
  req: Request,
  supabase: SupabaseClient,
  endpoint: string
): Promise<RateLimitResult> {
  try {
    // Get user ID if authenticated
    const authHeader = req.headers.get('authorization');
    let userId: string | null = null;

    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(
        authHeader.replace('Bearer ', '')
      );
      userId = user?.id || null;
    }

    // Get client IP
    const ipAddress = getClientIP(req);

    // Get user agent
    const userAgent = req.headers.get('user-agent') || 'Unknown';

    // Call rate limit check function
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_user_id: userId,
      p_ip_address: ipAddress,
      p_endpoint: endpoint,
      p_user_agent: userAgent
    });

    if (error) {
      console.error('[RateLimit] Database error:', error);
      // On error, allow request but log
      return {
        allowed: true,
        reason: 'error_fallback'
      };
    }

    return data as RateLimitResult;
  } catch (err) {
    console.error('[RateLimit] Unexpected error:', err);
    // On error, allow request
    return {
      allowed: true,
      reason: 'error_fallback'
    };
  }
}

/**
 * Create rate limit response with proper headers
 */
export function createRateLimitResponse(
  result: RateLimitResult,
  corsHeaders: Record<string, string> = {}
): Response {
  const headers = {
    ...corsHeaders,
    'Content-Type': 'application/json',
    'X-RateLimit-Limit': result.limit?.toString() || '0',
    'X-RateLimit-Remaining': result.remaining?.toString() || '0',
    'Retry-After': result.retry_after?.toString() || '3600',
  };

  if (result.reset_at) {
    headers['X-RateLimit-Reset'] = new Date(result.reset_at).getTime().toString();
  }

  const message = result.reason === 'ip_blacklisted'
    ? 'Your IP address has been blocked due to suspicious activity'
    : result.reason === 'rate_limit_exceeded'
    ? 'Too many requests. Please try again later.'
    : 'Request denied';

  return new Response(
    JSON.stringify({
      error: message,
      code: 'RATE_LIMIT_EXCEEDED',
      retry_after: result.retry_after,
      limit: result.limit,
      window_seconds: result.window_seconds
    }),
    {
      status: 429,
      headers
    }
  );
}

/**
 * Middleware wrapper for rate limiting
 */
export async function withRateLimit(
  req: Request,
  supabase: SupabaseClient,
  endpoint: string,
  handler: () => Promise<Response>,
  corsHeaders: Record<string, string> = {}
): Promise<Response> {
  // Check rate limit
  const result = await checkRateLimit(req, supabase, endpoint);

  // If not allowed, return rate limit response
  if (!result.allowed) {
    return createRateLimitResponse(result, corsHeaders);
  }

  // Add rate limit headers to response
  const response = await handler();

  // Clone response to add headers
  const headers = new Headers(response.headers);
  headers.set('X-RateLimit-Limit', result.limit?.toString() || '0');
  headers.set('X-RateLimit-Remaining', result.remaining?.toString() || '0');

  if (result.reset_at) {
    headers.set('X-RateLimit-Reset', new Date(result.reset_at).getTime().toString());
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
