import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

/**
 * Trial Expiration Handler - Cron Job
 *
 * Runs daily to:
 * 1. Identify trials that expired without payment
 * 2. Revoke all rights (affiliates, domains, commissions)
 * 3. Release affiliates to join other sponsors
 * 4. Send notifications
 * 5. Mark recovery window deadline
 */

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date();
    console.log(`[Trial Expiration] Starting cron at ${now.toISOString()}`);

    const results = {
      timestamp: now.toISOString(),
      trials_expired: 0,
      rights_revoked: 0,
      affiliates_released: 0,
      recovery_windows_expired: 0,
      errors: [] as string[]
    };

    // 1. Find trials that just expired (status 'trialing' and trial_ends_at < now)
    const { data: expiredTrials, error: trialsError } = await supabase
      .from("customers")
      .select(`
        user_id,
        email:auth.users(email),
        trial_ends_at,
        recovery_window_until
      `)
      .eq("is_trial_account", true)
      .lt("trial_ends_at", now.toISOString())
      .is("rights_revoked_at", null);

    if (trialsError) {
      console.error("[Trial Expiration] Error fetching expired trials:", trialsError);
      results.errors.push(`Fetch trials error: ${trialsError.message}`);
    } else if (expiredTrials && expiredTrials.length > 0) {
      console.log(`[Trial Expiration] Found ${expiredTrials.length} expired trials`);
      results.trials_expired = expiredTrials.length;

      for (const trial of expiredTrials) {
        try {
          // Revoke rights using database function
          const { data: revocationResult, error: revokeError } = await supabase
            .rpc("revoke_trial_rights", {
              p_user_id: trial.user_id,
              p_reason: "trial_expired"
            });

          if (revokeError) {
            console.error(`[Trial Expiration] Error revoking rights for ${trial.user_id}:`, revokeError);
            results.errors.push(`Revoke ${trial.user_id}: ${revokeError.message}`);
            continue;
          }

          if (revocationResult?.success) {
            results.rights_revoked++;
            results.affiliates_released += revocationResult.rights_revoked?.affiliates || 0;

            console.log(`[Trial Expiration] ✅ Revoked rights for user ${trial.user_id}`);

            // Queue notification (email/SMS)
            await supabase
              .from("domain_notifications")
              .insert({
                domain_id: null, // Account-level notification
                user_id: trial.user_id,
                notification_type: "trial_expired",
                scheduled_for: now.toISOString(),
                template_id: "trial_expired_rights_revoked",
                metadata: {
                  recovery_deadline: trial.recovery_window_until,
                  rights_lost: revocationResult.rights_revoked
                }
              });
          }
        } catch (error) {
          console.error(`[Trial Expiration] Exception processing ${trial.user_id}:`, error);
          results.errors.push(`Exception ${trial.user_id}: ${error.message}`);
        }
      }
    }

    // 2. Find accounts past recovery window (final loss of rights)
    const { data: expiredRecoveries, error: recoveryError } = await supabase
      .from("customers")
      .select("user_id, recovery_window_until")
      .not("recovery_window_until", "is", null)
      .lt("recovery_window_until", now.toISOString())
      .not("rights_revoked_at", "is", null)
      .is("trial_converted_at", null);

    if (recoveryError) {
      console.error("[Trial Expiration] Error fetching expired recoveries:", recoveryError);
      results.errors.push(`Fetch recoveries error: ${recoveryError.message}`);
    } else if (expiredRecoveries && expiredRecoveries.length > 0) {
      console.log(`[Trial Expiration] Found ${expiredRecoveries.length} expired recovery windows`);
      results.recovery_windows_expired = expiredRecoveries.length;

      for (const recovery of expiredRecoveries) {
        try {
          // Mark recovery as expired
          await supabase
            .from("trial_rights_revocations")
            .update({
              can_recover: false
            })
            .eq("user_id", recovery.user_id)
            .is("recovered_at", null);

          // Clear recovery window
          await supabase
            .from("customers")
            .update({
              recovery_window_until: null
            })
            .eq("user_id", recovery.user_id);

          // Move domains to next lifecycle phase (grace → redemption)
          await supabase
            .from("domains")
            .update({
              registrar_status: "grace",
              grace_until: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
            })
            .eq("user_id", recovery.user_id)
            .eq("registrar_status", "unpaid_hold");

          console.log(`[Trial Expiration] ❌ Recovery window expired for ${recovery.user_id}`);

          // Final notification
          await supabase
            .from("domain_notifications")
            .insert({
              domain_id: null,
              user_id: recovery.user_id,
              notification_type: "recovery_expired",
              scheduled_for: now.toISOString(),
              template_id: "recovery_window_expired"
            });
        } catch (error) {
          console.error(`[Trial Expiration] Exception processing recovery ${recovery.user_id}:`, error);
          results.errors.push(`Recovery ${recovery.user_id}: ${error.message}`);
        }
      }
    }

    // 3. Send warning notifications (2 days before expiration)
    const warningDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    const { data: upcomingExpirations, error: upcomingError } = await supabase
      .from("customers")
      .select("user_id, trial_ends_at")
      .eq("is_trial_account", true)
      .gte("trial_ends_at", now.toISOString())
      .lte("trial_ends_at", warningDate.toISOString());

    if (!upcomingError && upcomingExpirations && upcomingExpirations.length > 0) {
      console.log(`[Trial Expiration] Sending ${upcomingExpirations.length} warning notifications`);

      for (const upcoming of upcomingExpirations) {
        await supabase
          .from("domain_notifications")
          .insert({
            domain_id: null,
            user_id: upcoming.user_id,
            notification_type: "trial_expiring_soon",
            scheduled_for: now.toISOString(),
            template_id: "trial_expiring_warning",
            metadata: {
              trial_ends_at: upcoming.trial_ends_at,
              days_remaining: Math.ceil(
                (new Date(upcoming.trial_ends_at).getTime() - Date.now()) / (24 * 60 * 60 * 1000)
              )
            }
          });
      }
    }

    // Summary
    console.log(`[Trial Expiration] Completed:`, results);

    return new Response(
      JSON.stringify(results),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("[Trial Expiration] Fatal error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
