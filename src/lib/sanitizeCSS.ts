/**
 * CSS Sanitizer
 *
 * Sanitizes user-provided CSS to prevent XSS and other attacks
 * while allowing legitimate styling customization
 */

// Dangerous CSS properties that can be used for XSS
const DANGEROUS_PROPERTIES = [
  'behavior',
  '-moz-binding',
  'expression',
  'filter',
  'import',
];

// Dangerous CSS values/functions
const DANGEROUS_VALUES = [
  'javascript:',
  'vbscript:',
  'data:text/html',
  'expression(',
  '-moz-binding',
  'behavior:',
  '@import',
];

// Allowed CSS properties (whitelist approach)
const ALLOWED_PROPERTIES = [
  'color',
  'background-color',
  'background',
  'background-image',
  'background-position',
  'background-size',
  'background-repeat',
  'border',
  'border-radius',
  'border-color',
  'border-width',
  'border-style',
  'padding',
  'margin',
  'font-family',
  'font-size',
  'font-weight',
  'font-style',
  'text-align',
  'text-decoration',
  'text-transform',
  'line-height',
  'letter-spacing',
  'opacity',
  'box-shadow',
  'text-shadow',
  'transition',
  'transform',
  'animation',
  'width',
  'height',
  'max-width',
  'max-height',
  'min-width',
  'min-height',
  'display',
  'position',
  'top',
  'left',
  'right',
  'bottom',
  'z-index',
  'overflow',
  'cursor',
];

/**
 * Sanitize CSS string
 */
export function sanitizeCSS(css: string): string {
  if (!css || typeof css !== 'string') {
    return '';
  }

  // Remove comments
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');

  // Check for dangerous values
  const lowerCSS = css.toLowerCase();
  for (const dangerous of DANGEROUS_VALUES) {
    if (lowerCSS.includes(dangerous.toLowerCase())) {
      console.warn(`Dangerous CSS value detected: ${dangerous}`);
      return '';
    }
  }

  // Parse CSS rules
  const sanitized: string[] = [];
  const rules = css.split('}').filter(rule => rule.trim());

  for (const rule of rules) {
    if (!rule.includes('{')) continue;

    const [selector, declarations] = rule.split('{');
    const cleanSelector = sanitizeSelector(selector.trim());

    if (!cleanSelector) continue;

    const cleanDeclarations = sanitizeDeclarations(declarations);

    if (cleanDeclarations) {
      sanitized.push(`${cleanSelector} { ${cleanDeclarations} }`);
    }
  }

  return sanitized.join('\n');
}

/**
 * Sanitize CSS selector
 */
function sanitizeSelector(selector: string): string {
  // Only allow safe selectors (class, id, element, pseudo-classes)
  // Prevent attribute selectors with dangerous content
  const dangerousPatterns = [
    /javascript:/i,
    /vbscript:/i,
    /data:/i,
    /<script/i,
    /@import/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(selector)) {
      return '';
    }
  }

  // Basic sanitization - allow alphanumeric, dashes, underscores, dots, hashes, colons, commas, spaces, >, +, ~, *
  const cleaned = selector.replace(/[^a-zA-Z0-9\-_\.#:,\s>+~*()[\]]/g, '');

  return cleaned.trim();
}

/**
 * Sanitize CSS declarations
 */
function sanitizeDeclarations(declarations: string): string {
  const cleaned: string[] = [];
  const props = declarations.split(';').filter(prop => prop.trim());

  for (const prop of props) {
    const [property, ...valueParts] = prop.split(':');
    if (!property || valueParts.length === 0) continue;

    const cleanProperty = property.trim().toLowerCase();
    const value = valueParts.join(':').trim();

    // Check if property is dangerous
    if (DANGEROUS_PROPERTIES.some(dp => cleanProperty.includes(dp))) {
      console.warn(`Dangerous CSS property detected: ${cleanProperty}`);
      continue;
    }

    // Whitelist approach: only allow known safe properties
    if (!ALLOWED_PROPERTIES.includes(cleanProperty)) {
      // Allow custom properties (CSS variables)
      if (!cleanProperty.startsWith('--')) {
        continue;
      }
    }

    // Check value for dangerous content
    const lowerValue = value.toLowerCase();
    const hasDangerousValue = DANGEROUS_VALUES.some(dv =>
      lowerValue.includes(dv.toLowerCase())
    );

    if (hasDangerousValue) {
      console.warn(`Dangerous CSS value detected in ${cleanProperty}: ${value}`);
      continue;
    }

    // Sanitize URLs in the value
    const cleanValue = sanitizeURLsInValue(value);

    if (cleanValue) {
      cleaned.push(`${cleanProperty}: ${cleanValue}`);
    }
  }

  return cleaned.join('; ');
}

/**
 * Sanitize URLs in CSS values
 */
function sanitizeURLsInValue(value: string): string {
  // Replace url() functions
  return value.replace(/url\s*\(\s*(['"]?)([^'"()]+)\1\s*\)/gi, (match, quote, url) => {
    const cleanURL = sanitizeURL(url.trim());
    if (cleanURL) {
      return `url(${quote}${cleanURL}${quote})`;
    }
    return '';
  });
}

/**
 * Sanitize URL
 */
function sanitizeURL(url: string): string {
  const lowerURL = url.toLowerCase().trim();

  // Block dangerous protocols
  const dangerousProtocols = [
    'javascript:',
    'vbscript:',
    'data:text/html',
    'data:application',
  ];

  for (const protocol of dangerousProtocols) {
    if (lowerURL.startsWith(protocol)) {
      console.warn(`Dangerous URL protocol detected: ${protocol}`);
      return '';
    }
  }

  // Allow http, https, data:image, and relative URLs
  if (
    lowerURL.startsWith('http://') ||
    lowerURL.startsWith('https://') ||
    lowerURL.startsWith('data:image/') ||
    lowerURL.startsWith('/') ||
    lowerURL.startsWith('./')
  ) {
    return url;
  }

  return '';
}

/**
 * Validate CSS length (for max size)
 */
export function validateCSSLength(css: string, maxLength: number = 50000): boolean {
  return css.length <= maxLength;
}

/**
 * Full CSS validation with sanitization
 */
export function validateAndSanitizeCSS(css: string): { valid: boolean; sanitized: string; error?: string } {
  if (!css) {
    return { valid: true, sanitized: '' };
  }

  if (!validateCSSLength(css)) {
    return {
      valid: false,
      sanitized: '',
      error: 'CSS is too long (max 50KB)'
    };
  }

  try {
    const sanitized = sanitizeCSS(css);
    return {
      valid: true,
      sanitized
    };
  } catch (error) {
    return {
      valid: false,
      sanitized: '',
      error: error instanceof Error ? error.message : 'Invalid CSS'
    };
  }
}
