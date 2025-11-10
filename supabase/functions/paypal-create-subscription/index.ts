import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.75.0";
import { rateLimitMiddleware } from "../_shared/rateLimit.middleware.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const PAYPAL_CLIENT_ID = Deno.env.get("PAYPAL_CLIENT_ID") || "";
const PAYPAL_CLIENT_SECRET = Deno.env.get("PAYPAL_CLIENT_SECRET") || "";
const PAYPAL_API_BASE = Deno.env.get("PAYPAL_MODE") === "live"
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";

async function getPayPalAccessToken(): Promise<string> {
  console.log(`[PayPal] Requesting token from: ${PAYPAL_API_BASE}`);

  const auth = btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`);

  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `Basic ${auth}`,
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[PayPal] Token request failed: ${response.status} - ${errorText}`);
    throw new Error(`Failed to get PayPal access token: ${response.status}`);
  }

  const data = await response.json();
  console.log(`[PayPal] Token obtained successfully`);
  return data.access_token;
}

async function createPayPalSubscription(params: {
  planId: string;
  userId: string;
  domain: string;
  returnUrl: string;
  cancelUrl: string;
}): Promise<{ subscriptionId: string; approveUrl: string }> {
  const accessToken = await getPayPalAccessToken();
  const { planId, userId, domain, returnUrl, cancelUrl } = params;

  const subscriptionPayload = {
    plan_id: planId,
    custom_id: `${userId}|${domain}`,
    application_context: {
      brand_name: ".com.rich",
      locale: "en-US",
      shipping_preference: "NO_SHIPPING",
      user_action: "SUBSCRIBE_NOW",
      payment_method: {
        payer_selected: "PAYPAL",
        payee_preferred: "IMMEDIATE_PAYMENT_REQUIRED",
      },
      return_url: returnUrl,
      cancel_url: cancelUrl,
    },
  };

  console.log(`[PayPal] Creating subscription for domain: ${domain}`);

  const response = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
    },
    body: JSON.stringify(subscriptionPayload),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error(`[PayPal] Subscription creation failed: ${response.status} - ${errorData}`);
    throw new Error(`Failed to create PayPal subscription: ${response.status} - ${errorData}`);
  }

  const subscriptionData = await response.json();
  console.log(`[PayPal] Subscription created successfully:`, subscriptionData.id);

  const approveLink = subscriptionData.links.find((link: any) => link.rel === "approve");

  if (!approveLink) {
    console.error(`[PayPal] No approve link found in response:`, subscriptionData);
    throw new Error("No approve link found in PayPal response");
  }

  console.log(`[PayPal] Approve URL: ${approveLink.href}`);

  return {
    subscriptionId: subscriptionData.id,
    approveUrl: approveLink.href,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const rateLimitResponse = await rateLimitMiddleware(req, 'POST:/paypal-create-subscription');
  if (rateLimitResponse) return rateLimitResponse;

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const {
      domain,
      planId,
      planCode,
      paypalPlanId,
      contactInfo,
      domainType,
      domainPrice,
      return_url,
      cancel_url
    } = body;

    if (!domain || !planId || !paypalPlanId || !domainPrice) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[PayPal Subscription] Request received for domain:", domain);
    console.log("[PayPal Subscription] Plan:", planCode);
    console.log("[PayPal Subscription] PayPal Plan ID:", paypalPlanId);

    const hasPayPalCredentials = PAYPAL_CLIENT_ID && PAYPAL_CLIENT_SECRET &&
                                  PAYPAL_CLIENT_ID.trim() !== "" &&
                                  PAYPAL_CLIENT_SECRET.trim() !== "";

    if (!hasPayPalCredentials) {
      console.log("[DEV MODE] PayPal credentials not configured, creating mock subscription");

      const mockSubscriptionId = `MOCK-SUB-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const mockApproveUrl = `${return_url}?subscription_id=${mockSubscriptionId}&ba_token=${mockSubscriptionId}`;

      const pendingOrderData = {
        user_id: user.id,
        paypal_order_id: mockSubscriptionId,
        fqdn: domain,
        amount: domainPrice,
        contact_info: {
          ...contactInfo,
          plan_id: planId,
          plan_code: planCode,
          domain_type: domainType || 'personal',
          is_subscription: true,
          paypal_plan_id: paypalPlanId
        },
        status: "pending",
      };

      await supabaseClient
        .from("pending_orders")
        .insert(pendingOrderData);

      console.log("[DEV MODE] Mock subscription order created successfully:", mockSubscriptionId);

      return new Response(
        JSON.stringify({
          subscriptionId: mockSubscriptionId,
          approveUrl: mockApproveUrl,
          devMode: true
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[PayPal] Calling createPayPalSubscription...");
    const result = await createPayPalSubscription({
      planId: paypalPlanId,
      userId: user.id,
      domain,
      returnUrl: return_url || "https://com.rich/paypal/return",
      cancelUrl: cancel_url || "https://com.rich/paypal/cancel",
    });

    const pendingOrderData = {
      user_id: user.id,
      paypal_order_id: result.subscriptionId,
      fqdn: domain,
      amount: domainPrice,
      contact_info: {
        ...contactInfo,
        plan_id: planId,
        plan_code: planCode,
        domain_type: domainType || 'personal',
        is_subscription: true,
        paypal_plan_id: paypalPlanId
      },
      status: "pending",
    };

    await supabaseClient
      .from("pending_orders")
      .insert(pendingOrderData);

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error creating PayPal subscription:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
