import { createClient } from 'npm:@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { orderId } = await req.json();

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: 'Missing orderId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, affiliate_code, total_cents, status, plan_id, premium_domain_id')
      .eq('id', orderId)
      .maybeSingle();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!order.affiliate_code) {
      return new Response(
        JSON.stringify({ message: 'Order has no reseller code' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (order.premium_domain_id) {
      return new Response(
        JSON.stringify({
          message: 'No commission for premium domain sales - exclusive to company',
          reason: 'premium_domain_exclusion'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!order.plan_id) {
      return new Response(
        JSON.stringify({
          message: 'Commission only applies to subscription plans',
          reason: 'no_plan_commission'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: existingCommission } = await supabase
      .from('affiliate_commissions')
      .select('id')
      .eq('order_id', orderId)
      .maybeSingle();

    if (existingCommission) {
      return new Response(
        JSON.stringify({ message: 'Commission already exists' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: reseller, error: resellerError } = await supabase
      .from('affiliates')
      .select('id, commission_rate, status, customer_id')
      .eq('affiliate_code', order.affiliate_code)
      .maybeSingle();

    if (resellerError || !reseller) {
      return new Response(
        JSON.stringify({ error: 'Reseller not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (reseller.status !== 'active') {
      return new Response(
        JSON.stringify({ message: 'Reseller is not active' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: canReceive } = await supabase
      .rpc('can_receive_commission_payout', { p_customer_id: reseller.customer_id });

    const paymentHeld = !canReceive;
    const heldReason = paymentHeld ? 'Reseller subscription payment overdue' : null;

    let commissionRate = reseller.commission_rate;

    if (order.plan_id) {
      const { data: plan } = await supabase
        .from('subscription_plans')
        .select('commission_rate')
        .eq('id', order.plan_id)
        .maybeSingle();

      if (plan?.commission_rate) {
        commissionRate = plan.commission_rate;
      }
    }

    const saleAmount = order.total_cents / 100;
    const commissionAmount = saleAmount * commissionRate;
    const commissionStatus = order.status === 'paid' ? 'confirmed' : 'pending';

    const { data: commission, error: commissionError } = await supabase
      .from('affiliate_commissions')
      .insert({
        affiliate_id: reseller.id,
        order_id: orderId,
        sale_amount: saleAmount,
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
        status: commissionStatus,
        confirmed_at: order.status === 'paid' ? new Date().toISOString() : null,
        payment_held: paymentHeld,
        held_reason: heldReason,
        held_date: paymentHeld ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (commissionError) {
      return new Response(
        JSON.stringify({ error: 'Failed to create commission' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (commissionStatus === 'confirmed' && !paymentHeld) {
      await supabase.rpc('increment_affiliate_balance', {
        p_affiliate_id: reseller.id,
        p_commission: commissionAmount
      });
    } else if (commissionStatus === 'confirmed' && paymentHeld) {
      await supabase.rpc('increment_affiliate_sales', {
        p_affiliate_id: reseller.id,
        p_commission: commissionAmount
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        commission,
        message: `Commission ${commissionStatus} successfully${paymentHeld ? ' (payment held due to overdue subscription)' : ''}`,
        payment_held: paymentHeld,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});