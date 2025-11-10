import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface DomainPurchasePayload {
  user_id: string;
  domain: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { user_id, domain }: DomainPurchasePayload = await req.json();

    if (!user_id || !domain) {
      return new Response(
        JSON.stringify({ error: 'Missing user_id or domain' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const username = domain.replace('.com.rich', '');

    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', user_id)
      .maybeSingle();

    if (existingProfile) {
      return new Response(
        JSON.stringify({
          message: 'Profile already exists',
          profile_id: existingProfile.id
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .insert([{
        user_id,
        subdomain: username,
        display_name: username,
        bio: '',
        avatar_url: '',
        is_public: true,
        view_count: 0,
      }])
      .select()
      .single();

    if (profileError) throw profileError;

    const defaultLinks = [
      {
        profile_id: profile.id,
        title: 'Meu Website',
        url: 'https://',
        icon: 'Globe',
        position: 0,
        is_visible: false,
      },
    ];

    const { error: linksError } = await supabase
      .from('profile_links')
      .insert(defaultLinks);

    if (linksError) {
      console.error('Error creating default links:', linksError);
    }

    await supabase
      .from('audit_logs')
      .insert([{
        actor_id: user_id,
        action: 'profile_created',
        target_type: 'profile',
        target_id: profile.id,
        diff_json: { subdomain: username, domain },
      }]);

    return new Response(
      JSON.stringify({
        success: true,
        profile,
        message: `Profile created for ${username}`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in auto-create-profile:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
