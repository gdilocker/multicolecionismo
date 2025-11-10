import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertCircle, Loader2, Key } from 'lucide-react';
import { verifyTOTP } from '../lib/security/totpUtils';
import { supabase } from '../lib/supabase';
import { logAuditEvent } from '../lib/security/audit';

interface TwoFactorInputProps {
  userId: string;
  onSuccess: () => void;
  onBack: () => void;
}

export const TwoFactorInput: React.FC<TwoFactorInputProps> = ({
  userId,
  onSuccess,
  onBack
}) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);

  const handleVerifyTOTP = async () => {
    if (code.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Get user's TOTP secret
      const { data: customer, error: fetchError } = await supabase
        .from('customers')
        .select('totp_secret')
        .eq('id', userId)
        .maybeSingle();

      if (fetchError || !customer?.totp_secret) {
        throw new Error('2FA configuration not found');
      }

      // Verify TOTP
      const isValid = await verifyTOTP(code, customer.totp_secret);

      if (!isValid) {
        // Log failed attempt
        await logAuditEvent({
          user_id: userId,
          action: 'login_failure',
          severity: 'medium',
          details: { reason: 'Invalid TOTP code' },
          success: false
        });

        setError('Invalid code. Please try again.');
        setCode('');
        return;
      }

      // Success - log and continue
      await logAuditEvent({
        user_id: userId,
        action: 'login_success',
        severity: 'low',
        details: { method: '2FA' },
        success: true
      });

      onSuccess();
    } catch (err: any) {
      console.error('2FA verification error:', err);
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyRecovery = async () => {
    if (code.length < 8) {
      setError('Please enter a valid recovery code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Hash the recovery code
      const encoder = new TextEncoder();
      const data = encoder.encode(code.toUpperCase());
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const codeHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Find unused recovery code
      const { data: recoveryCode, error: fetchError } = await supabase
        .from('recovery_codes')
        .select('id')
        .eq('user_id', userId)
        .eq('code_hash', codeHash)
        .eq('used', false)
        .maybeSingle();

      if (fetchError || !recoveryCode) {
        // Log failed attempt
        await logAuditEvent({
          user_id: userId,
          action: 'login_failure',
          severity: 'high',
          details: { reason: 'Invalid recovery code attempted' },
          success: false
        });

        setError('Invalid recovery code');
        setCode('');
        return;
      }

      // Mark as used
      await supabase
        .from('recovery_codes')
        .update({
          used: true,
          used_at: new Date().toISOString()
        })
        .eq('id', recoveryCode.id);

      // Log high-severity event (recovery code used)
      await logAuditEvent({
        user_id: userId,
        action: 'admin_action',
        severity: 'high',
        details: {
          description: 'Recovery code used for login',
          code_id: recoveryCode.id
        },
        success: true
      });

      onSuccess();
    } catch (err: any) {
      console.error('Recovery code verification error:', err);
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (useRecoveryCode) {
      await handleVerifyRecovery();
    } else {
      await handleVerifyTOTP();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white p-8 rounded-2xl shadow-xl border-2 border-blue-100"
    >
      <div className="flex items-center justify-center mb-6">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
          {useRecoveryCode ? (
            <Key className="w-8 h-8 text-blue-600" />
          ) : (
            <Shield className="w-8 h-8 text-blue-600" />
          )}
        </div>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
        Two-Factor Authentication
      </h2>
      <p className="text-gray-600 text-center mb-6">
        {useRecoveryCode
          ? 'Enter your recovery code'
          : 'Enter the 6-digit code from your authenticator app'}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="text"
            value={code}
            onChange={(e) => {
              const value = useRecoveryCode
                ? e.target.value.toUpperCase()
                : e.target.value.replace(/\D/g, '').slice(0, 6);
              setCode(value);
              setError('');
            }}
            maxLength={useRecoveryCode ? 9 : 6}
            placeholder={useRecoveryCode ? 'XXXX-XXXX' : '000000'}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-center text-2xl font-mono tracking-widest focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
            disabled={loading}
            autoFocus
          />
          {error && (
            <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {error}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || (useRecoveryCode ? code.length < 8 : code.length !== 6)}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Verifying...
            </>
          ) : (
            'Verify'
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setUseRecoveryCode(!useRecoveryCode);
            setCode('');
            setError('');
          }}
          className="w-full text-sm text-blue-600 hover:text-blue-700 transition"
        >
          {useRecoveryCode
            ? 'Use authenticator app instead'
            : 'Use recovery code instead'}
        </button>

        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="w-full text-sm text-gray-600 hover:text-gray-700 transition"
        >
          Back to login
        </button>
      </form>

      <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="text-sm text-yellow-800">
            <p className="font-semibold mb-1">Lost your device?</p>
            <p>Use one of your recovery codes to access your account.</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
