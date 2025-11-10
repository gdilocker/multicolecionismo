import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface VerifyLinkRequest {
  linkId: string;
  url: string;
  checkType?: 'automatic' | 'manual' | 'periodic' | 'user_request';
}

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

function isUrlSuspicious(url: string): { suspicious: boolean; reason?: string } {
  const suspiciousPatterns = [
    { pattern: /bit\.ly|tinyurl|shorturl|goo\.gl/i, reason: 'URL encurtada' },
    { pattern: /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/, reason: 'IP direto ao invés de domínio' },
    { pattern: /@/, reason: 'Caractere @ suspeito na URL' },
    { pattern: /-(login|signin|account|verify|secure|update)/i, reason: 'Padrão comum de phishing' },
    { pattern: /\.(tk|ml|ga|cf|gq)$/i, reason: 'TLD comum em sites maliciosos' }
  ];

  for (const { pattern, reason } of suspiciousPatterns) {
    if (pattern.test(url)) {
      return { suspicious: true, reason };
    }
  }

  return { suspicious: false };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);

      if (!authError && user) {
        userId = user.id;
      }
    }

    const { linkId, url, checkType = 'automatic' }: VerifyLinkRequest = await req.json();

    if (!linkId || !url) {
      return new Response(
        JSON.stringify({ error: 'linkId e url são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Verificando link ${linkId}: ${url}`);

    const suspicious = isUrlSuspicious(url);

    if (suspicious.suspicious) {
      console.log(`URL suspeita detectada: ${suspicious.reason}`);
    }

    const securityResult = await checkUrlSafety(url);

    if (suspicious.suspicious && securityResult.status === 'safe') {
      securityResult.status = 'suspicious';
      securityResult.notes = `${securityResult.notes} | Padrão suspeito: ${suspicious.reason}`;
    }

    const { data, error } = await supabase
      .from('link_security_checks')
      .insert({
        link_id: linkId,
        url: securityResult.url,
        status: securityResult.status,
        check_type: checkType,
        threat_types: securityResult.threatTypes,
        provider: securityResult.provider,
        raw_response: securityResult.rawResponse,
        checked_at: new Date().toISOString(),
        checked_by: checkType === 'manual' ? userId : null,
        notes: securityResult.notes
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error recording security check:', error);
      return new Response(
        JSON.stringify({
          error: 'Erro ao registrar verificação',
          details: error.message
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: linkData } = await supabase
      .from('profile_links')
      .select('security_status, is_blocked')
      .eq('id', linkId)
      .single();

    return new Response(
      JSON.stringify({
        success: true,
        checkId: data.id,
        result: {
          status: securityResult.status,
          threatTypes: securityResult.threatTypes,
          isBlocked: linkData?.is_blocked || false,
          notes: securityResult.notes
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in verify-link-security:', error);
    return new Response(
      JSON.stringify({
        error: 'Erro interno do servidor',
        message: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});