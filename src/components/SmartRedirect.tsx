import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

/**
 * Smart redirect component that sends users to the right place based on their user_type
 */
export const SmartRedirect: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [userType, setUserType] = useState<'social' | 'member' | 'admin' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserType = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        // Check if admin
        if (user.role === 'admin') {
          setUserType('admin');
          setLoading(false);
          return;
        }

        // Fetch user type
        const { data } = await supabase
          .from('customers')
          .select('user_type')
          .eq('user_id', user.id)
          .maybeSingle();

        setUserType(data?.user_type || 'member');
      } catch (error) {
        console.error('Error fetching user type:', error);
        setUserType('member');
      } finally {
        setLoading(false);
      }
    };

    fetchUserType();
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-blue-200">Redirecionando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect based on user type
  if (userType === 'social') {
    return <Navigate to="/" replace />;
  } else if (userType === 'member') {
    return <Navigate to="/panel/dashboard" replace />;
  } else if (userType === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Fallback
  return <Navigate to="/" replace />;
};
