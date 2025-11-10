/**
 * Cloudflare Turnstile Verification
 * Prevents bot attacks on critical endpoints
 */

export async function verifyTurnstile(ip: string, token?: string): Promise<boolean> {
  if (!token) {
    console.warn('Turnstile token missing');
    return false;
  }

  const secretKey = Deno.env.get('TURNSTILE_SECRET_KEY');
  if (!secretKey) {
    console.error('TURNSTILE_SECRET_KEY not configured');
    return false;
  }

  try {
    const body = new URLSearchParams({
      secret: secretKey,
      response: token,
      remoteip: ip || ''
    });

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: body.toString(),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const data = await response.json();

    if (!data.success) {
      console.warn('Turnstile verification failed:', data['error-codes']);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Turnstile verification error:', error);
    return false;
  }
}

/**
 * Extract IP from request
 */
export function getClientIP(req: Request): string {
  return req.headers.get('cf-connecting-ip') ||
         req.headers.get('x-forwarded-for')?.split(',')[0] ||
         req.headers.get('x-real-ip') ||
         'unknown';
}
