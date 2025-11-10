import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.75.0";
import { corsMiddleware } from "../_shared/cors.middleware.ts";
import { rateLimitMiddleware } from "../_shared/rateLimit.middleware.ts";

Deno.serve(async (req: Request) => {
  // Handle CORS
  const corsResult = corsMiddleware(req);
  if (corsResult instanceof Response) return corsResult;
  const corsHeaders = corsResult || {};

  // Rate limiting
  const rateLimitResponse = await rateLimitMiddleware(req, 'POST:/revoke-sessions');
  if (rateLimitResponse) return rateLimitResponse;

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    // Create Supabase client with user's auth
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! }
        }
      }
    );

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Use admin client for session revocation
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Sign out user from all sessions
    // This will invalidate all refresh tokens
    const { error: signOutError } = await adminClient.auth.admin.signOut(user.id, 'global');

    if (signOutError) {
      console.error('[Revoke Sessions] Error:', signOutError);
      throw new Error('Failed to revoke sessions');
    }

    // Log security event
    await adminClient.from('audit_logs').insert({
      user_id: user.id,
      action: 'settings_changed',
      severity: 'high',
      details: {
        description: 'All sessions revoked',
        ip: req.headers.get('x-forwarded-for') || 'unknown'
      },
      success: true
    });

    // Broadcast logout to all tabs (client will handle via BroadcastChannel)
    return new Response(
      JSON.stringify({
        success: true,
        message: 'All sessions have been revoked',
        broadcast: {
          type: 'FORCE_LOGOUT',
          userId: user.id,
          timestamp: Date.now()
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error: any) {
    console.error('[Revoke Sessions] Error:', error);

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message || 'Failed to revoke sessions'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
