import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PayPalTransaction {
  transaction_id: string;
  transaction_status: string;
  transaction_amount: {
    value: string;
    currency_code: string;
  };
  transaction_info: {
    transaction_initiation_date: string;
    transaction_updated_date: string;
  };
  payer_info?: {
    payer_name?: {
      given_name?: string;
      surname?: string;
    };
  };
}

async function getPayPalAccessToken(): Promise<string> {
  const clientId = Deno.env.get('PAYPAL_CLIENT_ID');
  const clientSecret = Deno.env.get('PAYPAL_CLIENT_SECRET');
  const isProduction = Deno.env.get('PAYPAL_MODE') === 'production';

  const baseURL = isProduction
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

  const auth = btoa(`${clientId}:${clientSecret}`);

  const response = await fetch(`${baseURL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error(`PayPal auth failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function fetchPayPalTransactions(
  token: string,
  startDate: string,
  endDate: string
): Promise<PayPalTransaction[]> {
  const isProduction = Deno.env.get('PAYPAL_MODE') === 'production';
  const baseURL = isProduction
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

  const url = new URL(`${baseURL}/v1/reporting/transactions`);
  url.searchParams.append('start_date', startDate);
  url.searchParams.append('end_date', endDate);
  url.searchParams.append('fields', 'all');
  url.searchParams.append('page_size', '500');

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`PayPal transactions fetch failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.transaction_details || [];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const startTime = Date.now();
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    console.log('🔄 Starting payment reconciliation...');

    // 1. Definir período (últimas 24h)
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);

    const startISO = startDate.toISOString();
    const endISO = endDate.toISOString();

    console.log(`📅 Period: ${startISO} to ${endISO}`);

    // 2. Buscar transações do PayPal
    const paypalToken = await getPayPalAccessToken();
    const paypalTransactions = await fetchPayPalTransactions(
      paypalToken,
      startISO,
      endISO
    );

    console.log(`💰 Found ${paypalTransactions.length} PayPal transactions`);

    // 3. Buscar orders do DB no mesmo período
    const { data: dbOrders, error: dbError } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', startISO)
      .lte('created_at', endISO);

    if (dbError) throw dbError;

    console.log(`📊 Found ${dbOrders?.length || 0} DB orders`);

    // 4. Criar log inicial
    const { data: logId } = await supabase.rpc('log_reconciliation_attempt', {
      p_status: 'running',
      p_paypal_checked: paypalTransactions.length,
      p_db_checked: dbOrders?.length || 0,
      p_discrepancies_found: 0,
      p_discrepancies_resolved: 0,
      p_execution_time_ms: 0
    });

    // 5. Reconciliar
    const discrepancies: any[] = [];
    let resolvedCount = 0;

    for (const transaction of paypalTransactions) {
      // Pular se não for COMPLETED
      if (transaction.transaction_status !== 'S') continue; // S = Success in PayPal

      const transactionId = transaction.transaction_id;
      const dbOrder = dbOrders?.find(
        o => o.paypal_order_id === transactionId
      );

      if (!dbOrder) {
        // DISCREPÂNCIA: Payment no PayPal mas não no DB
        discrepancies.push({
          reconciliation_id: logId,
          discrepancy_type: 'missing_in_db',
          paypal_transaction_id: transactionId,
          paypal_amount: parseFloat(transaction.transaction_amount.value),
          paypal_status: transaction.transaction_status,
          notes: 'Payment completed in PayPal but not found in database'
        });

        console.warn(`⚠️ Missing in DB: ${transactionId}`);

      } else if (dbOrder.status === 'pending') {
        // DISCREPÂNCIA: Payment completo no PayPal mas pending no DB
        discrepancies.push({
          reconciliation_id: logId,
          discrepancy_type: 'status_mismatch',
          paypal_transaction_id: transactionId,
          paypal_amount: parseFloat(transaction.transaction_amount.value),
          paypal_status: transaction.transaction_status,
          db_order_id: dbOrder.id,
          db_amount: dbOrder.total_amount,
          db_status: dbOrder.status,
          notes: 'Payment completed in PayPal but pending in database'
        });

        // AUTO-CORRIGIR
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            status: 'completed',
            completed_at: new Date(transaction.transaction_info.transaction_updated_date),
            updated_at: new Date()
          })
          .eq('id', dbOrder.id);

        if (!updateError) {
          // Ativar domínio
          const { data: domain } = await supabase
            .from('domains')
            .select('status')
            .eq('id', dbOrder.domain_id)
            .single();

          if (domain && domain.status !== 'active') {
            await supabase
              .from('domains')
              .update({
                status: 'active',
                activated_at: new Date(),
                lifecycle_status: 'active'
              })
              .eq('id', dbOrder.domain_id);

            console.log(`✅ Auto-activated domain for order ${dbOrder.id}`);
          }

          resolvedCount++;
        }

        console.log(`🔧 Auto-resolved status mismatch: ${transactionId}`);

      } else if (Math.abs(parseFloat(transaction.transaction_amount.value) - dbOrder.total_amount) > 0.01) {
        // DISCREPÂNCIA: Valores não batem
        discrepancies.push({
          reconciliation_id: logId,
          discrepancy_type: 'amount_mismatch',
          paypal_transaction_id: transactionId,
          paypal_amount: parseFloat(transaction.transaction_amount.value),
          paypal_status: transaction.transaction_status,
          db_order_id: dbOrder.id,
          db_amount: dbOrder.total_amount,
          db_status: dbOrder.status,
          notes: `Amount mismatch: PayPal=${transaction.transaction_amount.value}, DB=${dbOrder.total_amount}`
        });

        console.warn(`⚠️ Amount mismatch: ${transactionId}`);
      }
    }

    // 6. Salvar discrepâncias
    if (discrepancies.length > 0) {
      const { error: discError } = await supabase
        .from('payment_discrepancies')
        .insert(discrepancies);

      if (discError) {
        console.error('Error saving discrepancies:', discError);
      }
    }

    // 7. Atualizar log
    const executionTime = Date.now() - startTime;
    await supabase.rpc('log_reconciliation_attempt', {
      p_status: 'completed',
      p_paypal_checked: paypalTransactions.length,
      p_db_checked: dbOrders?.length || 0,
      p_discrepancies_found: discrepancies.length,
      p_discrepancies_resolved: resolvedCount,
      p_execution_time_ms: executionTime
    });

    // 8. Alertar se houver não resolvidas
    const unresolvedCount = discrepancies.length - resolvedCount;
    if (unresolvedCount > 0) {
      console.error(`🚨 ${unresolvedCount} unresolved payment discrepancies!`);
    }

    console.log('✅ Reconciliation completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          paypal_transactions: paypalTransactions.length,
          db_orders: dbOrders?.length || 0,
          discrepancies_found: discrepancies.length,
          auto_resolved: resolvedCount,
          unresolved: unresolvedCount,
          execution_time_ms: executionTime
        },
        discrepancies: discrepancies.map(d => ({
          type: d.discrepancy_type,
          paypal_id: d.paypal_transaction_id,
          db_order_id: d.db_order_id,
          auto_resolved: d.auto_resolved
        }))
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Reconciliation error:', error);

    const executionTime = Date.now() - startTime;
    await supabase.rpc('log_reconciliation_attempt', {
      p_status: 'failed',
      p_paypal_checked: 0,
      p_db_checked: 0,
      p_discrepancies_found: 0,
      p_discrepancies_resolved: 0,
      p_execution_time_ms: executionTime,
      p_error_message: error.message
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
