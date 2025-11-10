import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.75.0";
import { rateLimitMiddleware, getRateLimitHeadersForResponse } from "../_shared/rateLimit.middleware.ts";

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
  console.log(`[PayPal] Client ID exists: ${!!PAYPAL_CLIENT_ID}`);

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
    console.error(`[PayPal] Token request failed: ${response.status}`);
    throw new Error(`Failed to get PayPal access token: ${response.status}`);
  }

  const data = await response.json();
  console.log(`[PayPal] Token obtained successfully`);
  return data.access_token;
}

async function createPayPalOrder(params: {
  domain: string;
  price: number;
  planCode: string;
  userId: string;
  returnUrl: string;
  cancelUrl: string;
}): Promise<{ orderId: string; approveUrl: string }> {
  const accessToken = await getPayPalAccessToken();
  const { domain, price, planCode, userId, returnUrl, cancelUrl } = params;

  const orderPayload = {
    intent: "CAPTURE",
    purchase_units: [
      {
        reference_id: `${userId}|${domain}|${planCode}`,
        custom_id: `${userId}|${domain}|${planCode}`,
        description: `Registro do domínio ${domain} - Plano ${planCode}`,
        amount: {
          currency_code: "USD",
          value: price.toFixed(2),
          breakdown: {
            item_total: {
              currency_code: "USD",
              value: price.toFixed(2),
            },
          },
        },
        items: [
          {
            name: domain,
            description: `Domínio .email - Plano ${planCode}`,
            unit_amount: {
              currency_code: "USD",
              value: price.toFixed(2),
            },
            quantity: "1",
            category: "DIGITAL_GOODS",
          },
        ],
      },
    ],
    application_context: {
      brand_name: ".com.rich",
      landing_page: "NO_PREFERENCE",
      user_action: "PAY_NOW",
      return_url: returnUrl,
      cancel_url: cancelUrl,
    },
  };

  console.log(`[PayPal] Creating order for domain: ${domain}`);

  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
    },
    body: JSON.stringify(orderPayload),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error(`[PayPal] Order creation failed: ${response.status} - ${errorData}`);
    throw new Error(`Failed to create PayPal order: ${response.status} - ${errorData}`);
  }

  const orderData = await response.json();
  console.log(`[PayPal] Order created successfully:`, orderData.id);

  const approveLink = orderData.links.find((link: any) => link.rel === "approve");

  if (!approveLink) {
    console.error(`[PayPal] No approve link found in response:`, orderData);
    throw new Error("No approve link found in PayPal response");
  }

  console.log(`[PayPal] Approve URL: ${approveLink.href}`);

  return {
    orderId: orderData.id,
    approveUrl: approveLink.href,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  // Apply rate limiting
  const rateLimitResponse = await rateLimitMiddleware(req, 'POST:/paypal-create-order');
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
    const { domain, price, planId, planCode, contactInfo, domainType, return_url, cancel_url } = body;

    if (!domain || !price || !planId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[PayPal] Request received for domain:", domain);
    console.log("[PayPal] Price:", price);
    console.log("[PayPal] Plan:", planCode);
    console.log("[PayPal] Domain Type:", domainType || 'personal');

    const hasPayPalCredentials = PAYPAL_CLIENT_ID && PAYPAL_CLIENT_SECRET &&
                                  PAYPAL_CLIENT_ID.trim() !== "" &&
                                  PAYPAL_CLIENT_SECRET.trim() !== "";

    if (!hasPayPalCredentials) {
      console.log("[DEV MODE] PayPal credentials not configured, creating mock order");

      const mockOrderId = `MOCK-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const mockApproveUrl = `${return_url}?token=${mockOrderId}`;

      const orderData = {
        user_id: user.id,
        paypal_order_id: mockOrderId,
        fqdn: domain,
        amount: price,
        contact_info: { ...contactInfo, plan_id: planId, plan_code: planCode, domain_type: domainType || 'personal' },
        status: "pending",
      };

      await supabaseClient
        .from("pending_orders")
        .insert(orderData);

      console.log("[DEV MODE] Mock order created successfully:", mockOrderId);

      return new Response(
        JSON.stringify({
          orderId: mockOrderId,
          approveUrl: mockApproveUrl,
          devMode: true
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[PayPal] Calling createPayPalOrder...");
    const result = await createPayPalOrder({
      domain,
      price,
      planCode: planCode || 'basic',
      userId: user.id,
      returnUrl: return_url || "https://com.rich/paypal/return",
      cancelUrl: cancel_url || "https://com.rich/paypal/cancel",
    });

    const orderData = {
      user_id: user.id,
      paypal_order_id: result.orderId,
      fqdn: domain,
      amount: price,
      contact_info: { ...contactInfo, plan_id: planId, plan_code: planCode, domain_type: domainType || 'personal' },
      status: "pending",
    };

    await supabaseClient
      .from("pending_orders")
      .insert(orderData);

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error creating PayPal order:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});