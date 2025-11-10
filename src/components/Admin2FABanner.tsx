import React, { useEffect, useState } from 'react';
import { Shield, AlertTriangle, Clock, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Admin2FANotification {
  show_notification: boolean;
  type?: 'info' | 'warning' | 'urgent' | 'critical';
  message?: string;
  grace_period_ends?: string;
  time_remaining?: number;
  setup_url?: string;
}

export const Admin2FABanner: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notification, setNotification] = useState<Admin2FANotification | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    if (!user) return;

    loadNotification();

    // Refresh every minute
    const interval = setInterval(loadNotification, 60000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (!notification?.time_remaining) return;

    const updateTimer = () => {
      const seconds = Math.max(0, notification.time_remaining! - 1);

      if (seconds <= 0) {
        setTimeRemaining('Time expired');
        return;
      }

      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);

      if (hours >= 24) {
        const days = Math.floor(hours / 24);
        setTimeRemaining(`${days} day${days > 1 ? 's' : ''} remaining`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m remaining`);
      } else {
        setTimeRemaining(`${minutes} minute${minutes > 1 ? 's' : ''} remaining`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [notification]);

  const loadNotification = async () => {
    try {
      const { data, error } = await supabase.rpc('get_admin_2fa_notification', {
        p_user_id: user?.id
      });

      if (error) {
        console.error('Error loading 2FA notification:', error);
        return;
      }

      if (data?.show_notification) {
        setNotification(data);
      } else {
        setNotification(null);
      }
    } catch (err) {
      console.error('Error in loadNotification:', err);
    }
  };

  const handleEnable2FA = () => {
    navigate('/panel/settings/2fa?required=1');
  };

  const handleDismiss = () => {
    setDismissed(true);
    // Auto show again after 1 hour unless critical
    if (notification?.type !== 'critical') {
      setTimeout(() => setDismissed(false), 3600000);
    }
  };

  if (!notification?.show_notification || dismissed) {
    return null;
  }

  const getBannerStyle = () => {
    switch (notification.type) {
      case 'critical':
        return {
          bg: 'bg-red-600',
          border: 'border-red-700',
          text: 'text-white',
          icon: AlertTriangle,
          canDismiss: false
        };
      case 'urgent':
        return {
          bg: 'bg-orange-600',
          border: 'border-orange-700',
          text: 'text-white',
          icon: AlertTriangle,
          canDismiss: false
        };
      case 'warning':
        return {
          bg: 'bg-yellow-500',
          border: 'border-yellow-600',
          text: 'text-gray-900',
          icon: Clock,
          canDismiss: true
        };
      default:
        return {
          bg: 'bg-blue-500',
          border: 'border-blue-600',
          text: 'text-white',
          icon: Shield,
          canDismiss: true
        };
    }
  };

  const style = getBannerStyle();
  const Icon = style.icon;

  return (
    <div
      className={`${style.bg} ${style.border} border-b-2 ${style.text} py-3 px-4 relative z-50 animate-slideDown`}
      role="alert"
      aria-live="assertive"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <Icon className="w-5 h-5 flex-shrink-0 animate-pulse" />

          <div className="flex-1">
            <p className="font-semibold text-sm">
              {notification.message}
            </p>
            {timeRemaining && notification.type !== 'critical' && (
              <p className="text-xs opacity-90 mt-0.5">
                {timeRemaining}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleEnable2FA}
            className={`
              px-4 py-2 rounded-lg font-semibold text-sm transition
              ${notification.type === 'critical' || notification.type === 'urgent'
                ? 'bg-white text-gray-900 hover:bg-gray-100'
                : 'bg-gray-900 text-white hover:bg-gray-800'
              }
            `}
          >
            Enable 2FA Now
          </button>

          {style.canDismiss && (
            <button
              onClick={handleDismiss}
              className="p-2 rounded-lg hover:bg-black/10 transition"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
