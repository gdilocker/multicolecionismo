import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { UserTypeSelectionModal } from './UserTypeSelectionModal';

interface UserTypeGateProps {
  children: React.ReactNode;
}

export const UserTypeGate: React.FC<UserTypeGateProps> = ({ children }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkUserType = async () => {
      if (!user?.id) {
        setChecking(false);
        return;
      }

      try {
        // Check if user has completed onboarding
        const { data, error } = await supabase
          .from('customers')
          .select('user_type, onboarding_completed')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error checking user type:', error);
          setChecking(false);
          return;
        }

        // If user hasn't completed onboarding or doesn't have a user_type, show modal
        if (!data?.onboarding_completed || !data?.user_type) {
          setShowModal(true);
        }
      } catch (error) {
        console.error('Error in checkUserType:', error);
      } finally {
        setChecking(false);
      }
    };

    checkUserType();
  }, [user?.id]);

  const handleUserTypeSelect = async (type: 'social' | 'member') => {
    if (!user?.id) return;

    try {
      // Update user type in database
      const { error } = await supabase
        .from('customers')
        .update({
          user_type: type,
          onboarding_completed: true
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setShowModal(false);

      // Redirect based on user type
      if (type === 'social') {
        // Redirect to social feed
        navigate('/social');
      } else {
        // Redirect to dashboard for members
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error saving user type:', error);
      throw error;
    }
  };

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      <UserTypeSelectionModal
        isOpen={showModal}
        onSelect={handleUserTypeSelect}
      />
    </>
  );
};
