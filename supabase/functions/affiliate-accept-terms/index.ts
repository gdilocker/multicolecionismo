import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

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

    // Check if user already has an affiliate account
    const { data: existingAffiliate } = await supabase
      .from("affiliates")
      .select("id, affiliate_code, status")
      .eq("user_id", user.id)
      .single();

    let affiliateCode: string;
    let affiliateStatus = 'pending';

    if (existingAffiliate) {
      // User already has an affiliate account
      affiliateCode = existingAffiliate.affiliate_code;
      affiliateStatus = existingAffiliate.status;
    } else {
      // Generate new affiliate code
      const { data: newCode } = await supabase.rpc("generate_affiliate_code");
      affiliateCode = newCode || `${user.id.substring(0, 8)}`;

      // Create affiliate record
      const { error: insertError } = await supabase
        .from("affiliates")
        .insert({
          user_id: user.id,
          affiliate_code: affiliateCode,
          status: 'pending'
        });

      if (insertError) {
        console.error("Error creating affiliate:", insertError);
        return new Response(
          JSON.stringify({ error: "Failed to create affiliate account" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Update user_profiles to mark as affiliate with terms accepted
    const { error: updateError } = await supabase
      .from("user_profiles")
      .update({
        is_affiliate: true,
        affiliate_terms_accepted_at: new Date().toISOString()
      })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Error updating user_profiles:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update affiliate status" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        affiliate_code: affiliateCode,
        status: affiliateStatus,
        message: "Affiliate terms accepted successfully"
      }),
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
