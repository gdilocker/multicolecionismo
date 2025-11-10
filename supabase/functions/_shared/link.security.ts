import { createClient } from 'npm:@supabase/supabase-js@2';

export interface SecurityCheckResult {
  url: string;
  status: 'safe' | 'suspicious' | 'malicious' | 'pending';
  threatTypes: string[];
  provider: string;
  rawResponse: any;
  notes?: string;
}

export async function checkUrlSafety(url: string): Promise<SecurityCheckResult> {
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

export async function recordSecurityCheck(
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

export function isUrlSuspicious(url: string): { suspicious: boolean; reason?: string } {
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
