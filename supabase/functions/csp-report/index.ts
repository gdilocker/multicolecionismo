import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CSPReport {
  'csp-report': {
    'document-uri': string;
    'violated-directive': string;
    'blocked-uri': string;
    'source-file'?: string;
    'line-number'?: number;
    'column-number'?: number;
    'status-code'?: number;
  };
}

/**
 * Determine if CSP violation is high risk
 */
function isHighRisk(report: CSPReport): boolean {
  const csp = report['csp-report'];

  // Data URIs in scripts are extremely suspicious
  if (csp['violated-directive'].includes('script-src') &&
      csp['blocked-uri'].startsWith('data:')) {
    return true;
  }

  // Inline scripts/styles (potential XSS)
  if (csp['violated-directive'].includes('script-src') &&
      csp['blocked-uri'] === 'inline') {
    return true;
  }

  // Eval usage (potential code injection)
  if (csp['blocked-uri'].includes('eval')) {
    return true;
  }

  // External domains not in allowlist
  const suspiciousDomains = ['.ru', '.cn', 'pastebin', 'bit.ly'];
  if (suspiciousDomains.some(domain => csp['blocked-uri'].includes(domain))) {
    return true;
  }

  return false;
}

/**
 * Log CSP violation to audit logs
 */
async function logViolation(supabase: any, report: CSPReport, highRisk: boolean) {
  const csp = report['csp-report'];

  try {
    await supabase.from('audit_logs').insert({
      action: 'CSP_VIOLATION',
      severity: highRisk ? 'high' : 'medium',
      success: false,
      details: {
        documentUri: csp['document-uri'],
        violatedDirective: csp['violated-directive'],
        blockedUri: csp['blocked-uri'],
        sourceFile: csp['source-file'],
        lineNumber: csp['line-number'],
        columnNumber: csp['column-number'],
        highRisk
      }
    });
  } catch (error) {
    console.error('Failed to log CSP violation:', error);
  }
}


Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders
    });
  }

  try {
    // Parse CSP report
    const report: CSPReport = await req.json();

    console.log('CSP Violation received:', JSON.stringify(report, null, 2));

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Determine risk level
    const highRisk = isHighRisk(report);

    // Log to audit system
    await logViolation(supabase, report, highRisk);

    // High-risk violations are logged with 'high' severity
    if (highRisk) {
      console.warn('High-risk CSP violation detected and logged');
    }

    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  } catch (error) {
    console.error('CSP report processing error:', error);
    return new Response('Internal server error', {
      status: 500,
      headers: corsHeaders
    });
  }
});
