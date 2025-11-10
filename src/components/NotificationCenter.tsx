import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, ExternalLink, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { NotificationService, Notification } from '../lib/services/notifications';
import { useNavigate } from 'react-router-dom';

export function NotificationCenter() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadNotifications();

      // Subscribe to real-time updates
      const subscription = NotificationService.subscribeToUpdates(
        user.id,
        handleRealtimeUpdate
      );

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user?.id]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await NotificationService.getDashboardNotifications();
      setNotifications(data);
      setUnreadCount(data.filter(n => n.status === 'new').length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRealtimeUpdate = (payload: any) => {
    console.log('Notification update:', payload);
    loadNotifications(); // Reload on any change
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as viewed
    if (notification.status === 'new') {
      await NotificationService.markAsViewed(notification.id);
    }

    // Navigate to action URL
    if (notification.action_url) {
      setIsOpen(false);
      navigate(notification.action_url);
    }
  };

  const handleDismiss = async (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    await NotificationService.dismiss(notificationId);
    loadNotifications();
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter(n => n.status === 'new');
    await Promise.all(
      unread.map(n => NotificationService.markAsViewed(n.id))
    );
    loadNotifications();
  };

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6 text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 max-h-[600px] flex flex-col"
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900">Notificações</h3>
                  {unreadCount > 0 && (
                    <p className="text-xs text-slate-500">
                      {unreadCount} não lida{unreadCount !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Marcar todas como lidas
                  </button>
                )}
              </div>

              {/* Notifications List */}
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="p-8 text-center text-slate-500">
                    Carregando...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">Nenhuma notificação</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {notifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onClick={() => handleNotificationClick(notification)}
                        onDismiss={(e) => handleDismiss(notification.id, e)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onClick: () => void;
  onDismiss: (e: React.MouseEvent) => void;
}

function NotificationItem({ notification, onClick, onDismiss }: NotificationItemProps) {
  const colors = NotificationService.getColorScheme(notification.priority);
  const isUnread = notification.status === 'new';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      onClick={onClick}
      className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors ${
        isUnread ? 'bg-blue-50/30' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Priority Indicator */}
        <div className={`flex-shrink-0 mt-1 ${colors.icon}`}>
          <span className="text-lg">
            {NotificationService.getPriorityIcon(notification.priority)}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className={`font-semibold text-sm ${isUnread ? 'text-slate-900' : 'text-slate-700'}`}>
              {notification.title}
            </h4>
            <button
              onClick={onDismiss}
              className="flex-shrink-0 p-1 hover:bg-slate-200 rounded transition-colors"
            >
              <X className="w-3 h-3 text-slate-400" />
            </button>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed mb-2">
            {notification.message}
          </p>

          {/* Action Button */}
          {notification.action_label && notification.action_url && (
            <button
              className={`inline-flex items-center gap-1 text-xs font-medium ${colors.text} hover:underline`}
            >
              {notification.action_label}
              <ExternalLink className="w-3 h-3" />
            </button>
          )}

          {/* Domain Name Tag */}
          {notification.domain_name && (
            <div className="mt-2">
              <span className="inline-block text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">
                {notification.domain_name}
              </span>
            </div>
          )}

          {/* Timestamp */}
          <p className="text-xs text-slate-400 mt-2">
            {new Date(notification.created_at).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
