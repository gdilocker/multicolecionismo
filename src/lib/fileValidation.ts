/**
 * File Upload Validation
 *
 * Validates file uploads to prevent:
 * - Malicious file uploads
 * - Oversized files
 * - Invalid file types
 * - Security vulnerabilities
 */

// Allowed MIME types
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
];

export const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime', // .mov
];

export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

// File size limits (in bytes)
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;      // 10 MB
export const MAX_VIDEO_SIZE = 100 * 1024 * 1024;     // 100 MB
export const MAX_AVATAR_SIZE = 5 * 1024 * 1024;      // 5 MB
export const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;   // 10 MB

// File extension validation
const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
const ALLOWED_VIDEO_EXTENSIONS = ['.mp4', '.webm', '.ogg', '.mov'];
const ALLOWED_DOCUMENT_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt'];

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  details?: {
    size?: number;
    type?: string;
    name?: string;
  };
}

/**
 * Validate file extension
 */
function validateExtension(filename: string, allowedExtensions: string[]): boolean {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return allowedExtensions.includes(ext);
}

/**
 * Validate MIME type against content
 * This is a basic check - for production, use magic bytes detection
 */
async function validateMIMEType(file: File): Promise<boolean> {
  // Read first few bytes to check magic numbers
  const buffer = await file.slice(0, 12).arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // Check magic numbers for common formats
  if (file.type.startsWith('image/')) {
    // JPEG
    if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
      return file.type === 'image/jpeg' || file.type === 'image/jpg';
    }
    // PNG
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
      return file.type === 'image/png';
    }
    // GIF
    if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
      return file.type === 'image/gif';
    }
    // WebP
    if (bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
      return file.type === 'image/webp';
    }
    // SVG (XML-based, check for '<svg')
    const text = new TextDecoder().decode(bytes);
    if (text.includes('<svg') || text.includes('<?xml')) {
      return file.type === 'image/svg+xml';
    }
  }

  if (file.type.startsWith('video/')) {
    // MP4
    if (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) {
      return file.type === 'video/mp4' || file.type === 'video/quicktime';
    }
    // WebM
    if (bytes[0] === 0x1A && bytes[1] === 0x45 && bytes[2] === 0xDF && bytes[3] === 0xA3) {
      return file.type === 'video/webm';
    }
  }

  // For other types, trust the MIME type (not recommended for production)
  return true;
}

/**
 * Validate image file
 */
export async function validateImage(
  file: File,
  maxSize: number = MAX_IMAGE_SIZE
): Promise<FileValidationResult> {
  // Check size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `Image too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB`,
      details: { size: file.size, name: file.name },
    };
  }

  // Check MIME type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid image type. Allowed: ${ALLOWED_IMAGE_TYPES.join(', ')}`,
      details: { type: file.type, name: file.name },
    };
  }

  // Check extension
  if (!validateExtension(file.name, ALLOWED_IMAGE_EXTENSIONS)) {
    return {
      valid: false,
      error: 'Invalid file extension',
      details: { name: file.name },
    };
  }

  // Validate MIME type against content
  const mimeValid = await validateMIMEType(file);
  if (!mimeValid) {
    return {
      valid: false,
      error: 'File content does not match declared type',
      details: { type: file.type, name: file.name },
    };
  }

  return { valid: true };
}

/**
 * Validate video file
 */
export async function validateVideo(
  file: File,
  maxSize: number = MAX_VIDEO_SIZE
): Promise<FileValidationResult> {
  // Check size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `Video too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB`,
      details: { size: file.size, name: file.name },
    };
  }

  // Check MIME type
  if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid video type. Allowed: ${ALLOWED_VIDEO_TYPES.join(', ')}`,
      details: { type: file.type, name: file.name },
    };
  }

  // Check extension
  if (!validateExtension(file.name, ALLOWED_VIDEO_EXTENSIONS)) {
    return {
      valid: false,
      error: 'Invalid file extension',
      details: { name: file.name },
    };
  }

  // Validate MIME type against content
  const mimeValid = await validateMIMEType(file);
  if (!mimeValid) {
    return {
      valid: false,
      error: 'File content does not match declared type',
      details: { type: file.type, name: file.name },
    };
  }

  return { valid: true };
}

/**
 * Validate avatar image (stricter rules)
 */
export async function validateAvatar(file: File): Promise<FileValidationResult> {
  // Avatars: only JPEG, PNG, WebP
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid avatar format. Use JPEG, PNG, or WebP',
      details: { type: file.type },
    };
  }

  return validateImage(file, MAX_AVATAR_SIZE);
}

/**
 * Validate document file
 */
export async function validateDocument(
  file: File,
  maxSize: number = MAX_DOCUMENT_SIZE
): Promise<FileValidationResult> {
  // Check size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `Document too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB`,
      details: { size: file.size, name: file.name },
    };
  }

  // Check MIME type
  if (!ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid document type. Allowed: ${ALLOWED_DOCUMENT_TYPES.join(', ')}`,
      details: { type: file.type, name: file.name },
    };
  }

  // Check extension
  if (!validateExtension(file.name, ALLOWED_DOCUMENT_EXTENSIONS)) {
    return {
      valid: false,
      error: 'Invalid file extension',
      details: { name: file.name },
    };
  }

  return { valid: true };
}

/**
 * Sanitize filename
 */
export function sanitizeFilename(filename: string): string {
  // Remove path traversal attempts
  let clean = filename.replace(/\.\./g, '');

  // Remove special characters except dots, dashes, underscores
  clean = clean.replace(/[^a-zA-Z0-9._-]/g, '_');

  // Limit length
  if (clean.length > 255) {
    const ext = clean.substring(clean.lastIndexOf('.'));
    clean = clean.substring(0, 255 - ext.length) + ext;
  }

  return clean;
}

/**
 * Generate unique filename
 */
export function generateUniqueFilename(originalFilename: string): string {
  const sanitized = sanitizeFilename(originalFilename);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  const ext = sanitized.substring(sanitized.lastIndexOf('.'));
  const nameWithoutExt = sanitized.substring(0, sanitized.lastIndexOf('.'));

  return `${nameWithoutExt}_${timestamp}_${random}${ext}`;
}
