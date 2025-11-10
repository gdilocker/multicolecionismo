/**
 * Native TOTP (Time-based One-Time Password) Implementation
 * No external dependencies - works in all browsers
 */

// Base32 encoding
const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(buffer: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      output += base32Chars[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += base32Chars[(value << (5 - bits)) & 31];
  }

  return output;
}

function base32Decode(encoded: string): Uint8Array {
  const cleanInput = encoded.toUpperCase().replace(/[^A-Z2-7]/g, '');
  const output: number[] = [];
  let bits = 0;
  let value = 0;

  for (let i = 0; i < cleanInput.length; i++) {
    value = (value << 5) | base32Chars.indexOf(cleanInput[i]);
    bits += 5;

    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return new Uint8Array(output);
}

// HMAC-SHA1 implementation using Web Crypto API
async function hmacSha1(key: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, message);
  return new Uint8Array(signature);
}

// Generate TOTP code
async function generateTOTP(secret: string, timeStep: number = 30): Promise<string> {
  const key = base32Decode(secret);
  const time = Math.floor(Date.now() / 1000 / timeStep);

  // Convert time to 8-byte buffer
  const timeBuffer = new Uint8Array(8);
  let t = time;
  for (let i = 7; i >= 0; i--) {
    timeBuffer[i] = t & 0xff;
    t = t >> 8;
  }

  const hmac = await hmacSha1(key, timeBuffer);

  // Dynamic truncation
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = (
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)
  ) % 1000000;

  return code.toString().padStart(6, '0');
}

// Verify TOTP code (check current time and ±1 time step for clock skew)
export async function verifyTOTP(token: string, secret: string, window: number = 1): Promise<boolean> {
  try {
    const timeStep = 30;
    const currentTime = Math.floor(Date.now() / 1000 / timeStep);

    for (let i = -window; i <= window; i++) {
      const time = currentTime + i;
      const key = base32Decode(secret);

      const timeBuffer = new Uint8Array(8);
      let t = time;
      for (let j = 7; j >= 0; j--) {
        timeBuffer[j] = t & 0xff;
        t = Math.floor(t / 256);
      }

      const hmac = await hmacSha1(key, timeBuffer);
      const offset = hmac[hmac.length - 1] & 0x0f;
      const code = (
        ((hmac[offset] & 0x7f) << 24) |
        ((hmac[offset + 1] & 0xff) << 16) |
        ((hmac[offset + 2] & 0xff) << 8) |
        (hmac[offset + 3] & 0xff)
      ) % 1000000;

      if (code.toString().padStart(6, '0') === token) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('TOTP verification error:', error);
    return false;
  }
}

// Generate a random secret
export function generateSecret(): string {
  const buffer = new Uint8Array(20); // 160 bits
  crypto.getRandomValues(buffer);
  return base32Encode(buffer);
}

// Generate OTPAuth URL for QR code
export function generateOTPAuthURL(accountName: string, issuer: string, secret: string): string {
  const params = new URLSearchParams({
    secret: secret,
    issuer: issuer,
    algorithm: 'SHA1',
    digits: '6',
    period: '30'
  });

  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?${params.toString()}`;
}

// Generate QR code URL using Edge Function
export function generateQRCodeURL(text: string): string {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const params = new URLSearchParams({
    data: text,
    size: '220'
  });

  return `${supabaseUrl}/functions/v1/qr?${params.toString()}`;
}
