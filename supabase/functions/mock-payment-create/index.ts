import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CreateOrderRequest {
  domain: string;
  price: number;
  planId: string;
  planCode: string;
  contactInfo: any;
  domainType: string;
  return_url?: string;
  cancel_url?: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

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

    // Authenticate user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error("[Mock Payment] Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body: CreateOrderRequest = await req.json();
    const { domain, price, planId, planCode, contactInfo, domainType, return_url } = body;

    if (!domain || !price || !planId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: domain, price, or planId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[Mock Payment] Creating order:", {
      user_id: user.id,
      domain,
      price,
      planCode,
      domainType
    });

    // Generate mock order ID
    const mockOrderId = `MOCK-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

    // Calculate total cents (ensure > 0)
    const totalCents = Math.round(price * 100);

    if (totalCents <= 0) {
      return new Response(
        JSON.stringify({ error: "Invalid price: must be greater than 0" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create pending order
    const { data: pendingOrder, error: orderError } = await supabaseClient
      .from("pending_orders")
      .insert({
        user_id: user.id,
        paypal_order_id: mockOrderId,
        fqdn: domain,
        amount: price,
        total_cents: totalCents,
        contact_info: {
          ...contactInfo,
          plan_id: planId,
          plan_code: planCode,
          domain_type: domainType || 'personal'
        },
        status: "pending",
        payment_method: "mock"
      })
      .select()
      .single();

    if (orderError) {
      console.error("[Mock Payment] Error creating pending order:", orderError);
      return new Response(
        JSON.stringify({ error: "Failed to create pending order", details: orderError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[Mock Payment] Pending order created:", pendingOrder.id);

    // Generate mock approve URL
    const mockApproveUrl = return_url
      ? `${return_url}?token=${mockOrderId}&mock=true`
      : `${req.headers.get("origin")}/paypal/return?token=${mockOrderId}&mock=true`;

    // Return successful response
    return new Response(
      JSON.stringify({
        success: true,
        orderId: mockOrderId,
        approveUrl: mockApproveUrl,
        amount: price,
        status: "CREATED",
        mock: true,
        message: "Mock payment order created - no real payment will be processed"
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("[Mock Payment] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
