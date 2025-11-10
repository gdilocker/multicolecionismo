import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth callback error:', error);
          navigate('/login?error=auth_failed');
          return;
        }

        if (session?.user) {
          // Check if user needs to select user type
          const { data: customer } = await supabase
            .from('customers')
            .select('user_type')
            .eq('user_id', session.user.id)
            .maybeSingle();

          if (!customer || !customer.user_type) {
            // New user - needs to select type
            navigate('/select-user-type');
          } else {
            // Existing user - go to appropriate dashboard
            navigate('/');
          }
        } else {
          navigate('/login');
        }
      } catch (error) {
        console.error('Error in auth callback:', error);
        navigate('/login?error=callback_failed');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-slate-900 mx-auto mb-4" />
        <p className="text-lg text-gray-600">Finalizando login...</p>
      </div>
    </div>
  );
}
