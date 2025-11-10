import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { NotificationService, Notification } from '../lib/services/notifications';
import { useNavigate } from 'react-router-dom';

export function CriticalAlertOverlay() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [alert, setAlert] = useState<Notification | null>(null);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    if (user?.id) {
      checkCriticalAlerts();

      // Subscribe to real-time updates
      const subscription = NotificationService.subscribeToUpdates(
        user.id,
        () => checkCriticalAlerts()
      );

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user?.id]);

  const checkCriticalAlerts = async () => {
    try {
      const alerts = await NotificationService.getCriticalNotifications();

      // Find first non-dismissed alert
      const nextAlert = alerts.find(a => !dismissed.includes(a.id));
      setAlert(nextAlert || null);
    } catch (error) {
      console.error('Error checking critical alerts:', error);
    }
  };

  const handleAction = async () => {
    if (!alert) return;

    // Mark as viewed
    await NotificationService.markAsViewed(alert.id);

    // Navigate
    if (alert.action_url) {
      navigate(alert.action_url);
    }

    // Dismiss from UI
    setDismissed([...dismissed, alert.id]);
    setAlert(null);
  };

  const handleDismiss = async () => {
    if (!alert) return;

    // Only temporarily dismiss (don't mark as resolved)
    setDismissed([...dismissed, alert.id]);
    setAlert(null);

    // Check for next alert
    setTimeout(() => checkCriticalAlerts(), 100);
  };

  if (!alert) return null;

  const getAlertIcon = () => {
    switch (alert.type) {
      case 'fraud_detected':
      case 'chargeback':
        return '⛔';
      case 'plan_blocked':
      case 'trial_expired':
        return '🚫';
      case 'domain_auction':
        return '🔨';
      case 'payment_overdue':
        return '💳';
      default:
        return '⚠️';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      >
        {/* Alert Box */}
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
        >
          {/* Header with Icon */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white">
            <div className="flex items-start gap-4">
              <div className="text-4xl flex-shrink-0">
                {getAlertIcon()}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-2">
                  {alert.title}
                </h2>
                <p className="text-red-100 text-sm leading-relaxed">
                  {alert.message}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Domain Info (if applicable) */}
            {alert.domain_name && (
              <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-600 mb-1">Domínio Afetado:</p>
                <p className="font-semibold text-slate-900">{alert.domain_name}</p>
              </div>
            )}

            {/* Additional Info */}
            {alert.metadata && Object.keys(alert.metadata).length > 0 && (
              <div className="mb-4 space-y-2">
                {alert.metadata.recovery_days && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Prazo de Recuperação:</span>
                    <span className="font-semibold text-slate-900">
                      {alert.metadata.recovery_days} dias
                    </span>
                  </div>
                )}
                {alert.metadata.affiliates_count && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Afiliados Afetados:</span>
                    <span className="font-semibold text-slate-900">
                      {alert.metadata.affiliates_count}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleAction}
                className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-xl transition-all flex items-center justify-center gap-2"
              >
                {alert.action_label || 'Resolver Agora'}
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-3 border-2 border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Warning Text */}
            <p className="text-xs text-slate-500 mt-4 text-center">
              Este alerta continuará aparecendo até que o problema seja resolvido.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

interface BlockingMessageProps {
  title: string;
  message: string;
  icon?: string;
  actionLabel?: string;
  actionUrl?: string;
  showSupport?: boolean;
}

export function BlockingMessage({
  title,
  message,
  icon = '🚫',
  actionLabel,
  actionUrl,
  showSupport = true
}: BlockingMessageProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="text-6xl mb-4">{icon}</div>
        <h1 className="text-2xl font-bold text-slate-900 mb-3">{title}</h1>
        <p className="text-slate-600 leading-relaxed mb-6">{message}</p>

        <div className="space-y-3">
          {actionLabel && actionUrl && (
            <button
              onClick={() => navigate(actionUrl)}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-xl transition-all"
            >
              {actionLabel}
            </button>
          )}

          {showSupport && (
            <button
              onClick={() => navigate('/support')}
              className="w-full border-2 border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
            >
              Falar com Suporte
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
