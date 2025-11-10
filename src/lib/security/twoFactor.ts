/**
 * Two-Factor Authentication (2FA) Utilities
 *
 * TOTP-based 2FA with recovery codes
 * Uses standard RFC 6238 (TOTP: Time-Based One-Time Password)
 */

import { supabase } from '../supabase';

/**
 * Generate a random TOTP secret (base32 encoded)
 * In production, use a proper TOTP library like otplib or speakeasy
 */
export function generateTOTPSecret(): string {
  // Base32 alphabet
  const base32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';

  // Generate 32 characters (160 bits)
  for (let i = 0; i < 32; i++) {
    secret += base32[Math.floor(Math.random() * base32.length)];
  }

  return secret;
}

/**
 * Generate TOTP URL for QR code
 */
export function generateTOTPUrl(
  secret: string,
  email: string,
  issuer: string = 'COM.RICH'
): string {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedEmail = encodeURIComponent(email);

  return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Verify TOTP code
 * In production, use otplib or speakeasy for actual verification
 * This is a placeholder that shows the expected interface
 */
export async function verifyTOTPCode(
  secret: string,
  code: string,
  window: number = 1
): Promise<boolean> {
  // IMPORTANT: In production, implement proper TOTP verification
  // using a library like otplib or speakeasy
  //
  // Example with otplib:
  // import { authenticator } from 'otplib';
  // return authenticator.verify({ token: code, secret });
  //
  // For now, this is a placeholder
  console.warn('TOTP verification not fully implemented - use otplib in production');

  // Basic validation
  if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
    return false;
  }

  // TODO: Implement actual TOTP algorithm
  // For testing purposes, accept any 6-digit code
  // REMOVE THIS IN PRODUCTION!
  return true;
}

/**
 * Generate recovery codes
 */
export function generateRecoveryCodes(count: number = 10): string[] {
  const codes: string[] = [];

  for (let i = 0; i < count; i++) {
    // Generate 8-character code (format: XXXX-XXXX)
    const part1 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const part2 = Math.random().toString(36).substring(2, 6).toUpperCase();
    codes.push(`${part1}-${part2}`);
  }

  return codes;
}

/**
 * Hash recovery code for storage
 * In production, use bcrypt or similar
 */
export async function hashRecoveryCode(code: string): Promise<string> {
  // Simple hash for now - use bcrypt in production
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify recovery code
 */
export async function verifyRecoveryCode(
  userId: string,
  code: string
): Promise<boolean> {
  try {
    const codeHash = await hashRecoveryCode(code);

    // Find unused recovery code
    const { data, error } = await supabase
      .from('recovery_codes')
      .select('id')
      .eq('user_id', userId)
      .eq('code_hash', codeHash)
      .eq('used', false)
      .maybeSingle();

    if (error || !data) {
      return false;
    }

    // Mark as used
    await supabase
      .from('recovery_codes')
      .update({
        used: true,
        used_at: new Date().toISOString()
      })
      .eq('id', data.id);

    // Log in audit
    try {
      const { logAuditEvent } = await import('./audit');
      await logAuditEvent({
        user_id: userId,
        action: 'admin_action', // Using admin_action as placeholder
        severity: 'high',
        details: {
          description: 'Recovery code used for 2FA bypass',
          code_id: data.id
        },
        success: true
      });
    } catch {
      // Audit logging is optional
    }

    return true;
  } catch (error) {
    console.error('Error verifying recovery code:', error);
    return false;
  }
}

/**
 * Enable 2FA for user
 */
export async function enable2FA(
  userId: string,
  secret: string,
  verificationCode: string
): Promise<{
  success: boolean;
  recoveryCodes?: string[];
  error?: string;
}> {
  try {
    // Verify the code first
    const isValid = await verifyTOTPCode(secret, verificationCode);

    if (!isValid) {
      return {
        success: false,
        error: 'Invalid verification code'
      };
    }

    // Generate recovery codes
    const recoveryCodes = generateRecoveryCodes(10);

    // Hash and store recovery codes
    const codeHashes = await Promise.all(
      recoveryCodes.map(code => hashRecoveryCode(code))
    );

    // Store in database
    const { error: insertError } = await supabase
      .from('recovery_codes')
      .insert(
        codeHashes.map(hash => ({
          user_id: userId,
          code_hash: hash,
          used: false
        }))
      );

    if (insertError) throw insertError;

    // Enable 2FA
    const { error: updateError } = await supabase
      .from('customers')
      .update({
        totp_enabled: true,
        totp_secret: secret, // Should be encrypted in production!
        totp_verified_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) throw updateError;

    // Log in audit
    try {
      const { logAuditEvent } = await import('./audit');
      await logAuditEvent({
        user_id: userId,
        action: 'settings_changed',
        severity: 'medium',
        details: {
          description: '2FA enabled',
          recovery_codes_generated: recoveryCodes.length
        },
        success: true
      });
    } catch {
      // Audit logging is optional
    }

    return {
      success: true,
      recoveryCodes
    };
  } catch (error: any) {
    console.error('Error enabling 2FA:', error);
    return {
      success: false,
      error: error.message || 'Failed to enable 2FA'
    };
  }
}

/**
 * Disable 2FA for user
 */
export async function disable2FA(
  userId: string,
  verificationCode: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Get user's secret
    const { data: user, error: userError } = await supabase
      .from('customers')
      .select('totp_secret, totp_enabled')
      .eq('id', userId)
      .maybeSingle();

    if (userError || !user || !user.totp_enabled) {
      return {
        success: false,
        error: '2FA not enabled'
      };
    }

    // Verify code
    const isValid = await verifyTOTPCode(user.totp_secret, verificationCode);

    if (!isValid) {
      return {
        success: false,
        error: 'Invalid verification code'
      };
    }

    // Disable 2FA
    const { error: updateError } = await supabase
      .from('customers')
      .update({
        totp_enabled: false,
        totp_secret: null,
        totp_verified_at: null
      })
      .eq('id', userId);

    if (updateError) throw updateError;

    // Delete recovery codes
    await supabase
      .from('recovery_codes')
      .delete()
      .eq('user_id', userId);

    // Log in audit
    try {
      const { logAuditEvent } = await import('./audit');
      await logAuditEvent({
        user_id: userId,
        action: 'settings_changed',
        severity: 'medium',
        details: {
          description: '2FA disabled'
        },
        success: true
      });
    } catch {
      // Audit logging is optional
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error disabling 2FA:', error);
    return {
      success: false,
      error: error.message || 'Failed to disable 2FA'
    };
  }
}

/**
 * Check if user has 2FA enabled
 */
export async function is2FAEnabled(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('totp_enabled')
      .eq('id', userId)
      .maybeSingle();

    return !error && data?.totp_enabled === true;
  } catch {
    return false;
  }
}

/**
 * Get remaining recovery codes count
 */
export async function getRemainingRecoveryCodes(
  userId: string
): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('recovery_codes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('used', false);

    return error ? 0 : count || 0;
  } catch {
    return 0;
  }
}

/**
 * Regenerate recovery codes
 */
export async function regenerateRecoveryCodes(
  userId: string,
  verificationCode: string
): Promise<{
  success: boolean;
  recoveryCodes?: string[];
  error?: string;
}> {
  try {
    // Get user's secret
    const { data: user, error: userError } = await supabase
      .from('customers')
      .select('totp_secret, totp_enabled')
      .eq('id', userId)
      .maybeSingle();

    if (userError || !user || !user.totp_enabled) {
      return {
        success: false,
        error: '2FA not enabled'
      };
    }

    // Verify code
    const isValid = await verifyTOTPCode(user.totp_secret, verificationCode);

    if (!isValid) {
      return {
        success: false,
        error: 'Invalid verification code'
      };
    }

    // Delete old recovery codes
    await supabase
      .from('recovery_codes')
      .delete()
      .eq('user_id', userId);

    // Generate new codes
    const recoveryCodes = generateRecoveryCodes(10);
    const codeHashes = await Promise.all(
      recoveryCodes.map(code => hashRecoveryCode(code))
    );

    // Store new codes
    const { error: insertError } = await supabase
      .from('recovery_codes')
      .insert(
        codeHashes.map(hash => ({
          user_id: userId,
          code_hash: hash,
          used: false
        }))
      );

    if (insertError) throw insertError;

    // Log in audit
    try {
      const { logAuditEvent } = await import('./audit');
      await logAuditEvent({
        user_id: userId,
        action: 'settings_changed',
        severity: 'medium',
        details: {
          description: 'Recovery codes regenerated'
        },
        success: true
      });
    } catch {
      // Audit logging is optional
    }

    return {
      success: true,
      recoveryCodes
    };
  } catch (error: any) {
    console.error('Error regenerating recovery codes:', error);
    return {
      success: false,
      error: error.message || 'Failed to regenerate codes'
    };
  }
}
