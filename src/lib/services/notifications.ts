import { supabase } from '../supabase';

export interface Notification {
  id: string;
  type: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  message: string;
  action_label?: string;
  action_url?: string;
  display_mode: 'dashboard' | 'card' | 'both' | 'overlay';
  status: 'new' | 'viewed' | 'resolved' | 'dismissed';
  domain_id?: string;
  domain_name?: string;
  created_at: string;
  metadata?: Record<string, any>;
}

export class NotificationService {
  /**
   * Get all notifications for current user
   */
  static async getNotifications(filters?: {
    status?: string;
    displayMode?: string;
    limit?: number;
  }): Promise<Notification[]> {
    try {
      const { data, error } = await supabase.rpc('get_my_notifications', {
        p_status: filters?.status || null,
        p_display_mode: filters?.displayMode || null,
        p_limit: filters?.limit || 50
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  /**
   * Get notifications for dashboard (overlay + dashboard mode)
   */
  static async getDashboardNotifications(): Promise<Notification[]> {
    const all = await this.getNotifications({ status: 'new' });
    return all.filter(n =>
      n.display_mode === 'dashboard' ||
      n.display_mode === 'both' ||
      n.display_mode === 'overlay'
    );
  }

  /**
   * Get notifications for specific domain card
   */
  static async getDomainNotifications(domainId: string): Promise<Notification[]> {
    const all = await this.getNotifications({ status: 'new' });
    return all.filter(n =>
      n.domain_id === domainId &&
      (n.display_mode === 'card' || n.display_mode === 'both')
    );
  }

  /**
   * Get critical overlay notifications
   */
  static async getCriticalNotifications(): Promise<Notification[]> {
    const all = await this.getNotifications({ status: 'new' });
    return all.filter(n =>
      n.priority === 'critical' &&
      (n.display_mode === 'overlay' || n.display_mode === 'both')
    );
  }

  /**
   * Mark notification as viewed
   */
  static async markAsViewed(notificationId: string): Promise<void> {
    try {
      await supabase
        .from('notifications')
        .update({
          status: 'viewed',
          viewed_at: new Date().toISOString()
        })
        .eq('id', notificationId);
    } catch (error) {
      console.error('Error marking notification as viewed:', error);
    }
  }

  /**
   * Mark notification as resolved
   */
  static async markAsResolved(notificationId: string): Promise<void> {
    try {
      await supabase
        .from('notifications')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolved_by: 'user'
        })
        .eq('id', notificationId);
    } catch (error) {
      console.error('Error marking notification as resolved:', error);
    }
  }

  /**
   * Dismiss notification
   */
  static async dismiss(notificationId: string): Promise<void> {
    try {
      await supabase
        .from('notifications')
        .update({
          status: 'dismissed'
        })
        .eq('id', notificationId);
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  }

  /**
   * Create notification from template
   */
  static async createFromTemplate(
    type: string,
    variables: Record<string, any>,
    domainId?: string,
    subscriptionId?: string
  ): Promise<string | null> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return null;

      const { data, error } = await supabase.rpc('create_notification_from_template', {
        p_user_id: user.user.id,
        p_type: type,
        p_domain_id: domainId || null,
        p_subscription_id: subscriptionId || null,
        p_variables: variables
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  }

  /**
   * Auto-resolve notifications of specific type
   */
  static async autoResolve(
    type: string,
    domainId?: string
  ): Promise<number> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return 0;

      const { data, error } = await supabase.rpc('auto_resolve_notification', {
        p_user_id: user.user.id,
        p_type: type,
        p_domain_id: domainId || null
      });

      if (error) throw error;
      return data || 0;
    } catch (error) {
      console.error('Error auto-resolving notifications:', error);
      return 0;
    }
  }

  /**
   * Subscribe to real-time notification updates
   */
  static subscribeToUpdates(
    userId: string,
    callback: (payload: any) => void
  ) {
    return supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe();
  }

  /**
   * Get notification color scheme
   */
  static getColorScheme(priority: string): {
    bg: string;
    border: string;
    text: string;
    icon: string;
  } {
    switch (priority) {
      case 'critical':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-900',
          icon: 'text-red-500'
        };
      case 'high':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          text: 'text-amber-900',
          icon: 'text-amber-500'
        };
      case 'medium':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-900',
          icon: 'text-blue-500'
        };
      case 'low':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-900',
          icon: 'text-green-500'
        };
      default:
        return {
          bg: 'bg-slate-50',
          border: 'border-slate-200',
          text: 'text-slate-900',
          icon: 'text-slate-500'
        };
    }
  }

  /**
   * Get priority icon
   */
  static getPriorityIcon(priority: string): string {
    switch (priority) {
      case 'critical':
        return '🔴';
      case 'high':
        return '🟡';
      case 'medium':
        return '🔵';
      case 'low':
        return '🟢';
      default:
        return 'ℹ️';
    }
  }
}
