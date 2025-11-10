import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface EnsureCustomerPayload {
  user_id: string;
  email: string;
  phone?: string | null;
  country_code?: string | null;
  phone_country_prefix?: string | null;
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

    const payload: EnsureCustomerPayload = await req.json();
    const { user_id, email, phone, country_code, phone_country_prefix } = payload;

    if (!user_id || !email) {
      return new Response(
        JSON.stringify({ error: 'Missing user_id or email' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Ensuring customer exists for:', email);

    // Check if customer already exists
    const { data: existing } = await supabase
      .from('customers')
      .select('id, role')
      .eq('user_id', user_id)
      .maybeSingle();

    if (existing) {
      console.log('Customer already exists:', existing.id);
      return new Response(
        JSON.stringify({
          success: true,
          customer_id: existing.id,
          role: existing.role,
          message: 'Customer already exists'
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create new customer
    console.log('Creating new customer...');
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .insert([{
        user_id,
        email,
        phone: phone || null,
        country_code: country_code || null,
        phone_country_prefix: phone_country_prefix || null,
        role: 'user'
      }])
      .select('id, role')
      .single();

    if (customerError) {
      // If duplicate key error (race condition), try to get existing
      if (customerError.code === '23505') {
        const { data: existingAfterRace } = await supabase
          .from('customers')
          .select('id, role')
          .eq('user_id', user_id)
          .maybeSingle();

        if (existingAfterRace) {
          return new Response(
            JSON.stringify({
              success: true,
              customer_id: existingAfterRace.id,
              role: existingAfterRace.role,
              message: 'Customer created (race condition handled)'
            }),
            {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
      }
      
      console.error('Error creating customer:', customerError);
      throw customerError;
    }

    console.log('Customer created successfully:', customer.id);

    // Create affiliate account
    console.log('Creating affiliate account...');
    const { error: affiliateError } = await supabase
      .from('affiliates')
      .insert([{
        user_id,
        email,
        status: 'pending',
        total_clicks: 0,
        total_conversions: 0,
        total_earnings: 0,
        pending_commission: 0,
        paid_commission: 0
      }]);

    if (affiliateError && affiliateError.code !== '23505') {
      console.error('Error creating affiliate (non-critical):', affiliateError);
    } else {
      console.log('Affiliate account created successfully');
    }

    return new Response(
      JSON.stringify({
        success: true,
        customer_id: customer.id,
        role: customer.role,
        message: 'Customer and affiliate created successfully'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in ensure-customer:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
