import { createClient } from 'npm:@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface ProcessPaymentRequest {
  action: 'process_monthly_payment';
  purchase_id: string;
  payment_method?: string;
  transaction_id?: string;
}

interface CheckOverdueRequest {
  action: 'check_overdue';
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { action } = body;

    if (action === 'process_monthly_payment') {
      const { purchase_id, payment_method, transaction_id } = body as ProcessPaymentRequest;

      // Get purchase details
      const { data: purchase, error: fetchError } = await supabase
        .from('premium_domain_purchases')
        .select('*')
        .eq('id', purchase_id)
        .single();

      if (fetchError || !purchase) {
        throw new Error('Purchase not found');
      }

      // Record payment
      const { error: paymentError } = await supabase
        .from('premium_payment_history')
        .insert({
          purchase_id: purchase_id,
          amount: purchase.monthly_fee,
          payment_type: 'monthly_fee',
          payment_method: payment_method || 'unknown',
          payment_status: 'completed',
          transaction_id: transaction_id,
          paid_at: new Date().toISOString()
        });

      if (paymentError) {
        throw paymentError;
      }

      // Update purchase record
      const nextDueDate = new Date();
      nextDueDate.setMonth(nextDueDate.getMonth() + 1);

      const { error: updateError } = await supabase
        .from('premium_domain_purchases')
        .update({
          last_payment_date: new Date().toISOString().split('T')[0],
          next_payment_due: nextDueDate.toISOString().split('T')[0],
          days_overdue: 0,
          status: 'active',
          suspension_date: null
        })
        .eq('id', purchase_id);

      if (updateError) {
        throw updateError;
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Payment processed successfully',
          next_payment_due: nextDueDate.toISOString().split('T')[0]
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'check_overdue') {
      // Calculate days overdue for all active/suspended purchases
      const { data: purchases, error: fetchError } = await supabase
        .from('premium_domain_purchases')
        .select('*')
        .in('status', ['active', 'suspended']);

      if (fetchError) {
        throw fetchError;
      }

      const today = new Date();
      const updates = [];

      for (const purchase of purchases || []) {
        const dueDate = new Date(purchase.next_payment_due);
        const daysOverdue = Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));

        let newStatus = purchase.status;
        let suspensionDate = purchase.suspension_date;
        let expirationDate = purchase.expiration_date;

        // Suspend after 30 days
        if (daysOverdue >= 30 && daysOverdue < 90 && purchase.status === 'active') {
          newStatus = 'suspended';
          suspensionDate = new Date().toISOString();
        }

        // Expire after 90 days
        if (daysOverdue >= 90 && purchase.status !== 'expired') {
          newStatus = 'expired';
          expirationDate = new Date().toISOString();

          // Return domain to marketplace
          await supabase
            .from('premium_domains')
            .update({ status: 'available' })
            .eq('fqdn', purchase.domain_fqdn);
        }

        if (daysOverdue !== purchase.days_overdue || newStatus !== purchase.status) {
          updates.push({
            id: purchase.id,
            days_overdue: daysOverdue,
            status: newStatus,
            suspension_date: suspensionDate,
            expiration_date: expirationDate
          });
        }
      }

      // Batch update
      for (const update of updates) {
        await supabase
          .from('premium_domain_purchases')
          .update(update)
          .eq('id', update.id);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `Checked ${purchases?.length || 0} purchases, updated ${updates.length}`,
          suspended: updates.filter(u => u.status === 'suspended').length,
          expired: updates.filter(u => u.status === 'expired').length
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});