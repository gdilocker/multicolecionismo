/**
 * Secure Upload Guard
 * Validates file types by magic bytes (not extension)
 * Prevents RCE and social engineering attacks
 */

// Magic bytes for common file types
const FILE_SIGNATURES: Record<string, { magic: number[][]; mime: string; ext: string }> = {
  png: {
    magic: [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
    mime: 'image/png',
    ext: 'png'
  },
  jpg: {
    magic: [[0xFF, 0xD8, 0xFF]],
    mime: 'image/jpeg',
    ext: 'jpg'
  },
  webp: {
    magic: [[0x52, 0x49, 0x46, 0x46, null, null, null, null, 0x57, 0x45, 0x42, 0x50]],
    mime: 'image/webp',
    ext: 'webp'
  },
  pdf: {
    magic: [[0x25, 0x50, 0x44, 0x46]],
    mime: 'application/pdf',
    ext: 'pdf'
  }
};

const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'application/pdf']);

/**
 * Check if buffer starts with magic bytes
 */
function matchesMagic(buffer: Uint8Array, magic: (number | null)[]): boolean {
  if (buffer.length < magic.length) return false;

  for (let i = 0; i < magic.length; i++) {
    if (magic[i] !== null && buffer[i] !== magic[i]) {
      return false;
    }
  }

  return true;
}

/**
 * Detect file type from buffer using magic bytes
 */
export function detectFileType(buffer: Uint8Array): { mime: string; ext: string } | null {
  for (const [_, signature] of Object.entries(FILE_SIGNATURES)) {
    for (const magic of signature.magic) {
      if (matchesMagic(buffer, magic)) {
        return { mime: signature.mime, ext: signature.ext };
      }
    }
  }

  return null;
}

/**
 * Validate upload file
 * Returns file info if valid, null otherwise
 */
export async function validateUpload(
  buffer: Uint8Array
): Promise<{ ext: string; mime: string } | null> {
  if (!buffer || buffer.length === 0) {
    return null;
  }

  // Detect real file type by magic bytes
  const fileType = detectFileType(buffer);

  if (!fileType || !ALLOWED_TYPES.has(fileType.mime)) {
    console.warn('Invalid file type detected:', fileType?.mime || 'unknown');
    return null;
  }

  return fileType;
}

/**
 * Generate secure filename
 * Ignores client-provided filename to prevent attacks
 */
export function generateSecureFilename(userId: string, ext: string): string {
  const uuid = crypto.randomUUID();
  return `uploads/${userId}/${uuid}.${ext}`;
}

/**
 * Additional image validation (size, dimensions)
 */
export async function validateImage(
  buffer: Uint8Array,
  options?: {
    maxSizeBytes?: number;
    maxWidth?: number;
    maxHeight?: number;
  }
): Promise<{ valid: boolean; error?: string }> {
  const maxSize = options?.maxSizeBytes || 10 * 1024 * 1024; // 10MB default

  if (buffer.length > maxSize) {
    return { valid: false, error: `File too large. Max ${maxSize / 1024 / 1024}MB` };
  }

  // Note: Dimension validation would require image decoding
  // For now, we rely on magic byte validation + size limit

  return { valid: true };
}

/**
 * Sanitize filename (if you must use client filename)
 */
export function sanitizeFilename(filename: string): string {
  // Remove path traversal attempts
  let clean = filename.replace(/[\/\\]/g, '');

  // Remove null bytes
  clean = clean.replace(/\0/g, '');

  // Remove dangerous extensions
  clean = clean.replace(/\.(exe|bat|cmd|sh|php|jsp|asp|aspx|dll|sys)$/i, '.txt');

  // Keep only safe characters
  clean = clean.replace(/[^a-zA-Z0-9._-]/g, '_');

  // Prevent double extensions
  const parts = clean.split('.');
  if (parts.length > 2) {
    clean = parts[0] + '.' + parts[parts.length - 1];
  }

  return clean;
}
