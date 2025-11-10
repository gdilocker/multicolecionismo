/**
 * URL Security Validator
 *
 * Prevents XSS and malicious URL injections in user-generated content
 */

/**
 * Validates a subdomain to ensure it contains only safe characters
 * @param subdomain - The subdomain to validate
 * @returns true if subdomain is safe, false otherwise
 */
export function isValidSubdomain(subdomain: string): boolean {
  if (!subdomain || typeof subdomain !== 'string') {
    return false;
  }

  // Only allow alphanumeric characters, hyphens, and underscores
  const safePattern = /^[a-zA-Z0-9_-]+$/;

  // Must be between 3 and 63 characters
  if (subdomain.length < 3 || subdomain.length > 63) {
    return false;
  }

  // Cannot start or end with hyphen
  if (subdomain.startsWith('-') || subdomain.endsWith('-')) {
    return false;
  }

  return safePattern.test(subdomain);
}

/**
 * Sanitizes a subdomain by removing unsafe characters
 * @param subdomain - The subdomain to sanitize
 * @returns Sanitized subdomain
 */
export function sanitizeSubdomain(subdomain: string): string {
  if (!subdomain || typeof subdomain !== 'string') {
    return '';
  }

  // Remove all non-alphanumeric except hyphens and underscores
  return subdomain.replace(/[^a-zA-Z0-9_-]/g, '');
}

/**
 * Validates and sanitizes a phone number for WhatsApp
 * @param phone - The phone number to validate
 * @returns Sanitized phone number or null if invalid
 */
export function sanitizePhoneNumber(phone: string): string | null {
  if (!phone || typeof phone !== 'string') {
    return null;
  }

  // Remove all non-numeric characters
  const cleaned = phone.replace(/[^0-9]/g, '');

  // Phone number should be between 10 and 15 digits
  if (cleaned.length < 10 || cleaned.length > 15) {
    return null;
  }

  return cleaned;
}

/**
 * Creates a safe internal navigation URL
 * @param subdomain - The subdomain
 * @param path - Additional path (e.g., 'loja', 'perfil')
 * @returns Safe URL string or null if invalid
 */
export function createSafeInternalUrl(subdomain: string, path: string = ''): string | null {
  if (!isValidSubdomain(subdomain)) {
    console.warn('[Security] Invalid subdomain rejected:', subdomain);
    return null;
  }

  const safePath = path.replace(/[^a-zA-Z0-9_/-]/g, '');

  if (safePath && !safePath.startsWith('/')) {
    return `/${subdomain}/${safePath}`;
  }

  return `/${subdomain}${safePath}`;
}

/**
 * Validates a WhatsApp URL
 * @param url - The URL to validate
 * @returns true if URL is a valid WhatsApp URL
 */
export function isValidWhatsAppUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const urlObj = new URL(url);
    return urlObj.hostname === 'wa.me' && urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}
