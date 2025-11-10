import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SecurityCheckResult {
  url: string;
  status: 'safe' | 'suspicious' | 'malicious' | 'pending';
  threatTypes: string[];
  provider: string;
  rawResponse: any;
  notes?: string;
}

async function checkUrlSafety(url: string): Promise<SecurityCheckResult> {
  try {
    const apiKey = Deno.env.get('GOOGLE_SAFE_BROWSING_API_KEY');

    if (!apiKey) {
      console.warn('Google Safe Browsing API key not configured, marking as pending');
      return {
        url,
        status: 'pending',
        threatTypes: [],
        provider: 'none',
        rawResponse: { error: 'API key not configured' },
        notes: 'Verificação de segurança não configurada'
      };
    }

    const apiUrl = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`;

    const requestBody = {
      client: {
        clientId: 'comrich-platform',
        clientVersion: '1.0.0'
      },
      threatInfo: {
        threatTypes: [
          'MALWARE',
          'SOCIAL_ENGINEERING',
          'UNWANTED_SOFTWARE',
          'POTENTIALLY_HARMFUL_APPLICATION'
        ],
        platformTypes: ['ANY_PLATFORM'],
        threatEntryTypes: ['URL'],
        threatEntries: [{ url }]
      }
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      console.error('Safe Browsing API error:', response.status, await response.text());
      return {
        url,
        status: 'pending',
        threatTypes: [],
        provider: 'google_safe_browsing',
        rawResponse: { error: 'API request failed', status: response.status },
        notes: 'Erro ao consultar API de segurança'
      };
    }

    const data = await response.json();

    if (data.matches && data.matches.length > 0) {
      const threatTypes = data.matches.map((match: any) => match.threatType);
      const uniqueThreats = [...new Set(threatTypes)];

      return {
        url,
        status: 'malicious',
        threatTypes: uniqueThreats,
        provider: 'google_safe_browsing',
        rawResponse: data,
        notes: `Ameaças detectadas: ${uniqueThreats.join(', ')}`
      };
    }

    return {
      url,
      status: 'safe',
      threatTypes: [],
      provider: 'google_safe_browsing',
      rawResponse: data,
      notes: 'URL verificada e considerada segura'
    };

  } catch (error) {
    console.error('Error checking URL safety:', error);
    return {
      url,
      status: 'pending',
      threatTypes: [],
      provider: 'error',
      rawResponse: { error: error.message },
      notes: `Erro na verificação: ${error.message}`
    };
  }
}

async function recordSecurityCheck(
  supabaseClient: any,
  linkId: string,
  result: SecurityCheckResult,
  checkType: 'automatic' | 'manual' | 'periodic' | 'user_request' = 'automatic',
  checkedBy?: string
): Promise<{ success: boolean; checkId?: string; error?: string }> {
  try {
    const { data, error } = await supabaseClient
      .from('link_security_checks')
      .insert({
        link_id: linkId,
        url: result.url,
        status: result.status,
        check_type: checkType,
        threat_types: result.threatTypes,
        provider: result.provider,
        raw_response: result.rawResponse,
        checked_at: new Date().toISOString(),
        checked_by: checkedBy || null,
        notes: result.notes
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error recording security check:', error);
      return { success: false, error: error.message };
    }

    return { success: true, checkId: data.id };
  } catch (error) {
    console.error('Exception recording security check:', error);
    return { success: false, error: error.message };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const cronSecret = Deno.env.get('CRON_SECRET');

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return new Response(
        JSON.stringify({ error: 'Acesso não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Iniciando verificação periódica de segurança de links...');

    const { data: linksToCheck, error: fetchError } = await supabase
      .rpc('get_links_for_periodic_check', { p_hours_since_last_check: 24 });

    if (fetchError) {
      console.error('Erro ao buscar links:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar links', details: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!linksToCheck || linksToCheck.length === 0) {
      console.log('Nenhum link precisa de verificação no momento');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Nenhum link para verificar',
          checked: 0
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Verificando ${linksToCheck.length} links...`);

    const results = {
      total: linksToCheck.length,
      safe: 0,
      suspicious: 0,
      malicious: 0,
      pending: 0,
      errors: 0
    };

    for (const link of linksToCheck) {
      try {
        console.log(`Verificando link ${link.link_id}: ${link.url}`);

        const securityResult = await checkUrlSafety(link.url);

        await recordSecurityCheck(
          supabase,
          link.link_id,
          securityResult,
          'periodic'
        );

        results[securityResult.status]++;

        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`Erro ao verificar link ${link.link_id}:`, error);
        results.errors++;
      }
    }

    console.log('Verificação periódica concluída:', results);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Verificação periódica concluída',
        results
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in periodic-link-security-check:', error);
    return new Response(
      JSON.stringify({
        error: 'Erro interno do servidor',
        message: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});