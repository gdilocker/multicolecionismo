import { supabase } from '../supabase';
import { maskSensitiveData } from './sanitize';

/**
 * Security audit logging utilities
 * Tracks security-relevant events for monitoring and forensics
 */

export type AuditAction =
  | 'login_success'
  | 'login_failure'
  | 'logout'
  | 'password_reset_request'
  | 'password_changed'
  | 'email_changed'
  | 'account_created'
  | 'account_deleted'
  | 'domain_registered'
  | 'domain_transferred'
  | 'domain_deleted'
  | 'payment_initiated'
  | 'payment_completed'
  | 'payment_failed'
  | 'profile_updated'
  | 'profile_made_public'
  | 'profile_made_private'
  | 'suspicious_activity'
  | 'rate_limit_exceeded'
  | 'unauthorized_access_attempt'
  | 'privilege_escalation_attempt'
  | 'data_export'
  | 'settings_changed'
  | 'api_key_generated'
  | 'api_key_revoked'
  | 'admin_action';

export type AuditSeverity = 'low' | 'medium' | 'high' | 'critical';

interface AuditLogEntry {
  user_id?: string;
  action: AuditAction;
  severity: AuditSeverity;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  resource_type?: string;
  resource_id?: string;
  success: boolean;
}

/**
 * Log a security-relevant event to audit_logs
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    // Mask sensitive data in details
    const sanitizedDetails = entry.details ? maskSensitiveFields(entry.details) : null;

    // Get IP address from request if available
    const ip_address = entry.ip_address || await getClientIp();

    // Get user agent from browser
    const user_agent = entry.user_agent || navigator.userAgent;

    await supabase.from('audit_logs').insert({
      user_id: entry.user_id || null,
      action: entry.action,
      severity: entry.severity,
      details: sanitizedDetails,
      ip_address,
      user_agent,
      resource_type: entry.resource_type || null,
      resource_id: entry.resource_id || null,
      success: entry.success
    });
  } catch (error) {
    // Don't throw - audit logging should never break the application
    console.error('[Audit] Failed to log event:', error);
  }
}

/**
 * Log authentication events
 */
export async function logAuthEvent(
  action: 'login_success' | 'login_failure' | 'logout' | 'password_reset_request',
  userId?: string,
  details?: Record<string, any>
): Promise<void> {
  const severity: AuditSeverity = action === 'login_failure' ? 'medium' : 'low';

  await logAuditEvent({
    user_id: userId,
    action,
    severity,
    details,
    success: action !== 'login_failure'
  });
}

/**
 * Log suspicious activity
 */
export async function logSuspiciousActivity(
  description: string,
  userId?: string,
  details?: Record<string, any>
): Promise<void> {
  await logAuditEvent({
    user_id: userId,
    action: 'suspicious_activity',
    severity: 'high',
    details: {
      description,
      ...details
    },
    success: false
  });
}

/**
 * Log payment events
 */
export async function logPaymentEvent(
  action: 'payment_initiated' | 'payment_completed' | 'payment_failed',
  userId: string,
  amount: number,
  currency: string,
  orderId?: string
): Promise<void> {
  const severity: AuditSeverity = action === 'payment_failed' ? 'medium' : 'low';

  await logAuditEvent({
    user_id: userId,
    action,
    severity,
    details: {
      amount,
      currency,
      order_id: orderId
    },
    resource_type: 'order',
    resource_id: orderId,
    success: action === 'payment_completed'
  });
}

/**
 * Log domain operations
 */
export async function logDomainEvent(
  action: 'domain_registered' | 'domain_transferred' | 'domain_deleted',
  userId: string,
  domainId: string,
  domainName: string
): Promise<void> {
  await logAuditEvent({
    user_id: userId,
    action,
    severity: action === 'domain_deleted' ? 'medium' : 'low',
    details: {
      domain_name: domainName
    },
    resource_type: 'domain',
    resource_id: domainId,
    success: true
  });
}

/**
 * Log profile changes
 */
export async function logProfileEvent(
  action: 'profile_updated' | 'profile_made_public' | 'profile_made_private',
  userId: string,
  profileId: string,
  changes?: Record<string, any>
): Promise<void> {
  await logAuditEvent({
    user_id: userId,
    action,
    severity: 'low',
    details: changes,
    resource_type: 'profile',
    resource_id: profileId,
    success: true
  });
}

/**
 * Log rate limit violations
 */
export async function logRateLimitExceeded(
  endpoint: string,
  userId?: string,
  ip?: string
): Promise<void> {
  await logAuditEvent({
    user_id: userId,
    action: 'rate_limit_exceeded',
    severity: 'medium',
    details: {
      endpoint,
      ip
    },
    ip_address: ip,
    success: false
  });
}

/**
 * Log unauthorized access attempts
 */
export async function logUnauthorizedAccess(
  resource: string,
  userId?: string,
  attemptedAction?: string
): Promise<void> {
  await logAuditEvent({
    user_id: userId,
    action: 'unauthorized_access_attempt',
    severity: 'high',
    details: {
      resource,
      attempted_action: attemptedAction
    },
    success: false
  });
}

/**
 * Log admin actions
 */
export async function logAdminAction(
  adminId: string,
  description: string,
  details?: Record<string, any>
): Promise<void> {
  await logAuditEvent({
    user_id: adminId,
    action: 'admin_action',
    severity: 'medium',
    details: {
      description,
      ...details
    },
    success: true
  });
}

/**
 * Get client IP address
 */
async function getClientIp(): Promise<string | undefined> {
  try {
    // In a real application, this would come from the server
    // For now, we'll return undefined and let the edge function handle it
    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * Mask sensitive fields in audit log details
 */
function maskSensitiveFields(details: Record<string, any>): Record<string, any> {
  const sensitiveKeys = [
    'password',
    'token',
    'secret',
    'api_key',
    'access_token',
    'refresh_token',
    'credit_card',
    'cvv',
    'ssn',
    'social_security'
  ];

  const masked: Record<string, any> = {};

  for (const [key, value] of Object.entries(details)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = sensitiveKeys.some(sk => lowerKey.includes(sk));

    if (isSensitive && typeof value === 'string') {
      masked[key] = maskSensitiveData(value);
    } else if (typeof value === 'object' && value !== null) {
      masked[key] = maskSensitiveFields(value);
    } else {
      masked[key] = value;
    }
  }

  return masked;
}

/**
 * Query audit logs with filters
 */
export async function queryAuditLogs(filters: {
  user_id?: string;
  action?: AuditAction;
  severity?: AuditSeverity;
  start_date?: Date;
  end_date?: Date;
  limit?: number;
}): Promise<any[]> {
  try {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters.user_id) {
      query = query.eq('user_id', filters.user_id);
    }

    if (filters.action) {
      query = query.eq('action', filters.action);
    }

    if (filters.severity) {
      query = query.eq('severity', filters.severity);
    }

    if (filters.start_date) {
      query = query.gte('created_at', filters.start_date.toISOString());
    }

    if (filters.end_date) {
      query = query.lte('created_at', filters.end_date.toISOString());
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    } else {
      query = query.limit(100); // Default limit
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[Audit] Failed to query logs:', error);
    return [];
  }
}

/**
 * Get security summary for a user
 */
export async function getUserSecuritySummary(userId: string): Promise<{
  total_logins: number;
  failed_logins: number;
  last_login: string | null;
  suspicious_activities: number;
  recent_actions: any[];
}> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [logins, failedLogins, suspicious, recent] = await Promise.all([
      queryAuditLogs({
        user_id: userId,
        action: 'login_success',
        start_date: thirtyDaysAgo
      }),
      queryAuditLogs({
        user_id: userId,
        action: 'login_failure',
        start_date: thirtyDaysAgo
      }),
      queryAuditLogs({
        user_id: userId,
        action: 'suspicious_activity',
        start_date: thirtyDaysAgo
      }),
      queryAuditLogs({
        user_id: userId,
        limit: 10
      })
    ]);

    return {
      total_logins: logins.length,
      failed_logins: failedLogins.length,
      last_login: logins[0]?.created_at || null,
      suspicious_activities: suspicious.length,
      recent_actions: recent
    };
  } catch (error) {
    console.error('[Audit] Failed to get security summary:', error);
    return {
      total_logins: 0,
      failed_logins: 0,
      last_login: null,
      suspicious_activities: 0,
      recent_actions: []
    };
  }
}
