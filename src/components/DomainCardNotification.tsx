import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Clock, DollarSign, ChevronRight } from 'lucide-react';
import { NotificationService, Notification } from '../lib/services/notifications';
import { useNavigate } from 'react-router-dom';

interface DomainCardNotificationProps {
  domainId: string;
  domainName: string;
}

export function DomainCardNotification({ domainId, domainName }: DomainCardNotificationProps) {
  const navigate = useNavigate();
  const [notification, setNotification] = useState<Notification | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotification();
  }, [domainId]);

  const loadNotification = async () => {
    try {
      const notifications = await NotificationService.getDomainNotifications(domainId);
      // Get the highest priority notification for this domain
      if (notifications.length > 0) {
        const sorted = notifications.sort((a, b) => {
          const priorities = { critical: 1, high: 2, medium: 3, low: 4 };
          return priorities[a.priority as keyof typeof priorities] -
                 priorities[b.priority as keyof typeof priorities];
        });
        setNotification(sorted[0]);
      } else {
        setNotification(null);
      }
    } catch (error) {
      console.error('Error loading domain notification:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!notification) return;

    // Mark as viewed
    if (notification.status === 'new') {
      await NotificationService.markAsViewed(notification.id);
    }

    // Navigate
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  if (loading || !notification) return null;

  const colors = NotificationService.getColorScheme(notification.priority);
  const icon = NotificationService.getPriorityIcon(notification.priority);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className={`border-2 rounded-lg p-3 mt-3 ${colors.bg} ${colors.border}`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          <span className="text-lg">{icon}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className={`font-semibold text-sm ${colors.text} mb-1`}>
            {notification.title.replace(domainName, '').trim() || notification.type}
          </h4>
          <p className={`text-xs ${colors.text} opacity-80 leading-relaxed`}>
            {notification.message}
          </p>

          {/* Actions */}
          {notification.action_label && (
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={handleAction}
                className={`inline-flex items-center gap-1 text-xs font-semibold ${colors.text} bg-white px-3 py-1.5 rounded-lg hover:shadow-md transition-all`}
              >
                {notification.action_label}
                <ChevronRight className="w-3 h-3" />
              </button>

              {/* Additional context buttons based on type */}
              {notification.type === 'domain_redemption' && (
                <a
                  href="/suporte"
                  className="text-xs text-slate-600 hover:text-slate-800 underline"
                >
                  Falar com Suporte
                </a>
              )}
            </div>
          )}

          {/* Metadata (days remaining, fees, etc) */}
          {notification.metadata && (
            <div className="mt-2 flex items-center gap-3 text-xs opacity-70">
              {notification.metadata.days_remaining !== undefined && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{notification.metadata.days_remaining} dias</span>
                </div>
              )}
              {notification.metadata.recovery_fee !== undefined && (
                <div className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  <span>Taxa: ${notification.metadata.recovery_fee}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

interface DomainStatusBadgeProps {
  status: string;
  className?: string;
}

export function DomainStatusBadge({ status, className = '' }: DomainStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'active':
        return {
          label: 'Ativo',
          color: 'bg-green-100 text-green-800 border-green-200'
        };
      case 'grace':
        return {
          label: 'Período de Graça',
          color: 'bg-amber-100 text-amber-800 border-amber-200'
        };
      case 'redemption':
        return {
          label: 'Em Resgate',
          color: 'bg-red-100 text-red-800 border-red-200'
        };
      case 'auction':
        return {
          label: 'Em Leilão',
          color: 'bg-purple-100 text-purple-800 border-purple-200'
        };
      case 'parked':
        return {
          label: 'Estacionado',
          color: 'bg-blue-100 text-blue-800 border-blue-200'
        };
      case 'unpaid_hold':
        return {
          label: 'Suspenso',
          color: 'bg-red-100 text-red-800 border-red-200'
        };
      case 'dispute_hold':
        return {
          label: 'Em Disputa',
          color: 'bg-orange-100 text-orange-800 border-orange-200'
        };
      default:
        return {
          label: status,
          color: 'bg-slate-100 text-slate-800 border-slate-200'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${config.color} ${className}`}
    >
      {config.label}
    </span>
  );
}
