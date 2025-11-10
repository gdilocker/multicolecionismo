/**
 * Webhook Security Utilities
 *
 * HMAC signature verification for webhook integrity
 * Prevents webhook spoofing and replay attacks
 */

/**
 * Verify webhook HMAC signature
 *
 * @param payload - Raw request body (string or Uint8Array)
 * @param signature - Signature from request header
 * @param secret - Webhook secret key
 * @param algorithm - HMAC algorithm (default: SHA-256)
 * @returns true if signature is valid
 */
export async function verifyWebhookSignature(
  payload: string | Uint8Array,
  signature: string,
  secret: string,
  algorithm: 'SHA-256' | 'SHA-512' = 'SHA-256'
): Promise<boolean> {
  try {
    // Convert payload to Uint8Array if string
    const payloadBytes = typeof payload === 'string'
      ? new TextEncoder().encode(payload)
      : payload;

    // Convert secret to key
    const secretBytes = new TextEncoder().encode(secret);
    const key = await crypto.subtle.importKey(
      'raw',
      secretBytes,
      { name: 'HMAC', hash: algorithm },
      false,
      ['sign']
    );

    // Generate HMAC
    const signatureBytes = await crypto.subtle.sign('HMAC', key, payloadBytes);

    // Convert to hex string
    const computedSignature = Array.from(new Uint8Array(signatureBytes))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Remove any prefix from signature (e.g., "sha256=")
    const cleanSignature = signature.includes('=')
      ? signature.split('=')[1]
      : signature;

    // Timing-safe comparison
    return timingSafeEqual(computedSignature, cleanSignature);
  } catch (error) {
    console.error('[Webhook Security] Signature verification error:', error);
    return false;
  }
}

/**
 * Timing-safe string comparison
 * Prevents timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Verify PayPal webhook signature
 * PayPal uses specific headers and format
 */
export async function verifyPayPalWebhook(
  req: Request,
  secret: string
): Promise<boolean> {
  try {
    const signature = req.headers.get('paypal-transmission-sig');
    const transmissionId = req.headers.get('paypal-transmission-id');
    const transmissionTime = req.headers.get('paypal-transmission-time');
    const certUrl = req.headers.get('paypal-cert-url');
    const authAlgo = req.headers.get('paypal-auth-algo');

    if (!signature || !transmissionId || !transmissionTime) {
      console.error('[PayPal Webhook] Missing required headers');
      return false;
    }

    // Get raw body
    const body = await req.text();

    // PayPal signature format: transmissionId|transmissionTime|webhookId|crc32(body)
    // For simplicity, we'll verify using basic HMAC
    // In production, use PayPal's official SDK

    return await verifyWebhookSignature(body, signature, secret);
  } catch (error) {
    console.error('[PayPal Webhook] Verification error:', error);
    return false;
  }
}

/**
 * Verify custom webhook with configurable headers
 */
export async function verifyCustomWebhook(
  req: Request,
  secret: string,
  options: {
    signatureHeader?: string;
    timestampHeader?: string;
    maxAge?: number; // seconds
  } = {}
): Promise<{ valid: boolean; reason?: string }> {
  const {
    signatureHeader = 'x-signature',
    timestampHeader = 'x-timestamp',
    maxAge = 300 // 5 minutes
  } = options;

  try {
    const signature = req.headers.get(signatureHeader);
    const timestamp = req.headers.get(timestampHeader);

    if (!signature) {
      return { valid: false, reason: 'Missing signature header' };
    }

    // Check timestamp if provided
    if (timestamp) {
      const requestTime = parseInt(timestamp, 10);
      const now = Math.floor(Date.now() / 1000);

      if (Math.abs(now - requestTime) > maxAge) {
        return { valid: false, reason: 'Request too old (replay attack?)' };
      }
    }

    // Get raw body
    const body = await req.text();

    // Verify signature
    const valid = await verifyWebhookSignature(body, signature, secret);

    return {
      valid,
      reason: valid ? undefined : 'Invalid signature'
    };
  } catch (error) {
    console.error('[Custom Webhook] Verification error:', error);
    return { valid: false, reason: 'Verification error' };
  }
}

/**
 * Generate HMAC signature for outgoing webhooks
 */
export async function generateWebhookSignature(
  payload: string | Uint8Array,
  secret: string,
  algorithm: 'SHA-256' | 'SHA-512' = 'SHA-256'
): Promise<string> {
  const payloadBytes = typeof payload === 'string'
    ? new TextEncoder().encode(payload)
    : payload;

  const secretBytes = new TextEncoder().encode(secret);
  const key = await crypto.subtle.importKey(
    'raw',
    secretBytes,
    { name: 'HMAC', hash: algorithm },
    false,
    ['sign']
  );

  const signatureBytes = await crypto.subtle.sign('HMAC', key, payloadBytes);

  return Array.from(new Uint8Array(signatureBytes))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Middleware for webhook verification
 */
export async function webhookSecurityMiddleware(
  req: Request,
  secret: string,
  provider: 'paypal' | 'custom' = 'custom'
): Promise<Response | null> {
  let isValid = false;
  let reason = '';

  if (provider === 'paypal') {
    isValid = await verifyPayPalWebhook(req, secret);
    reason = 'Invalid PayPal signature';
  } else {
    const result = await verifyCustomWebhook(req, secret);
    isValid = result.valid;
    reason = result.reason || 'Invalid signature';
  }

  if (!isValid) {
    // Log security event
    console.error(`[Webhook Security] Signature verification failed: ${reason}`);

    // Try to log to audit (fire and forget)
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

      if (supabaseUrl && supabaseKey) {
        fetch(`${supabaseUrl}/rest/v1/audit_logs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({
            action: 'unauthorized_access_attempt',
            severity: 'high',
            details: {
              type: 'webhook_signature_fail',
              provider,
              reason,
              ip: req.headers.get('x-forwarded-for') || 'unknown'
            },
            success: false
          })
        }).catch(() => {});
      }
    } catch {}

    return new Response(
      JSON.stringify({
        error: 'Unauthorized',
        message: 'Invalid webhook signature'
      }),
      {
        status: 401,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }

  return null; // Signature valid, continue
}
