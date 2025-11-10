import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface Domain {
  id: string;
  fqdn: string;
  user_id: string;
  registrar_status: string;
  next_renewal_at: string | null;
  grace_until: string | null;
  redemption_until: string | null;
  monthly_fee_usd: number;
  recovery_fee_usd: number;
}

interface NotificationTemplate {
  type: string;
  send_at_days: number;
  lifecycle_trigger: string;
  channels: string[];
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get all active domains that need communication checks
    const { data: domains, error: domainsError } = await supabase
      .from('domains')
      .select('*')
      .in('registrar_status', ['active', 'grace', 'redemption', 'registry_hold']);

    if (domainsError) throw domainsError;

    const results = {
      total_domains: domains?.length || 0,
      notifications_created: 0,
      notifications_sent: 0,
      errors: [] as string[],
    };

    // Get notification templates with scheduling config
    const { data: templates } = await supabase
      .from('notification_templates')
      .select('*')
      .not('send_at_days', 'is', null)
      .eq('is_active', true);

    const now = new Date();

    for (const domain of domains || []) {
      try {
        // Determine relevant date for this domain
        let referenceDate: Date | null = null;
        let lifecycleTrigger = '';

        if (domain.registrar_status === 'active' && domain.next_renewal_at) {
          referenceDate = new Date(domain.next_renewal_at);
          lifecycleTrigger = 'pre_expiration';
        } else if (domain.registrar_status === 'grace' && domain.grace_until) {
          referenceDate = new Date(domain.grace_until);
          lifecycleTrigger = 'grace';
        } else if (domain.registrar_status === 'redemption' && domain.redemption_until) {
          referenceDate = new Date(domain.redemption_until);
          lifecycleTrigger = 'redemption';
        }

        if (!referenceDate) continue;

        // Calculate days until/since reference date
        const daysUntil = Math.floor(
          (referenceDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Find matching templates for this domain's timeline
        const matchingTemplates = (templates || []).filter((template: any) => {
          return (
            template.lifecycle_trigger === lifecycleTrigger &&
            template.send_at_days === daysUntil
          );
        });

        for (const template of matchingTemplates) {
          // Check if notification already exists for today
          const { data: existing } = await supabase
            .from('notifications')
            .select('id')
            .eq('user_id', domain.user_id)
            .eq('domain_id', domain.id)
            .eq('type', template.type)
            .gte('created_at', new Date(now.setHours(0, 0, 0, 0)).toISOString())
            .maybeSingle();

          if (existing) {
            console.log(`Notification already sent for ${domain.fqdn} - ${template.type}`);
            continue;
          }

          // Create notification with variables
          const variables = {
            domain_name: domain.fqdn,
            domain_id: domain.id,
            days_remaining: Math.abs(daysUntil),
            days_until: Math.abs(daysUntil),
            recovery_fee: domain.recovery_fee_usd,
            monthly_fee: domain.monthly_fee_usd,
          };

          const { data: notificationId, error: createError } = await supabase
            .rpc('create_notification_from_template', {
              p_user_id: domain.user_id,
              p_type: template.type,
              p_domain_id: domain.id,
              p_subscription_id: null,
              p_variables: variables,
            });

          if (createError) {
            results.errors.push(`Failed to create notification for ${domain.fqdn}: ${createError.message}`);
            continue;
          }

          results.notifications_created++;

          // Send to configured channels
          for (const channel of template.channels) {
            try {
              const { data: logId, error: sendError } = await supabase
                .rpc('send_communication', {
                  p_user_id: domain.user_id,
                  p_channel: channel,
                  p_template_type: template.type,
                  p_variables: variables,
                  p_domain_id: domain.id,
                });

              if (sendError) {
                results.errors.push(`Failed to send ${channel} for ${domain.fqdn}: ${sendError.message}`);
              } else {
                results.notifications_sent++;
                console.log(`Sent ${channel} notification for ${domain.fqdn} - ${template.type}`);
              }
            } catch (channelError: any) {
              results.errors.push(`Channel error for ${domain.fqdn}: ${channelError.message}`);
            }
          }
        }
      } catch (domainError: any) {
        results.errors.push(`Error processing domain ${domain.fqdn}: ${domainError.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        ...results,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    console.error('Communication dispatcher error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
