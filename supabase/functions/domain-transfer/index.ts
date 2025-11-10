import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const PAYPAL_CLIENT_ID = Deno.env.get("PAYPAL_CLIENT_ID") || "";
const PAYPAL_CLIENT_SECRET = Deno.env.get("PAYPAL_CLIENT_SECRET") || "";
const PAYPAL_API_BASE = Deno.env.get("PAYPAL_MODE") === "live"
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";

async function getPayPalAccessToken(): Promise<string> {
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
    throw new Error(`Failed to get PayPal access token: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, ...body } = await req.json();

    if (action === "initiate") {
      const { domainId, toUserEmail } = body;

      if (!domainId || !toUserEmail) {
        return new Response(
          JSON.stringify({ error: "domainId e toUserEmail são obrigatórios" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: fromCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!fromCustomer) {
        return new Response(
          JSON.stringify({ error: "Cliente não encontrado" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: domain } = await supabase
        .from('domains')
        .select('id, fqdn, customer_id, registrar_status, is_transferable')
        .eq('id', domainId)
        .eq('customer_id', fromCustomer.id)
        .maybeSingle();

      if (!domain) {
        return new Response(
          JSON.stringify({ error: "Domínio não encontrado ou você não é o proprietário" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (domain.registrar_status !== 'active') {
        return new Response(
          JSON.stringify({ error: "Apenas domínios ativos podem ser transferidos" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!domain.is_transferable) {
        return new Response(
          JSON.stringify({ error: "Este domínio não pode ser transferido" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: toUserData } = await supabase.auth.admin.listUsers();
      const toUser = toUserData.users.find(u => u.email === toUserEmail);

      if (!toUser) {
        return new Response(
          JSON.stringify({ error: "Usuário destinatário não encontrado" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: toCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', toUser.id)
        .maybeSingle();

      if (!toCustomer) {
        return new Response(
          JSON.stringify({ error: "Cliente destinatário não encontrado" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (fromCustomer.id === toCustomer.id) {
        return new Response(
          JSON.stringify({ error: "Você não pode transferir um domínio para si mesmo" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: settings } = await supabase
        .from('admin_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['domain_transfer_fee', 'domain_annual_fee_on_transfer']);

      const transferFee = Number(settings?.find(s => s.setting_key === 'domain_transfer_fee')?.setting_value || '50.00');
      const annualFee = Number(settings?.find(s => s.setting_key === 'domain_annual_fee_on_transfer')?.setting_value || '100.00');
      const totalAmount = transferFee + annualFee;

      const { data: transfer, error: transferError } = await supabase
        .from('domain_transfers')
        .insert({
          domain_id: domainId,
          from_customer_id: fromCustomer.id,
          to_customer_id: toCustomer.id,
          transfer_fee: transferFee,
          new_annual_fee: annualFee,
          status: 'pending'
        })
        .select()
        .single();

      if (transferError) {
        console.error('Error creating transfer:', transferError);
        return new Response(
          JSON.stringify({ error: "Erro ao criar transferência" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          transfer: {
            id: transfer.id,
            domain: domain.fqdn,
            toEmail: toUserEmail,
            transferFee,
            annualFee,
            totalAmount
          }
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "create-payment") {
      const { transferId, returnUrl, cancelUrl } = body;

      if (!transferId) {
        return new Response(
          JSON.stringify({ error: "transferId é obrigatório" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!customer) {
        return new Response(
          JSON.stringify({ error: "Cliente não encontrado" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: transfer } = await supabase
        .from('domain_transfers')
        .select(`
          *,
          domains (fqdn)
        `)
        .eq('id', transferId)
        .eq('to_customer_id', customer.id)
        .eq('status', 'pending')
        .maybeSingle();

      if (!transfer) {
        return new Response(
          JSON.stringify({ error: "Transferência não encontrada" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const totalAmount = Number(transfer.transfer_fee) + Number(transfer.new_annual_fee);
      const accessToken = await getPayPalAccessToken();

      const orderPayload = {
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: transfer.id,
            custom_id: transfer.id,
            description: `Transferência do domínio ${transfer.domains.fqdn}`,
            amount: {
              currency_code: "USD",
              value: totalAmount.toFixed(2),
              breakdown: {
                item_total: {
                  currency_code: "USD",
                  value: totalAmount.toFixed(2),
                },
              },
            },
            items: [
              {
                name: `Transferência: ${transfer.domains.fqdn}`,
                description: `Taxa de transferência + Nova anuidade`,
                unit_amount: {
                  currency_code: "USD",
                  value: totalAmount.toFixed(2),
                },
                quantity: "1",
                category: "DIGITAL_GOODS",
              },
            ],
          },
        ],
        application_context: {
          brand_name: ".com.rich - Transferência de Domínio",
          landing_page: "NO_PREFERENCE",
          user_action: "PAY_NOW",
          return_url: returnUrl || `${req.headers.get('origin')}/transfer/success`,
          cancel_url: cancelUrl || `${req.headers.get('origin')}/transfer/cancel`,
        },
      };

      const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify(orderPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('PayPal error:', errorText);
        return new Response(
          JSON.stringify({ error: "Erro ao criar ordem no PayPal" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const paypalOrder = await response.json();
      const approveUrl = paypalOrder.links.find((link: any) => link.rel === "approve")?.href;

      return new Response(
        JSON.stringify({
          success: true,
          orderId: paypalOrder.id,
          approveUrl
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "complete") {
      const { transferId, paypalOrderId } = body;

      if (!transferId || !paypalOrderId) {
        return new Response(
          JSON.stringify({ error: "transferId e paypalOrderId são obrigatórios" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const accessToken = await getPayPalAccessToken();

      const captureResponse = await fetch(
        `${PAYPAL_API_BASE}/v2/checkout/orders/${paypalOrderId}/capture`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
          },
        }
      );

      if (!captureResponse.ok) {
        return new Response(
          JSON.stringify({ error: "Erro ao capturar pagamento" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const captureData = await captureResponse.json();

      if (captureData.status !== "COMPLETED") {
        return new Response(
          JSON.stringify({ error: "Pagamento não foi completado" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: (await supabase.from('customers').select('id').eq('user_id', user.id).single()).data?.id,
          order_type: 'domain_transfer',
          total_amount: captureData.purchase_units[0].payments.captures[0].amount.value,
          currency: 'USD',
          status: 'completed',
          payment_method: 'paypal',
          payment_id: paypalOrderId
        })
        .select()
        .single();

      if (orderError) {
        console.error('Error creating order:', orderError);
      }

      const { error: processError } = await supabase.rpc('process_domain_transfer', {
        p_transfer_id: transferId,
        p_payment_id: order?.id
      });

      if (processError) {
        console.error('Error processing transfer:', processError);
        return new Response(
          JSON.stringify({ error: "Erro ao processar transferência" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "cancel") {
      const { transferId } = body;

      if (!transferId) {
        return new Response(
          JSON.stringify({ error: "transferId é obrigatório" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error: cancelError } = await supabase.rpc('cancel_domain_transfer', {
        p_transfer_id: transferId
      });

      if (cancelError) {
        return new Response(
          JSON.stringify({ error: "Erro ao cancelar transferência" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Ação inválida" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
