/**
 * CORS Middleware for Supabase Edge Functions
 *
 * Restricts API access to official domains only
 * Implements secure CORS with credentials support
 */

// Official allowed origins - ONLY these domains can access the API
const ALLOWED_ORIGINS = new Set([
  'https://com.rich',
  'https://www.com.rich',
  'https://app.com.rich',
  'http://localhost:5173', // Development
  'http://localhost:4173', // Vite preview
  'http://127.0.0.1:5173',
  'http://127.0.0.1:4173'
]);

interface CORSConfig {
  allowCredentials?: boolean;
  allowedMethods?: string[];
  allowedHeaders?: string[];
  maxAge?: number;
}

const DEFAULT_CONFIG: CORSConfig = {
  allowCredentials: true,
  allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Client-Info', 'Apikey'],
  maxAge: 300 // 5 minutes
};

/**
 * Check if origin is allowed
 */
function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;

  // Check exact match
  if (ALLOWED_ORIGINS.has(origin)) {
    return true;
  }

  // Allow localhost with any port (always, for development)
  try {
    const url = new URL(origin);
    if (
      (url.hostname === 'localhost' || url.hostname === '127.0.0.1') &&
      (url.protocol === 'http:' || url.protocol === 'https:')
    ) {
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

/**
 * Get CORS headers for response
 */
export function getCORSHeaders(
  origin: string | null,
  config: CORSConfig = DEFAULT_CONFIG
): Record<string, string> {
  const headers: Record<string, string> = {};

  // Only add CORS headers if origin is allowed
  if (isOriginAllowed(origin)) {
    headers['Access-Control-Allow-Origin'] = origin!;
    headers['Vary'] = 'Origin';

    if (config.allowCredentials) {
      headers['Access-Control-Allow-Credentials'] = 'true';
    }

    if (config.allowedMethods) {
      headers['Access-Control-Allow-Methods'] = config.allowedMethods.join(', ');
    }

    if (config.allowedHeaders) {
      headers['Access-Control-Allow-Headers'] = config.allowedHeaders.join(', ');
    }

    if (config.maxAge) {
      headers['Access-Control-Max-Age'] = config.maxAge.toString();
    }
  }

  return headers;
}

/**
 * Handle CORS preflight (OPTIONS) request
 */
export function handleCORSPreflight(
  req: Request,
  config: CORSConfig = DEFAULT_CONFIG
): Response | null {
  const origin = req.headers.get('origin');

  // Not a preflight request
  if (req.method !== 'OPTIONS') {
    return null;
  }

  // Origin not allowed - return 403
  if (!isOriginAllowed(origin)) {
    return new Response('Forbidden - Origin not allowed', {
      status: 403,
      headers: {
        'Content-Type': 'text/plain'
      }
    });
  }

  // Return successful preflight response
  return new Response(null, {
    status: 204,
    headers: getCORSHeaders(origin, config)
  });
}

/**
 * Validate origin and return error if not allowed
 */
export function validateOrigin(req: Request): Response | null {
  const origin = req.headers.get('origin');

  // No origin header (direct API call, curl, etc) - allow but without CORS
  if (!origin) {
    return null;
  }

  // Origin not in allowed list
  if (!isOriginAllowed(origin)) {
    // Log suspicious activity
    console.warn(`[CORS] Blocked request from unauthorized origin: ${origin}`);

    return new Response(
      JSON.stringify({
        error: 'Forbidden',
        message: 'Origin not allowed'
      }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }

  return null;
}

/**
 * Complete CORS middleware
 * Use at the start of your edge function
 */
export function corsMiddleware(
  req: Request,
  config?: CORSConfig
): Response | Record<string, string> | null {
  const origin = req.headers.get('origin');

  // Handle preflight
  const preflightResponse = handleCORSPreflight(req, config);
  if (preflightResponse) {
    return preflightResponse;
  }

  // Validate origin for non-preflight requests
  const validationError = validateOrigin(req);
  if (validationError) {
    return validationError;
  }

  // Return headers to include in actual response
  return getCORSHeaders(origin, config);
}

/**
 * Add CORS headers to an existing response
 */
export function addCORSHeaders(
  response: Response,
  origin: string | null,
  config?: CORSConfig
): Response {
  const corsHeaders = getCORSHeaders(origin, config);

  // Clone response and add CORS headers
  const headers = new Headers(response.headers);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
