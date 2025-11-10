import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface PlanChangeRequest {
  userId: string;
  subscriptionId: string;
  newPlanId: string;
  reason?: string;
}

interface PlanChangeResponse {
  success: boolean;
  action: 'none' | 'suspended' | 'reactivated';
  message: string;
  domainsAffected?: any[];
  domainsSuspended?: number;
  domainsReactivated?: number;
  requiresConfirmation?: boolean;
  confirmationData?: {
    premiumDomains: Array<{
      fqdn: string;
      price_usd: number;
    }>;
    currentPlan: string;
    newPlan: string;
  };
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const body: PlanChangeRequest = await req.json();

    // Validate request
    if (!body.userId || !body.subscriptionId || !body.newPlanId) {
      throw new Error('Missing required fields: userId, subscriptionId, newPlanId');
    }

    // Verify user owns this subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*, plan:subscription_plans(*)')
      .eq('id', body.subscriptionId)
      .eq('user_id', body.userId)
      .single();

    if (subError || !subscription) {
      throw new Error('Subscription not found or access denied');
    }

    // Get new plan details
    const { data: newPlan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', body.newPlanId)
      .single();

    if (planError || !newPlan) {
      throw new Error('New plan not found');
    }

    const currentPlanType = subscription.plan.plan_type;
    const newPlanType = newPlan.plan_type;

    // Check if downgrading from Elite to Prime (standard)
    const isDowngrade = currentPlanType === 'elite' && newPlanType === 'standard';

    if (isDowngrade) {
      // Get user's premium domains that would be affected
      const { data: premiumDomains, error: domainsError } = await supabase
        .rpc('get_user_premium_domains', { p_user_id: body.userId });

      if (domainsError) {
        console.error('Error fetching premium domains:', domainsError);
      }

      const activePremiumDomains = premiumDomains?.filter(
        (d: any) => d.current_status === 'active'
      ) || [];

      // If user has active premium domains, require confirmation
      if (activePremiumDomains.length > 0) {
        return new Response(
          JSON.stringify({
            success: false,
            requiresConfirmation: true,
            action: 'suspended',
            message: `Você possui ${activePremiumDomains.length} domínio(s) premium que serão suspensos ao fazer downgrade.`,
            confirmationData: {
              premiumDomains: activePremiumDomains.map((d: any) => ({
                fqdn: d.fqdn,
                price_usd: d.price_usd,
              })),
              currentPlan: currentPlanType,
              newPlan: newPlanType,
            },
          } as PlanChangeResponse),
          {
            status: 200,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }
    }

    // Update subscription plan (trigger will handle domain suspension)
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        plan_id: body.newPlanId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', body.subscriptionId);

    if (updateError) {
      throw updateError;
    }

    // Get the result from the trigger (check plan_change_log)
    const { data: changeLog, error: logError } = await supabase
      .from('plan_change_log')
      .select('*')
      .eq('subscription_id', body.subscriptionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (logError) {
      console.error('Error fetching change log:', logError);
    }

    const response: PlanChangeResponse = {
      success: true,
      action: isDowngrade ? 'suspended' : (newPlanType === 'elite' ? 'reactivated' : 'none'),
      message: isDowngrade
        ? `Plano alterado para ${newPlan.plan_name}. Domínios premium foram suspensos.`
        : newPlanType === 'elite'
        ? `Plano alterado para ${newPlan.plan_name}. Domínios premium foram reativados!`
        : `Plano alterado para ${newPlan.plan_name} com sucesso.`,
      domainsAffected: changeLog?.domains_affected || [],
      domainsSuspended: changeLog?.domains_suspended || 0,
      domainsReactivated: changeLog?.domains_reactivated || 0,
    };

    // TODO: Send email notification to user
    // This would integrate with your email service

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error handling plan change:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      {
        status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
