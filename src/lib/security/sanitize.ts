import DOMPurify from 'dompurify';

/**
 * Security utilities for sanitizing user input and preventing XSS attacks
 */

interface SanitizeOptions {
  allowedTags?: string[];
  allowedAttributes?: { [key: string]: string[] };
  allowedSchemes?: string[];
}

/**
 * Sanitize HTML content to prevent XSS attacks
 * Uses DOMPurify with strict defaults
 */
export function sanitizeHtml(
  dirty: string,
  options: SanitizeOptions = {}
): string {
  const defaultConfig: DOMPurify.Config = {
    ALLOWED_TAGS: options.allowedTags || [
      'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'a', 'blockquote', 'code', 'pre', 'img', 'span', 'div'
    ],
    ALLOWED_ATTR: options.allowedAttributes || {
      'a': ['href', 'title', 'target', 'rel'],
      'img': ['src', 'alt', 'title', 'width', 'height'],
      'span': ['class'],
      'div': ['class'],
      'code': ['class'],
      'pre': ['class']
    },
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    KEEP_CONTENT: true,
    RETURN_TRUSTED_TYPE: false,
    FORCE_BODY: true,
    SANITIZE_DOM: true,
    IN_PLACE: false
  };

  // Add hooks to enforce additional security
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    // Set all links to open in new tab and noopener noreferrer
    if (node.tagName === 'A') {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
    }

    // Remove any javascript: or data: URLs
    if ('href' in node) {
      const href = node.getAttribute('href');
      if (href && (href.startsWith('javascript:') || href.startsWith('data:'))) {
        node.removeAttribute('href');
      }
    }
  });

  return DOMPurify.sanitize(dirty, defaultConfig);
}

/**
 * Sanitize text content (strips all HTML)
 */
export function sanitizeText(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    KEEP_CONTENT: true
  });
}

/**
 * Validate and sanitize URL
 */
export function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);

    // Only allow http, https, mailto protocols
    if (!['http:', 'https:', 'mailto:'].includes(parsed.protocol)) {
      return null;
    }

    // Block javascript: and data: URLs
    if (url.toLowerCase().includes('javascript:') || url.toLowerCase().includes('data:')) {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Sanitize filename to prevent directory traversal
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '.')
    .substring(0, 255);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 320;
}

/**
 * Validate domain name format
 */
export function isValidDomain(domain: string): boolean {
  const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
  return domainRegex.test(domain) && domain.length <= 253;
}

/**
 * Sanitize subdomain (alphanumeric and hyphens only)
 */
export function sanitizeSubdomain(subdomain: string): string {
  return subdomain
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/^-+|-+$/g, '')
    .substring(0, 63);
}

/**
 * Validate phone number (basic validation)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/[\s-()]/g, ''));
}

/**
 * Rate limit key generator
 */
export function getRateLimitKey(identifier: string, action: string): string {
  return `rate_limit:${action}:${identifier}`;
}

/**
 * Sanitize SQL input (basic, RLS should be primary defense)
 */
export function sanitizeSqlInput(input: string): string {
  return input
    .replace(/['";\\]/g, '')
    .substring(0, 1000);
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Mask sensitive data for logging
 */
export function maskSensitiveData(data: string, visibleChars = 4): string {
  if (data.length <= visibleChars) {
    return '***';
  }
  return data.substring(0, visibleChars) + '*'.repeat(Math.min(data.length - visibleChars, 8));
}

/**
 * Check if string contains suspicious patterns
 */
export function containsSuspiciousPatterns(input: string): boolean {
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,  // onclick, onload, etc
    /eval\s*\(/i,
    /expression\s*\(/i,
    /vbscript:/i,
    /data:text\/html/i
  ];

  return suspiciousPatterns.some(pattern => pattern.test(input));
}
