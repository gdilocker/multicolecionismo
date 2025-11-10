import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface DomainSuggestion {
  id: string;
  domain_name: string;
  status: string;
  is_premium: boolean;
  last_availability_check: string | null;
}

async function checkDomainAvailability(domainName: string): Promise<boolean> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/domains`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${supabaseAnonKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "check",
        fqdn: `${domainName}.email`
      })
    });

    if (!response.ok) {
      console.error(`Failed to check ${domainName}:`, response.status);
      return true;
    }

    const result = await response.json();
    return result.available === true;
  } catch (error) {
    console.error(`Error checking ${domainName}:`, error);
    return true;
  }
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

    console.log("Starting marketplace domain availability check...");

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: suggestions, error: fetchError } = await supabase
      .from('domain_suggestions')
      .select('id, domain_name, status, is_premium, last_availability_check')
      .eq('status', 'available')
      .eq('is_premium', false)
      .or(`last_availability_check.is.null,last_availability_check.lt.${twentyFourHoursAgo}`)
      .limit(50);

    if (fetchError) {
      throw fetchError;
    }

    if (!suggestions || suggestions.length === 0) {
      console.log("No domains to check");
      return new Response(
        JSON.stringify({
          success: true,
          message: "No domains to check",
          checked: 0,
          updated: 0
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    console.log(`Checking ${suggestions.length} domains...`);

    let updatedCount = 0;
    const results = [];

    for (const suggestion of suggestions) {
      console.log(`Checking ${suggestion.domain_name}...`);

      const isAvailable = await checkDomainAvailability(suggestion.domain_name);

      const updateData: any = {
        last_availability_check: new Date().toISOString()
      };

      if (!isAvailable) {
        updateData.status = 'sold';
        updatedCount++;
        console.log(`❌ ${suggestion.domain_name} is now SOLD`);
      } else {
        console.log(`✅ ${suggestion.domain_name} is still available`);
      }

      const { error: updateError } = await supabase
        .from('domain_suggestions')
        .update(updateData)
        .eq('id', suggestion.id);

      if (updateError) {
        console.error(`Error updating ${suggestion.domain_name}:`, updateError);
      }

      results.push({
        domain: suggestion.domain_name,
        previousStatus: suggestion.status,
        newStatus: updateData.status || suggestion.status,
        available: isAvailable
      });

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`Check complete: ${updatedCount} domains marked as sold`);

    return new Response(
      JSON.stringify({
        success: true,
        checked: suggestions.length,
        updated: updatedCount,
        results
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
