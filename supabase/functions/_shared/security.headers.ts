/**
 * Security Headers Middleware
 * Implements CSP with nonces, HSTS, and other security headers
 */

/**
 * Generate cryptographic nonce for CSP
 */
export function generateNonce(length: number = 16): string {
  const buffer = new Uint8Array(length);
  crypto.getRandomValues(buffer);
  return btoa(String.fromCharCode(...buffer))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Build Content Security Policy with nonce
 */
export function buildCSP(nonce: string, reportOnly: boolean = false): string {
  const policy = [
    `default-src 'self'`,
    `base-uri 'self'`,
    `frame-ancestors 'none'`,
    `script-src 'self' 'nonce-${nonce}' https://challenges.cloudflare.com`,
    `style-src 'self' 'nonce-${nonce}' 'unsafe-inline'`, // unsafe-inline for Tailwind
    `img-src 'self' data: https: blob:`,
    `font-src 'self' data: https:`,
    `connect-src 'self' https:`,
    `object-src 'none'`,
    `media-src 'self'`,
    `frame-src https://challenges.cloudflare.com`,
    `worker-src 'self' blob:`,
    `form-action 'self'`,
    `upgrade-insecure-requests`,
    `block-all-mixed-content`,
    `report-uri /api/csp-report`
  ].join('; ');

  return policy;
}

/**
 * Apply comprehensive security headers to response
 */
export function applySecurityHeaders(headers: Headers, nonce?: string, reportOnly: boolean = false): void {
  // CSP
  if (nonce) {
    const cspHeader = reportOnly ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy';
    headers.set(cspHeader, buildCSP(nonce, reportOnly));
  }

  // HSTS - Force HTTPS for 2 years, include subdomains, preload
  headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');

  // Referrer Policy - Protect user privacy
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy - Disable dangerous features
  headers.set('Permissions-Policy',
    'geolocation=(), camera=(), microphone=(), payment=(), usb=(), magnetometer=(), gyroscope=()');

  // Prevent MIME sniffing
  headers.set('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking
  headers.set('X-Frame-Options', 'DENY');

  // XSS Protection (legacy but still useful)
  headers.set('X-XSS-Protection', '1; mode=block');

  // Remove server fingerprinting
  headers.delete('Server');
  headers.delete('X-Powered-By');
}

/**
 * Middleware for Edge Functions
 */
export function securityHeadersMiddleware(handler: (req: Request) => Promise<Response>) {
  return async (req: Request): Promise<Response> => {
    const nonce = generateNonce();

    // Store nonce for use in response
    // @ts-ignore
    req.nonce = nonce;

    const response = await handler(req);

    // Apply security headers to all responses
    applySecurityHeaders(response.headers, nonce, false);

    return response;
  };
}

/**
 * Create JSON response with security headers
 */
export function secureJsonResponse(
  data: any,
  status: number = 200,
  nonce?: string
): Response {
  const headers = new Headers({
    'Content-Type': 'application/json'
  });

  applySecurityHeaders(headers, nonce);

  return new Response(JSON.stringify(data), { status, headers });
}
