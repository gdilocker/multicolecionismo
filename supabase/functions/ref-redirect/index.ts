import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Extract the affiliate code from the URL path
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const code = pathParts[pathParts.length - 1];

    if (!code || code === 'ref-redirect') {
      return new Response(
        "Missing affiliate code",
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    // Build redirect URL with affiliate tracking
    const params = new URLSearchParams({
      ref: code,
      utm_source: 'short_link',
      utm_medium: 'referral',
      utm_campaign: 'affiliate'
    });

    const redirectUrl = `${url.origin}/register?${params.toString()}`;

    // Redirect with cookie setting
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': redirectUrl,
        'Set-Cookie': `ref=${code}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax`
      }
    });
  } catch (error) {
    console.error("Error in ref-redirect:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
