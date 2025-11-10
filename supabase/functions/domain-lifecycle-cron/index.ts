import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface DomainTransition {
  domain_id: string;
  fqdn: string;
  current_status: string;
  new_status: string;
  reason: string;
}

/**
 * Domain Lifecycle Cron Job
 *
 * Runs daily to transition domains through lifecycle states:
 * - active → grace (payment failed, D+0 to D+15)
 * - grace → redemption (D+16 to D+45)
 * - redemption → registry_hold (D+46 to D+60)
 * - registry_hold → auction (D+61 to D+75)
 * - auction → pending_delete (D+76 to D+80)
 * - pending_delete → released (D+81+)
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
    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const transitions: DomainTransition[] = [];
    const now = new Date();

    console.log(`[Domain Lifecycle] Starting daily cron at ${now.toISOString()}`);

    // 1. Find domains that need to transition from grace to redemption
    const { data: graceExpired, error: graceError } = await supabase
      .from("domains")
      .select("id, fqdn, registrar_status, grace_until")
      .eq("registrar_status", "grace")
      .lt("grace_until", now.toISOString());

    if (!graceError && graceExpired) {
      console.log(`[Domain Lifecycle] Found ${graceExpired.length} domains exiting grace period`);

      for (const domain of graceExpired) {
        const result = await supabase.rpc("transition_domain_state", {
          p_domain_id: domain.id,
          p_new_state: "redemption",
          p_triggered_by: "system_cron",
          p_notes: "Grace period expired"
        });

        if (result.data?.success) {
          transitions.push({
            domain_id: domain.id,
            fqdn: domain.fqdn,
            current_status: "grace",
            new_status: "redemption",
            reason: "Grace period expired"
          });
        }
      }
    }

    // 2. Find domains that need to transition from redemption to registry_hold
    const { data: redemptionExpired, error: redemptionError } = await supabase
      .from("domains")
      .select("id, fqdn, registrar_status, redemption_until")
      .eq("registrar_status", "redemption")
      .lt("redemption_until", now.toISOString());

    if (!redemptionError && redemptionExpired) {
      console.log(`[Domain Lifecycle] Found ${redemptionExpired.length} domains exiting redemption`);

      for (const domain of redemptionExpired) {
        const result = await supabase.rpc("transition_domain_state", {
          p_domain_id: domain.id,
          p_new_state: "registry_hold",
          p_triggered_by: "system_cron",
          p_notes: "Redemption period expired"
        });

        if (result.data?.success) {
          transitions.push({
            domain_id: domain.id,
            fqdn: domain.fqdn,
            current_status: "redemption",
            new_status: "registry_hold",
            reason: "Redemption period expired"
          });
        }
      }
    }

    // 3. Find domains that need to transition from registry_hold to auction
    const { data: holdExpired, error: holdError } = await supabase
      .from("domains")
      .select("id, fqdn, registrar_status, registry_hold_until")
      .eq("registrar_status", "registry_hold")
      .lt("registry_hold_until", now.toISOString());

    if (!holdError && holdExpired) {
      console.log(`[Domain Lifecycle] Found ${holdExpired.length} domains entering auction`);

      for (const domain of holdExpired) {
        const result = await supabase.rpc("transition_domain_state", {
          p_domain_id: domain.id,
          p_new_state: "auction",
          p_triggered_by: "system_cron",
          p_notes: "Registry hold period expired"
        });

        if (result.data?.success) {
          transitions.push({
            domain_id: domain.id,
            fqdn: domain.fqdn,
            current_status: "registry_hold",
            new_status: "auction",
            reason: "Registry hold expired, entering auction"
          });
        }
      }
    }

    // 4. Find domains that need to transition from auction to pending_delete
    const { data: auctionExpired, error: auctionError } = await supabase
      .from("domains")
      .select("id, fqdn, registrar_status, auction_until")
      .eq("registrar_status", "auction")
      .lt("auction_until", now.toISOString());

    if (!auctionError && auctionExpired) {
      console.log(`[Domain Lifecycle] Found ${auctionExpired.length} domains exiting auction`);

      for (const domain of auctionExpired) {
        const result = await supabase.rpc("transition_domain_state", {
          p_domain_id: domain.id,
          p_new_state: "pending_delete",
          p_triggered_by: "system_cron",
          p_notes: "Auction period expired"
        });

        if (result.data?.success) {
          transitions.push({
            domain_id: domain.id,
            fqdn: domain.fqdn,
            current_status: "auction",
            new_status: "pending_delete",
            reason: "Auction ended, no bids"
          });
        }
      }
    }

    // 5. Find domains that need to be released (pending_delete → released)
    const { data: deleteExpired, error: deleteError } = await supabase
      .from("domains")
      .select("id, fqdn, registrar_status, pending_delete_until")
      .eq("registrar_status", "pending_delete")
      .lt("pending_delete_until", now.toISOString());

    if (!deleteError && deleteExpired) {
      console.log(`[Domain Lifecycle] Found ${deleteExpired.length} domains to release`);

      for (const domain of deleteExpired) {
        // Mark domain as released and available for re-registration
        await supabase
          .from("domains")
          .update({
            registrar_status: "released",
            user_id: null, // Remove user ownership
            suspension_reason: "Released back to inventory"
          })
          .eq("id", domain.id);

        // Log the event
        await supabase
          .from("domain_lifecycle_events")
          .insert({
            domain_id: domain.id,
            event_type: "released",
            old_status: "pending_delete",
            new_status: "released",
            triggered_by: "system_cron",
            notes: "Domain released after pending delete period"
          });

        transitions.push({
          domain_id: domain.id,
          fqdn: domain.fqdn,
          current_status: "pending_delete",
          new_status: "released",
          reason: "Domain released to inventory"
        });
      }
    }

    // 6. Send pending notifications
    const { data: pendingNotifications, error: notifError } = await supabase
      .from("domain_notifications")
      .select("*")
      .eq("status", "pending")
      .lte("scheduled_for", now.toISOString())
      .limit(100);

    let sentNotifications = 0;
    if (!notifError && pendingNotifications) {
      console.log(`[Domain Lifecycle] Found ${pendingNotifications.length} pending notifications`);

      for (const notification of pendingNotifications) {
        // Mark as sent (actual email/SMS sending would happen here via external service)
        await supabase
          .from("domain_notifications")
          .update({
            status: "sent",
            sent_at: now.toISOString()
          })
          .eq("id", notification.id);

        sentNotifications++;
      }
    }

    // Summary
    const summary = {
      timestamp: now.toISOString(),
      transitions_processed: transitions.length,
      notifications_sent: sentNotifications,
      transitions: transitions,
      errors: []
    };

    if (graceError) summary.errors.push({ stage: "grace", error: graceError.message });
    if (redemptionError) summary.errors.push({ stage: "redemption", error: redemptionError.message });
    if (holdError) summary.errors.push({ stage: "registry_hold", error: holdError.message });
    if (auctionError) summary.errors.push({ stage: "auction", error: auctionError.message });
    if (deleteError) summary.errors.push({ stage: "pending_delete", error: deleteError.message });
    if (notifError) summary.errors.push({ stage: "notifications", error: notifError.message });

    console.log(`[Domain Lifecycle] Completed: ${transitions.length} transitions, ${sentNotifications} notifications`);

    return new Response(
      JSON.stringify(summary),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("[Domain Lifecycle] Fatal error:", error);
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
