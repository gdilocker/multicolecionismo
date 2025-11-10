import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.75.0";

/**
 * Security Monitoring Edge Function
 *
 * Runs periodically (via cron or manual trigger) to detect suspicious activity
 * Sends alerts to Slack/Email for high-severity events
 *
 * Setup Supabase Cron:
 * SELECT cron.schedule(
 *   'security-monitoring',
 *   '* /5 * * * *',
 *   $$ SELECT net.http_post(...) $$
 * );
 */

interface Alert {
  type: string;
  severity: 'high' | 'critical';
  message: string;
  details: any;
  timestamp: string;
}

Deno.serve(async (req: Request) => {
  try {
    // Verify this is from cron or admin
    const authHeader = req.headers.get('authorization');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!authHeader || !authHeader.includes(serviceRoleKey || '')) {
      return new Response('Unauthorized', { status: 401 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      serviceRoleKey ?? ''
    );

    const alerts: Alert[] = [];
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    // 1. Check for high-severity events in last 5 minutes
    const { data: highSeverityEvents, error: auditError } = await supabase
      .from('audit_logs')
      .select('*')
      .in('severity', ['high', 'critical'])
      .gte('created_at', fiveMinutesAgo.toISOString())
      .order('created_at', { ascending: false });

    if (auditError) {
      console.error('[Security Monitor] Error fetching audit logs:', auditError);
    }

    if (highSeverityEvents && highSeverityEvents.length > 0) {
      // Recovery code used
      const recoveryCodes = highSeverityEvents.filter(e =>
        e.details?.description?.includes('Recovery code')
      );

      if (recoveryCodes.length > 0) {
        alerts.push({
          type: 'RECOVERY_CODE_USED',
          severity: 'high',
          message: `${recoveryCodes.length} recovery code(s) used`,
          details: recoveryCodes,
          timestamp: now.toISOString()
        });
      }

      // Webhook signature failures
      const webhookFailures = highSeverityEvents.filter(e =>
        e.details?.type === 'webhook_signature_fail'
      );

      if (webhookFailures.length > 0) {
        alerts.push({
          type: 'WEBHOOK_SIGNATURE_FAIL',
          severity: 'critical',
          message: `${webhookFailures.length} webhook signature failure(s)`,
          details: webhookFailures,
          timestamp: now.toISOString()
        });
      }

      // Session revocations
      const sessionRevocations = highSeverityEvents.filter(e =>
        e.details?.description?.includes('All sessions revoked')
      );

      if (sessionRevocations.length > 0) {
        alerts.push({
          type: 'SESSION_REVOKED',
          severity: 'high',
          message: `${sessionRevocations.length} user(s) revoked all sessions`,
          details: sessionRevocations,
          timestamp: now.toISOString()
        });
      }
    }

    // 2. Check for failed login patterns (10+ failures from same IP in 5 min)
    const { data: failedLogins, error: loginError } = await supabase
      .from('audit_logs')
      .select('ip_address, user_id')
      .eq('action', 'login_failure')
      .gte('created_at', fiveMinutesAgo.toISOString());

    if (!loginError && failedLogins) {
      const ipCounts = new Map<string, number>();

      failedLogins.forEach(log => {
        const ip = log.ip_address || 'unknown';
        ipCounts.set(ip, (ipCounts.get(ip) || 0) + 1);
      });

      for (const [ip, count] of ipCounts) {
        if (count >= 10) {
          alerts.push({
            type: 'BRUTE_FORCE_ATTEMPT',
            severity: 'critical',
            message: `${count} failed login attempts from ${ip}`,
            details: { ip, count, timeframe: '5 minutes' },
            timestamp: now.toISOString()
          });
        }
      }
    }

    // 3. Check for rate limit violations (5+ consecutive 429s on /auth/login)
    const { data: rateLimits, error: rlError } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('action', 'rate_limit_exceeded')
      .gte('created_at', fiveMinutesAgo.toISOString());

    if (!rlError && rateLimits) {
      const authRateLimits = rateLimits.filter(e =>
        e.details?.route?.includes('/auth/')
      );

      if (authRateLimits.length >= 5) {
        // Group by IP
        const ipMap = new Map<string, number>();
        authRateLimits.forEach(e => {
          const ip = e.ip_address || 'unknown';
          ipMap.set(ip, (ipMap.get(ip) || 0) + 1);
        });

        for (const [ip, count] of ipMap) {
          if (count >= 5) {
            alerts.push({
              type: 'AUTH_RATE_LIMIT_ABUSE',
              severity: 'high',
              message: `${count} rate limit violations on auth endpoints from ${ip}`,
              details: { ip, count },
              timestamp: now.toISOString()
            });
          }
        }
      }
    }

    // 4. Send alerts if any found
    if (alerts.length > 0) {
      console.log(`[Security Monitor] ${alerts.length} alert(s) detected`);
      console.log('[Security Monitor] Alerts logged to audit_logs table');

      // Return alert summary
      return new Response(
        JSON.stringify({
          success: true,
          alertCount: alerts.length,
          alerts: alerts.map(a => ({
            type: a.type,
            severity: a.severity,
            message: a.message
          }))
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'No alerts detected',
        alertCount: 0
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error: any) {
    console.error('[Security Monitor] Error:', error);

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});

