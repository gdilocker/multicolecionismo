import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const refCode = url.searchParams.get('ref');

    if (!refCode) {
      return new Response(
        JSON.stringify({ error: 'Missing ref parameter' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Verificar se o código de revendedor existe e está ativo
    const { data: reseller, error: resellerError } = await supabase
      .from('affiliates')
      .select('id, status')
      .eq('affiliate_code', refCode)
      .eq('status', 'active')
      .maybeSingle();

    if (resellerError || !reseller) {
      return new Response(
        JSON.stringify({ error: 'Invalid or inactive reseller code' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Gerar cookie ID único
    const cookieId = crypto.randomUUID();
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || '';
    const referrer = req.headers.get('referer') || '';

    // Registrar o clique
    const { error: clickError } = await supabase
      .from('affiliate_clicks')
      .insert({
        affiliate_id: reseller.id,
        ip_address: ipAddress,
        user_agent: userAgent,
        referrer: referrer,
        cookie_id: cookieId,
      });

    if (clickError) {
      console.error('Error registering click:', clickError);
      return new Response(
        JSON.stringify({ error: 'Failed to register click' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Retornar o cookie ID para o frontend armazenar
    return new Response(
      JSON.stringify({
        success: true,
        cookieId,
        affiliateCode: refCode,
        expiresIn: 30 * 24 * 60 * 60, // 30 dias em segundos
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in reseller-track:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});