import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CloudflareConfig {
  apiToken: string;
  zoneId?: string;
}

function getCloudflareConfig(): CloudflareConfig {
  return {
    apiToken: "",
    zoneId: undefined,
  };
}

async function getZoneId(domain: string, apiToken: string): Promise<string | null> {
  try {
    const response = await fetch(`https://api.cloudflare.com/client/v4/zones?name=${domain}`, {
      headers: {
        "Authorization": `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    return data.result?.[0]?.id || null;
  } catch (error) {
    console.error("Error getting zone ID:", error);
    return null;
  }
}

async function applyDNSRecords(params: {
  fqdn: string;
  mxHost: string;
  spfInclude: string;
  dkimTxt?: { selector: string; value: string };
  dmarcPolicy?: string;
}): Promise<{ success: boolean; error?: string }> {
  const config = getCloudflareConfig();
  
  if (!config.apiToken) {
    return { success: false, error: "Cloudflare API not configured" };
  }

  const { fqdn, mxHost, spfInclude, dkimTxt, dmarcPolicy } = params;
  const rootDomain = fqdn.split(".").slice(-2).join(".");
  const zoneId = await getZoneId(rootDomain, config.apiToken);

  if (!zoneId) {
    return { success: false, error: "Zone not found in Cloudflare" };
  }

  try {
    const records = [
      { type: "MX", name: fqdn, content: mxHost, priority: 10 },
      { type: "TXT", name: fqdn, content: `v=spf1 include:${spfInclude} ~all` },
    ];

    if (dkimTxt) {
      records.push({
        type: "TXT",
        name: `${dkimTxt.selector}._domainkey.${fqdn}`,
        content: dkimTxt.value,
        priority: undefined as any,
      });
    }

    if (dmarcPolicy) {
      records.push({
        type: "TXT",
        name: `_dmarc.${fqdn}`,
        content: `v=DMARC1; p=${dmarcPolicy}; rua=mailto:dmarc@${fqdn}`,
        priority: undefined as any,
      });
    }

    for (const record of records) {
      const payload: any = {
        type: record.type,
        name: record.name,
        content: record.content,
        ttl: 3600,
      };
      if (record.priority) {
        payload.priority = record.priority;
      }

      await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${config.apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Error applying DNS records:", error);
    return { success: false, error: String(error) };
  }
}

async function checkDNSRecords(fqdn: string): Promise<{ mx?: string[]; spf?: string; dkim?: boolean; dmarc?: string }> {
  try {
    const mxResponse = await fetch(`https://dns.google/resolve?name=${fqdn}&type=MX`);
    const mxData = await mxResponse.json();
    const mx = mxData.Answer?.map((a: any) => a.data) || [];

    const txtResponse = await fetch(`https://dns.google/resolve?name=${fqdn}&type=TXT`);
    const txtData = await txtResponse.json();
    const txtRecords = txtData.Answer?.map((a: any) => a.data) || [];
    const spf = txtRecords.find((r: string) => r.includes("v=spf1"));

    return { mx, spf, dkim: false, dmarc: undefined };
  } catch (error) {
    console.error("Error checking DNS:", error);
    return {};
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = new URL(req.url);

    if (req.method === "POST") {
      const body = await req.json();
      const result = await applyDNSRecords(body);
      return new Response(
        JSON.stringify(result),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (req.method === "GET") {
      const fqdn = url.searchParams.get("fqdn");
      if (!fqdn) {
        return new Response(
          JSON.stringify({ error: "Missing fqdn parameter" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const result = await checkDNSRecords(fqdn);
      return new Response(
        JSON.stringify(result),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});