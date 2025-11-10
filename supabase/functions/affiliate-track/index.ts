import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface TrackRequest {
  affiliate_code?: string;
  referred_user_id?: string;
  source?: string;
  cookie_id?: string;
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

    // Get user from JWT token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token or user not found" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Extract data from request
    const { affiliate_code, source = 'unknown', cookie_id } = await req.json() as TrackRequest;

    if (!affiliate_code) {
      return new Response(
        JSON.stringify({ error: "Missing affiliate_code" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get request metadata
    const ip_address = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const user_agent = req.headers.get("user-agent") || "unknown";
    const referrer_url = req.headers.get("referer") || req.headers.get("referrer") || null;

    // Call the process_referral_attribution function with the authenticated user
    const { data, error } = await supabase.rpc("process_referral_attribution", {
      p_affiliate_code: affiliate_code,
      p_referred_user_id: user.id,
      p_source: source,
      p_cookie_id: cookie_id || null,
      p_ip_address: ip_address,
      p_user_agent: user_agent,
      p_referrer_url: referrer_url
    });

    if (error) {
      console.error("Error processing referral:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: data, message: "Referral processed successfully" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
