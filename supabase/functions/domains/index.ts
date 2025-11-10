import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.75.0";
import { rateLimitMiddleware } from "../_shared/rateLimit.middleware.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

type DomainStatus = "UNAVAILABLE" | "AVAILABLE";

interface DomainCheckResult {
  status: DomainStatus;
  fqdn: string;
  isAvailable: boolean;
  isPremium: boolean;
  planRequired: "ELITE" | "STANDARD_OR_ELITE" | null;
  price: { monthly: number; currency: string; yearly?: number } | null;
  message: string;
  suggestions?: string[];
  userHasSubscription?: boolean;
  userPlanType?: string;
  showDirectPurchase?: boolean;
  isAdmin?: boolean;
}

function generateSuggestions(fqdn: string): string[] {
  const base = fqdn.replace('.com.rich', '');
  return [
    `${base}1.com.rich`,
    `${base}app.com.rich`,
    `${base}online.com.rich`,
    `${base}pro.com.rich`,
    `my${base}.com.rich`,
  ];
}

async function checkDomain(fqdn: string, userId?: string): Promise<DomainCheckResult> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const normalizedFqdn = fqdn.toLowerCase().trim();

  // Check if user is admin
  let isAdmin = false;
  let userHasSubscription = false;
  let userPlanType: string | null = null;

  console.log(`[DOMAIN CHECK] ========== ADMIN CHECK START ==========`);
  console.log(`[DOMAIN CHECK] userId:`, userId);
  console.log(`[DOMAIN CHECK] userId type:`, typeof userId);
  console.log(`[DOMAIN CHECK] userId is defined:`, userId !== undefined);
  console.log(`[DOMAIN CHECK] userId is truthy:`, !!userId);

  if (userId) {
    console.log(`[DOMAIN CHECK] 🔍 Checking admin status for userId: ${userId}`);

    // Check admin role first
    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .select('role, email, user_id')
      .eq('user_id', userId)
      .maybeSingle();

    console.log(`[DOMAIN CHECK] 📊 Customer query result:`, {
      customerData,
      customerError,
      roleValue: customerData?.role,
      roleType: typeof customerData?.role,
      email: customerData?.email,
      userId: customerData?.user_id,
      comparison: customerData?.role === 'admin',
      strictComparison: customerData?.role === 'admin'
    });

    // Normalize and compare role (trim whitespace, lowercase)
    const normalizedRole = customerData?.role?.toString().trim().toLowerCase();
    console.log(`[DOMAIN CHECK] 🔍 Normalized role: '${normalizedRole}' (original: '${customerData?.role}')`);

    if (normalizedRole === 'admin') {
      isAdmin = true;
      console.log(`[DOMAIN CHECK] ✅✅✅ User ${userId} is ADMIN - free registration enabled!`);
    } else {
      console.log(`[DOMAIN CHECK] ❌ User ${userId} is NOT admin, normalized role: '${normalizedRole}' (expected: 'admin')`);
    }

    // Check subscription only if not admin
    if (!isAdmin) {
      const { data: subscriptionData } = await supabase
        .from('subscriptions')
        .select(`
          status,
          subscription_plans (
            plan_type
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();

      if (subscriptionData && subscriptionData.subscription_plans) {
        userHasSubscription = true;
        userPlanType = subscriptionData.subscription_plans.plan_type;
      }
    }
  } else {
    console.log(`[DOMAIN CHECK] ❌ No userId provided - anonymous request`);
  }

  if (!normalizedFqdn.endsWith('.com.rich')) {
    throw new Error('Domínio inválido. Use apenas domínios .com.rich');
  }

  if (!/^[a-z0-9-]+\.com\.rich$/.test(normalizedFqdn)) {
    throw new Error('Formato de domínio inválido. Use apenas letras minúsculas, números e hífens.');
  }

  console.log(`[DOMAIN CHECK] Checking: ${normalizedFqdn}`);

  // Check for global protection (reserved keywords like "president" and translations)
  const { data: protectionCheck, error: protectionError } = await supabase
    .rpc('check_global_protection', { domain_name: normalizedFqdn });

  if (!protectionError && protectionCheck && protectionCheck.length > 0) {
    const protection = protectionCheck[0];
    if (protection.is_protected) {
      console.log(`[DOMAIN CHECK] BLOCKED: ${normalizedFqdn} - Global Protection`);
      return {
        status: "UNAVAILABLE",
        fqdn: normalizedFqdn,
        isAvailable: false,
        isPremium: false,
        planRequired: null,
        price: null,
        message: protection.message || "Este domínio faz parte de uma reserva global de segurança e não está disponível para registro público.",
        suggestions: generateSuggestions(normalizedFqdn)
      };
    }
  }

  // Check for club/clube protection (all language variants)
  const { data: clubValidation, error: clubError } = await supabase
    .rpc('validate_club_domain_registration', {
      p_domain_name: normalizedFqdn,
      p_password: null
    });

  if (!clubError && clubValidation) {
    if (!clubValidation.allowed && clubValidation.protected) {
      console.log(`[DOMAIN CHECK] BLOCKED: ${normalizedFqdn} - Club Protection (${clubValidation.message})`);
      return {
        status: "UNAVAILABLE",
        fqdn: normalizedFqdn,
        isAvailable: false,
        isPremium: false,
        planRequired: null,
        price: null,
        message: `🔒 ${clubValidation.message} Este domínio é protegido globalmente e reservado para The Rich Club em todos os idiomas.`,
        suggestions: generateSuggestions(normalizedFqdn)
      };
    }
  }

  const { data: catalogEntry, error: catalogError } = await supabase
    .from('domain_catalog')
    .select('fqdn, is_available, is_premium')
    .eq('fqdn', normalizedFqdn)
    .maybeSingle();

  if (catalogError) {
    console.error('[DOMAIN CHECK] Database error:', catalogError);
    throw new Error('Erro ao consultar catálogo de domínios');
  }

  if (catalogEntry && catalogEntry.is_available === false) {
    console.log(`[DOMAIN CHECK] UNAVAILABLE: ${normalizedFqdn} - Already registered`);
    return {
      status: "UNAVAILABLE",
      fqdn: catalogEntry.fqdn,
      isAvailable: false,
      isPremium: catalogEntry.is_premium || false,
      planRequired: null,
      price: null,
      message: "❌ Este domínio já foi registrado por outro usuário.",
      suggestions: generateSuggestions(catalogEntry.fqdn)
    };
  }

  let isPremium = false;

  if (catalogEntry && catalogEntry.is_available === true) {
    isPremium = catalogEntry.is_premium || false;
  } else {
    const { data: premiumEntry } = await supabase
      .from('premium_domains')
      .select('fqdn')
      .eq('fqdn', normalizedFqdn)
      .maybeSingle();

    isPremium = !!premiumEntry;
  }

  const { data: plans } = await supabase
    .from('subscription_plans')
    .select('plan_type, price_usd')
    .eq('is_active', true)
    .in('plan_type', ['standard', 'elite']);

  const standardPlan = plans?.find(p => p.plan_type === 'standard');
  const elitePlan = plans?.find(p => p.plan_type === 'elite');

  const standardPrice = standardPlan ? Number(standardPlan.price_usd) : 50;
  const elitePlanPrice = elitePlan ? Number(elitePlan.price_usd) : 70;

  if (isPremium) {
    console.log(`[DOMAIN CHECK] AVAILABLE (PREMIUM): ${normalizedFqdn}`);

    if (isAdmin) {
      return {
        status: "AVAILABLE",
        fqdn: normalizedFqdn,
        isAvailable: true,
        isPremium: true,
        planRequired: null,
        price: {
          monthly: 0,
          currency: "USD",
          yearly: 0
        },
        message: `👑 Domínio Premium disponível.\nComo ADMIN, você pode registrar gratuitamente com licença vitalícia.`,
        isAdmin: true,
        showDirectPurchase: true
      };
    }

    if (userHasSubscription && userPlanType === 'elite') {
      return {
        status: "AVAILABLE",
        fqdn: normalizedFqdn,
        isAvailable: true,
        isPremium: true,
        planRequired: "ELITE",
        price: null,
        message: `💎 Domínio Premium disponível.\nSolicite um orçamento personalizado para este domínio exclusivo.`,
        userHasSubscription: true,
        userPlanType: 'elite',
        showDirectPurchase: true,
        isAdmin: false
      };
    } else if (userHasSubscription && userPlanType === 'standard') {
      return {
        status: "AVAILABLE",
        fqdn: normalizedFqdn,
        isAvailable: true,
        isPremium: true,
        planRequired: "ELITE",
        price: null,
        message: `💎 Domínio Premium — disponível apenas para o plano Elite.\nFaça upgrade para acessar domínios premium.`,
        userHasSubscription: true,
        userPlanType: 'standard',
        showDirectPurchase: false,
        isAdmin: false
      };
    } else {
      return {
        status: "AVAILABLE",
        fqdn: normalizedFqdn,
        isAvailable: true,
        isPremium: true,
        planRequired: "ELITE",
        price: null,
        message: `💎 Domínio Premium — disponível apenas para o plano Elite (US$ ${elitePlanPrice}/mês).`,
        userHasSubscription: false,
        showDirectPurchase: false,
        isAdmin: false
      };
    }
  } else {
    console.log(`[DOMAIN CHECK] AVAILABLE (STANDARD): ${normalizedFqdn}`);

    if (isAdmin) {
      return {
        status: "AVAILABLE",
        fqdn: normalizedFqdn,
        isAvailable: true,
        isPremium: false,
        planRequired: null,
        price: {
          monthly: 0,
          currency: "USD",
          yearly: 0
        },
        message: `✅ Domínio disponível para registro.\nComo ADMIN, você pode registrar gratuitamente com licença vitalícia.`,
        isAdmin: true,
        showDirectPurchase: true
      };
    }

    if (userHasSubscription) {
      return {
        status: "AVAILABLE",
        fqdn: normalizedFqdn,
        isAvailable: true,
        isPremium: false,
        planRequired: "STANDARD_OR_ELITE",
        price: {
          monthly: standardPrice,
          currency: "USD",
          yearly: 100
        },
        message: `✅ Domínio disponível para registro.\nAdicione este domínio por US$ 100/ano.`,
        userHasSubscription: true,
        userPlanType: userPlanType,
        showDirectPurchase: true,
        isAdmin: false
      };
    } else {
      return {
        status: "AVAILABLE",
        fqdn: normalizedFqdn,
        isAvailable: true,
        isPremium: false,
        planRequired: "STANDARD_OR_ELITE",
        price: {
          monthly: standardPrice,
          currency: "USD"
        },
        message: `✅ Domínio disponível para registro.\nPara registrar este domínio, escolha um dos nossos planos de licenciamento.`,
        userHasSubscription: false,
        showDirectPurchase: false,
        isAdmin: false
      };
    }
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  // Rate limiting
  const rateLimitResponse = await rateLimitMiddleware(req, 'POST:/domains');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const url = new URL(req.url);
    const requestBody = req.method === "POST" ? await req.json() : null;
    const action = requestBody?.action;

    let userId: string | undefined;
    const authHeader = req.headers.get('Authorization');
    console.log('[DOMAIN CHECK] Authorization header present:', !!authHeader);

    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const token = authHeader.replace('Bearer ', '');
        console.log('[DOMAIN CHECK] Token (first 20 chars):', token.substring(0, 20));

        const { data: { user }, error: userError } = await supabase.auth.getUser(token);

        console.log('[DOMAIN CHECK] getUser result:', {
          userId: user?.id,
          userEmail: user?.email,
          error: userError?.message
        });

        userId = user?.id;
      } catch (error) {
        console.error('[DOMAIN CHECK] ❌ Could not extract user ID from auth header:', error);
      }
    } else {
      console.log('[DOMAIN CHECK] ❌ No valid Authorization header');
    }

    if (action === "check" || url.pathname.includes("/check")) {
      const fqdn = requestBody?.fqdn || url.searchParams.get("fqdn");

      if (!fqdn) {
        return new Response(
          JSON.stringify({ error: "Parâmetro 'fqdn' é obrigatório" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const result = await checkDomain(fqdn, userId);

      return new Response(
        JSON.stringify(result),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Endpoint não encontrado. Use: POST {action: 'check', fqdn: 'dominio.com.rich'}" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[DOMAIN FUNCTION] Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Erro interno do servidor"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
