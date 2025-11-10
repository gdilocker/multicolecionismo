import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CaptureRequest {
  orderId: string;
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

  const startTime = Date.now();

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    // Authenticate user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error("[Mock Capture] Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request
    const body: CaptureRequest = await req.json();
    const { orderId } = body;

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: "Missing orderId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[Mock Capture] Processing order:", orderId);

    // Get pending order
    const { data: pendingOrder, error: fetchError } = await supabaseClient
      .from("pending_orders")
      .select("*")
      .eq("paypal_order_id", orderId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (fetchError || !pendingOrder) {
      console.error("[Mock Capture] Order not found:", fetchError);
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (pendingOrder.status === "completed") {
      return new Response(
        JSON.stringify({
          success: true,
          status: "ALREADY_COMPLETED",
          orderId,
          message: "Order already processed"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update pending order to completed
    await supabaseClient
      .from("pending_orders")
      .update({ status: "completed", updated_at: new Date().toISOString() })
      .eq("id", pendingOrder.id);

    console.log("[Mock Capture] Pending order marked as completed");

    // Use service role for remaining operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get or create customer
    let customerId: string;
    const { data: existingCustomer } = await supabaseAdmin
      .from("customers")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingCustomer) {
      customerId = existingCustomer.id;
      console.log("[Mock Capture] Using existing customer:", customerId);
    } else {
      const { data: newCustomer, error: customerError } = await supabaseAdmin
        .from("customers")
        .insert({
          user_id: user.id,
          email: user.email || "",
          role: "customer"
        })
        .select()
        .single();

      if (customerError || !newCustomer) {
        throw new Error(`Failed to create customer: ${customerError?.message}`);
      }

      customerId = newCustomer.id;
      console.log("[Mock Capture] Created new customer:", customerId);
    }

    // Extract plan info
    const planId = pendingOrder.contact_info?.plan_id;
    const planCode = pendingOrder.contact_info?.plan_code || "starter";
    const domainType = pendingOrder.contact_info?.domain_type || "personal";

    // Calculate total_cents (CRITICAL FIX: ensure > 0)
    const totalCents = pendingOrder.total_cents ||
                       Math.round((pendingOrder.amount || 25) * 100);

    if (totalCents <= 0) {
      throw new Error(`Invalid total_cents: ${totalCents}. Amount: ${pendingOrder.amount}`);
    }

    // 1. CREATE ORDER
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        customer_id: customerId,
        fqdn: pendingOrder.fqdn,
        years: 1,
        plan: planCode,
        plan_id: planId,
        total_cents: totalCents,
        status: "completed",
        paypal_order_id: orderId,
        payment_method: "mock"
      })
      .select()
      .single();

    if (orderError) {
      throw new Error(`Failed to create order: ${orderError.message}`);
    }

    console.log("[Mock Capture] ✅ Order created:", order.id, "total_cents:", totalCents);

    // 2. CREATE DOMAIN
    const { data: existingDomains } = await supabaseAdmin
      .from("domains")
      .select("display_order")
      .eq("customer_id", customerId)
      .order("display_order", { ascending: false })
      .limit(1);

    const nextDisplayOrder = existingDomains && existingDomains.length > 0
      ? (existingDomains[0].display_order || 0) + 1
      : 1;

    const { data: domain, error: domainError } = await supabaseAdmin
      .from("domains")
      .insert({
        customer_id: customerId,
        fqdn: pendingOrder.fqdn,
        registrar_status: "active",
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        display_order: nextDisplayOrder,
        domain_type: domainType,
        registrar_id: `MOCK-DOMAIN-${Date.now()}`
      })
      .select()
      .single();

    if (domainError) {
      throw new Error(`Failed to create domain: ${domainError.message}`);
    }

    console.log("[Mock Capture] ✅ Domain created:", domain.id, "status:", domain.registrar_status);

    // 3. CREATE SUBSCRIPTION (if plan selected)
    let subscription = null;
    if (planId) {
      const { data: sub, error: subError } = await supabaseAdmin
        .from("subscriptions")
        .insert({
          user_id: user.id,
          plan_id: planId,
          status: "active",
          is_trial: false,
          started_at: new Date().toISOString(),
          next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          payment_status: "paid",
          last_payment_date: new Date().toISOString(),
          paypal_subscription_id: `MOCK-SUB-${orderId}`
        })
        .select()
        .single();

      if (subError) {
        console.error("[Mock Capture] ⚠️ Subscription creation failed:", subError.message);
      } else {
        subscription = sub;
        console.log("[Mock Capture] ✅ Subscription created:", subscription.id);
      }
    }

    // 4. LOG TO RECONCILIATION (optional)
    await supabaseAdmin
      .from("payment_reconciliation_log")
      .insert({
        started_at: new Date(startTime).toISOString(),
        completed_at: new Date().toISOString(),
        orders_checked: 1,
        discrepancies_found: 0,
        discrepancies_resolved: 0,
        status: "completed",
        notes: `Mock payment processed: ${orderId}`
      });

    console.log("[Mock Capture] ✅ Reconciliation logged");

    const processingTime = Date.now() - startTime;

    // 5. RETURN SUCCESS
    return new Response(
      JSON.stringify({
        success: true,
        status: "COMPLETED",
        orderId,
        mock: true,
        processing_time_ms: processingTime,
        data: {
          order_id: order.id,
          domain_id: domain.id,
          subscription_id: subscription?.id || null,
          total_cents: totalCents,
          domain_status: domain.registrar_status,
          subscription_status: subscription?.status || null
        },
        message: "Mock payment captured successfully - all activations completed"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[Mock Capture] Error:", error);
    return new Response(
      JSON.stringify({
        error: "Capture failed",
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
