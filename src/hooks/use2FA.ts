import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface Check2FAResult {
  needs2FA: boolean;
  mustEnable2FA: boolean;
  userId?: string;
  role?: string;
}

export function use2FA() {
  const [pending2FA, setPending2FA] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const navigate = useNavigate();

  /**
   * Check if user needs 2FA after successful password login
   */
  const check2FARequired = async (authUserId: string): Promise<Check2FAResult> => {
    try {
      const { data: customer, error } = await supabase
        .from('customers')
        .select('id, role, totp_enabled')
        .eq('id', authUserId)
        .maybeSingle();

      if (error || !customer) {
        console.error('Failed to fetch customer 2FA status:', error);
        return { needs2FA: false, mustEnable2FA: false };
      }

      // Admin without 2FA must enable it
      if (customer.role === 'admin' && !customer.totp_enabled) {
        return {
          needs2FA: false,
          mustEnable2FA: true,
          userId: customer.id,
          role: customer.role
        };
      }

      // User has 2FA enabled - must verify
      if (customer.totp_enabled) {
        return {
          needs2FA: true,
          mustEnable2FA: false,
          userId: customer.id,
          role: customer.role
        };
      }

      // No 2FA required
      return {
        needs2FA: false,
        mustEnable2FA: false,
        userId: customer.id,
        role: customer.role
      };
    } catch (err) {
      console.error('Error checking 2FA status:', err);
      return { needs2FA: false, mustEnable2FA: false };
    }
  };

  /**
   * Handle 2FA enforcement after login
   */
  const handle2FAAfterLogin = async (authUserId: string): Promise<{
    shouldProceed: boolean;
    redirectPath?: string;
  }> => {
    const result = await check2FARequired(authUserId);

    // Admin must enable 2FA
    if (result.mustEnable2FA) {
      navigate('/panel/settings/2fa?required=1', {
        state: { message: 'Administrators must enable Two-Factor Authentication' }
      });
      return { shouldProceed: false, redirectPath: '/panel/settings/2fa?required=1' };
    }

    // User has 2FA - needs verification
    if (result.needs2FA) {
      setUserId(authUserId);
      setPending2FA(true);
      return { shouldProceed: false };
    }

    // No 2FA required
    return { shouldProceed: true };
  };

  /**
   * Mark 2FA verification as complete
   */
  const complete2FA = () => {
    setPending2FA(false);
    setUserId('');
  };

  /**
   * Cancel 2FA verification (logout)
   */
  const cancel2FA = async () => {
    await supabase.auth.signOut();
    setPending2FA(false);
    setUserId('');
  };

  return {
    pending2FA,
    userId,
    check2FARequired,
    handle2FAAfterLogin,
    complete2FA,
    cancel2FA
  };
}
