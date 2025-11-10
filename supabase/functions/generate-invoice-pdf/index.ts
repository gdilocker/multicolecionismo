import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface Order {
  id: string;
  user_id: string;
  domain: string;
  total_cents: number;
  created_at: string;
  payment_method: string;
  status: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth token from header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get order ID from query params
    const url = new URL(req.url);
    const orderId = url.searchParams.get("orderId");

    if (!orderId) {
      return new Response(JSON.stringify({ error: "Order ID is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch order from database
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate PDF HTML
    const pdfHtml = generateInvoiceHTML(order as Order, user.email || "");

    // Return HTML that will be converted to PDF by the browser
    return new Response(pdfHtml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html",
      },
    });
  } catch (error) {
    console.error("Error generating invoice:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function generateInvoiceHTML(order: Order, userEmail: string): string {
  const amount = (order.total_cents / 100).toFixed(2);
  const date = new Date(order.created_at).toLocaleDateString("pt-BR");
  const paymentMethod = order.payment_method === "paypal" ? "PayPal" : "Cartão de Crédito";

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fatura - ${order.id}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: white;
      color: #1e293b;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e2e8f0;
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      color: #3b82f6;
    }
    .invoice-info {
      text-align: right;
    }
    .invoice-title {
      font-size: 32px;
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 10px;
    }
    .invoice-number {
      color: #64748b;
      font-size: 14px;
    }
    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-bottom: 40px;
    }
    .details-section h3 {
      font-size: 14px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 10px;
    }
    .details-section p {
      color: #1e293b;
      line-height: 1.6;
    }
    .items-table {
      width: 100%;
      margin-bottom: 30px;
      border-collapse: collapse;
    }
    .items-table th {
      background: #f1f5f9;
      padding: 12px;
      text-align: left;
      font-size: 12px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .items-table td {
      padding: 16px 12px;
      border-bottom: 1px solid #e2e8f0;
    }
    .items-table tr:last-child td {
      border-bottom: none;
    }
    .total-section {
      display: flex;
      justify-content: flex-end;
      margin-top: 30px;
    }
    .total-box {
      background: #f8fafc;
      padding: 20px 30px;
      border-radius: 8px;
      min-width: 300px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
    }
    .total-row.final {
      border-top: 2px solid #e2e8f0;
      margin-top: 10px;
      padding-top: 15px;
      font-size: 20px;
      font-weight: bold;
    }
    .status-badge {
      display: inline-block;
      padding: 6px 16px;
      background: #dcfce7;
      color: #166534;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      color: #64748b;
      font-size: 12px;
    }
    @media print {
      body {
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">.com.rich</div>
    <div class="invoice-info">
      <div class="invoice-title">FATURA</div>
      <div class="invoice-number">#${order.id.substring(0, 8).toUpperCase()}</div>
    </div>
  </div>

  <div class="details-grid">
    <div class="details-section">
      <h3>Faturado Para</h3>
      <p>
        <strong>${userEmail}</strong>
      </p>
    </div>
    <div class="details-section">
      <h3>Detalhes do Pagamento</h3>
      <p>
        Data: <strong>${date}</strong><br>
        Método: <strong>${paymentMethod}</strong><br>
        Status: <span class="status-badge">Pago</span>
      </p>
    </div>
  </div>

  <table class="items-table">
    <thead>
      <tr>
        <th>Descrição</th>
        <th style="text-align: center;">Quantidade</th>
        <th style="text-align: right;">Valor</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <strong>Domínio: ${order.domain}</strong><br>
          <span style="color: #64748b; font-size: 14px;">Registro de domínio</span>
        </td>
        <td style="text-align: center;">1</td>
        <td style="text-align: right; font-weight: 600;">$${amount}</td>
      </tr>
    </tbody>
  </table>

  <div class="total-section">
    <div class="total-box">
      <div class="total-row">
        <span>Subtotal:</span>
        <span>$${amount}</span>
      </div>
      <div class="total-row">
        <span>Impostos:</span>
        <span>$0.00</span>
      </div>
      <div class="total-row final">
        <span>Total:</span>
        <span>$${amount}</span>
      </div>
    </div>
  </div>

  <div class="footer">
    <p>Obrigado pelo seu pagamento!</p>
    <p>Para dúvidas, entre em contato: suporte@.com.rich</p>
  </div>
</body>
</html>
  `;
}
