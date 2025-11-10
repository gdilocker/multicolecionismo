import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.75.0";

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

async function activateDomain(fqdn: string, domainId: string, supabase: any): Promise<void> {
  try {
    console.log(`[Activation] Activating domain ${fqdn} (ID: ${domainId})`);

    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

    const { data: updateData, error: updateError } = await supabase
      .from("domains")
      .update({
        registrar_status: "active",
        expires_at: expiresAt,
      })
      .eq("id", domainId)
      .select();

    if (updateError) {
      console.error(`[Activation] Database update error for ${fqdn}:`, updateError);
      throw updateError;
    }

    console.log(`[Activation] ✅ Domain ${fqdn} activated successfully`);
    console.log(`[Activation] Expires at: ${expiresAt}`);
  } catch (error) {
    console.error(`[Activation] ❌ Exception during activation of ${fqdn}:`, error);

    try {
      const { error: updateError } = await supabase
        .from("domains")
        .update({
          registrar_status: "failed",
        })
        .eq("id", domainId);

      if (updateError) {
        console.error(`[Activation] Database update error (exception) for ${fqdn}:`, updateError);
      }
    } catch (dbError) {
      console.error(`[Activation] Failed to update database after exception:`, dbError);
    }
  }
}

async function handlePaymentCapture(event: any, supabase: any) {
  const orderId = event.resource?.id || event.resource?.supplementary_data?.related_ids?.order_id;

  console.log(`[PayPal Webhook] Processing payment capture for order: ${orderId}`);

  if (!orderId) {
    console.error("[PayPal Webhook] ❌ Missing order ID in payment");
    return { success: false, error: "Missing order ID" };
  }

  try {
    console.log(`[PayPal Webhook] Looking up pending order: ${orderId}`);

    const { data: pendingOrder, error: pendingError } = await supabase
      .from("pending_orders")
      .select("*")
      .eq("paypal_order_id", orderId)
      .maybeSingle();

    if (pendingError) throw pendingError;

    if (!pendingOrder) {
      console.error(`[PayPal Webhook] ❌ Pending order not found: ${orderId}`);
      return { success: false, error: "Pending order not found" };
    }

    console.log(`[PayPal Webhook] Found pending order for domain: ${pendingOrder.fqdn}`);

    await supabase
      .from("pending_orders")
      .update({ status: "completed" })
      .eq("id", pendingOrder.id);

    console.log(`[PayPal Webhook] Pending order marked as completed`);

    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("user_id", pendingOrder.user_id)
      .maybeSingle();

    if (!customer) {
      console.error(`[PayPal Webhook] ❌ Customer not found for user: ${pendingOrder.user_id}`);
      return { success: false, error: "Customer not found" };
    }

    console.log(`[PayPal Webhook] Found customer: ${customer.id}`);

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_id: customer.id,
        fqdn: pendingOrder.fqdn,
        years: 1,
        plan: "basic",
        total_cents: Math.round(pendingOrder.amount * 100),
        status: "completed",
      })
      .select()
      .single();

    if (orderError) {
      console.error(`[PayPal Webhook] ❌ Failed to create order:`, orderError);
      throw orderError;
    }

    console.log(`[PayPal Webhook] Order created: ${order.id}`);

    const domainType = pendingOrder.contact_info?.domain_type || 'personal';

    const { data: domain, error: domainError } = await supabase
      .from("domains")
      .insert({
        customer_id: customer.id,
        fqdn: pendingOrder.fqdn,
        registrar_status: "pending",
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        domain_type: domainType,
      })
      .select()
      .single();

    if (domainError) {
      console.error(`[PayPal Webhook] ❌ Failed to create domain:`, domainError);
      throw domainError;
    }

    console.log(`[PayPal Webhook] Domain created: ${domain.id} (${pendingOrder.fqdn})`);
    console.log(`[PayPal Webhook] ✅ Payment processed successfully for ${pendingOrder.fqdn}`);

    console.log(`[PayPal Webhook] Activating domain...`);
    await activateDomain(pendingOrder.fqdn, domain.id, supabase);

    console.log(`[PayPal Webhook] 🎉 Complete! Order: ${order.id}, Domain: ${domain.id}`);
    return { success: true, order_id: order.id, domain_id: domain.id };
  } catch (error) {
    console.error(`[PayPal Webhook] ❌ Error handling payment capture:`, error);
    return { success: false, error: String(error) };
  }
}

async function handleSubscriptionActivated(event: any, supabase: any) {
  const subscription = event.resource;
  const customId = subscription.custom_id;

  console.log(`[Subscription Activated] Processing subscription: ${subscription.id}`);
  console.log(`[Subscription Activated] Custom ID: ${customId}`);

  if (!customId) {
    console.error("[Subscription Activated] ❌ Missing custom_id in subscription");
    return { success: false, error: "Missing custom_id" };
  }

  const [userId, domain] = customId.split("|");

  if (!userId || !domain) {
    console.error("[Subscription Activated] ❌ Invalid custom_id format");
    return { success: false, error: "Invalid custom_id" };
  }

  try {
    // Find pending order
    const { data: pendingOrder, error: pendingError } = await supabase
      .from("pending_orders")
      .select("*")
      .eq("paypal_order_id", subscription.id)
      .maybeSingle();

    if (pendingError) throw pendingError;

    if (!pendingOrder) {
      console.error(`[Subscription Activated] ❌ Pending order not found for subscription: ${subscription.id}`);
      return { success: false, error: "Pending order not found" };
    }

    console.log(`[Subscription Activated] Found pending order for domain: ${pendingOrder.fqdn}`);

    // Mark pending order as completed
    await supabase
      .from("pending_orders")
      .update({ status: "completed" })
      .eq("id", pendingOrder.id);

    // Get or create customer
    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    let customerId = customer?.id;

    if (!customerId) {
      const { data: userData } = await supabase.auth.admin.getUserById(userId);
      const { data: newCustomer } = await supabase
        .from("customers")
        .insert({
          user_id: userId,
          email: userData?.user?.email || "",
        })
        .select()
        .single();

      customerId = newCustomer?.id;
    }

    if (!customerId) {
      console.error(`[Subscription Activated] ❌ Could not create/find customer for user: ${userId}`);
      return { success: false, error: "Customer not found" };
    }

    // Create order record
    const planId = pendingOrder.contact_info?.plan_id;
    const planCode = pendingOrder.contact_info?.plan_code || "prime";
    const domainType = pendingOrder.contact_info?.domain_type || 'personal';

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_id: customerId,
        fqdn: pendingOrder.fqdn,
        years: 1,
        plan: planCode,
        plan_id: planId,
        total_cents: Math.round(pendingOrder.amount * 100),
        status: "completed",
        paypal_order_id: subscription.id,
      })
      .select()
      .single();

    if (orderError) {
      console.error(`[Subscription Activated] ❌ Failed to create order:`, orderError);
      throw orderError;
    }

    console.log(`[Subscription Activated] Order created: ${order.id}`);

    // Get display order for new domain
    const { data: existingDomains } = await supabase
      .from("domains")
      .select("display_order")
      .eq("customer_id", customerId)
      .order("display_order", { ascending: false })
      .limit(1);

    const nextDisplayOrder = existingDomains && existingDomains.length > 0
      ? (existingDomains[0].display_order || 0) + 1
      : 1;

    // Create domain
    const { data: domainRecord, error: domainError } = await supabase
      .from("domains")
      .insert({
        customer_id: customerId,
        fqdn: pendingOrder.fqdn,
        registrar_status: "active",
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        display_order: nextDisplayOrder,
        domain_type: domainType,
      })
      .select()
      .single();

    if (domainError) {
      console.error(`[Subscription Activated] ❌ Failed to create domain:`, domainError);
      throw domainError;
    }

    console.log(`[Subscription Activated] Domain created: ${domainRecord.id} (${pendingOrder.fqdn})`);

    // Create subscription record
    const nextBillingTime = subscription.billing_info?.next_billing_time;
    const now = new Date().toISOString();

    const { data: subscriptionRecord, error: subscriptionError } = await supabase
      .from("subscriptions")
      .insert({
        user_id: userId,
        plan_id: planId,
        paypal_subscription_id: subscription.id,
        status: 'active',
        started_at: subscription.start_time || now,
        next_billing_date: nextBillingTime,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (subscriptionError) {
      console.error(`[Subscription Activated] ⚠️ Failed to create subscription record:`, subscriptionError);
      // Don't fail the whole process if subscription record creation fails
    } else {
      console.log(`[Subscription Activated] Subscription record created: ${subscriptionRecord.id}`);
    }

    console.log(`[Subscription Activated] ✅ Complete! Order: ${order.id}, Domain: ${domainRecord.id}, Subscription: ${subscriptionRecord?.id}`);
    return { success: true, order_id: order.id, domain_id: domainRecord.id, subscription_id: subscriptionRecord?.id };
  } catch (error) {
    console.error("[Subscription Activated] ❌ Error handling subscription activation:", error);
    return { success: false, error: String(error) };
  }
}

async function handleSubscriptionPayment(event: any, supabase: any) {
  const sale = event.resource;
  const billingAgreementId = sale.billing_agreement_id;

  console.log(`[Subscription Payment] Processing payment for subscription: ${billingAgreementId}`);

  if (!billingAgreementId) {
    console.error("[Subscription Payment] ❌ Missing billing_agreement_id");
    return { success: false, error: "Missing billing_agreement_id" };
  }

  try {
    const now = new Date().toISOString();

    const { data: subscription, error: fetchError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("paypal_subscription_id", billingAgreementId)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (!subscription) {
      console.error(`[Subscription Payment] ⚠️ Subscription not found: ${billingAgreementId}`);
      return { success: false, error: "Subscription not found" };
    }

    // Update subscription with successful payment
    await supabase
      .from("subscriptions")
      .update({
        status: 'active',
        updated_at: now,
      })
      .eq("paypal_subscription_id", billingAgreementId);

    console.log(`[Subscription Payment] ✅ Subscription payment processed successfully`);
    return { success: true };
  } catch (error) {
    console.error("[Subscription Payment] ❌ Error handling subscription payment:", error);
    return { success: false, error: String(error) };
  }
}

async function handlePaymentFailed(event: any, supabase: any) {
  const subscription = event.resource;

  console.log(`[Payment Failed] Processing failed payment for subscription: ${subscription.id}`);

  try {
    const now = new Date().toISOString();

    await supabase
      .from("subscriptions")
      .update({
        status: 'past_due',
        updated_at: now,
      })
      .eq("paypal_subscription_id", subscription.id);

    console.log(`[Payment Failed] ⚠️ Subscription marked as past_due`);
    return { success: true };
  } catch (error) {
    console.error("[Payment Failed] ❌ Error handling payment failed:", error);
    return { success: false, error: String(error) };
  }
}

async function handleSubscriptionCancelled(event: any, supabase: any) {
  const subscription = event.resource;

  console.log(`[Subscription Cancelled] Processing cancellation for subscription: ${subscription.id}`);

  try {
    const now = new Date().toISOString();

    await supabase
      .from("subscriptions")
      .update({
        status: "cancelled",
        cancelled_at: now,
        updated_at: now,
      })
      .eq("paypal_subscription_id", subscription.id);

    console.log(`[Subscription Cancelled] ✅ Subscription marked as cancelled`);
    return { success: true };
  } catch (error) {
    console.error("[Subscription Cancelled] ❌ Error handling subscription cancelled:", error);
    return { success: false, error: String(error) };
  }
}

Deno.serve(async (req: Request) => {
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
    const body = await req.text();
    const event = JSON.parse(body);

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const eventId = event.id;
    if (eventId) {
      const { data: existingEvent } = await supabaseClient
        .from("webhook_events")
        .select("id")
        .eq("provider", "paypal")
        .eq("external_id", eventId)
        .maybeSingle();

      if (existingEvent) {
        console.log(`[PayPal Webhook] Event ${eventId} already processed, skipping`);
        return new Response(
          JSON.stringify({ success: true, message: "Event already processed" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    let result: any;

    switch (event.event_type) {
      case "PAYMENT.CAPTURE.COMPLETED":
        result = await handlePaymentCapture(event, supabaseClient);
        break;

      case "BILLING.SUBSCRIPTION.ACTIVATED":
        result = await handleSubscriptionActivated(event, supabaseClient);
        break;

      case "PAYMENT.SALE.COMPLETED":
        result = await handleSubscriptionPayment(event, supabaseClient);
        break;

      case "BILLING.SUBSCRIPTION.PAYMENT.FAILED":
        result = await handlePaymentFailed(event, supabaseClient);
        break;

      case "BILLING.SUBSCRIPTION.CANCELLED":
      case "BILLING.SUBSCRIPTION.SUSPENDED":
        result = await handleSubscriptionCancelled(event, supabaseClient);
        break;

      default:
        console.log("Unhandled event type:", event.event_type);
        result = { success: true, message: "Event received" };
    }

    if (eventId && result.success !== false) {
      await supabaseClient
        .from("webhook_events")
        .insert({
          provider: "paypal",
          external_id: eventId,
          event_type: event.event_type,
          payload: event,
        })
        .catch((err) => {
          console.error("Failed to store webhook event:", err);
        });
    }

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
