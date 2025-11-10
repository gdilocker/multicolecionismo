import { createClient } from 'npm:@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const jsonResponse = (body: any, status = 200) => {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
};

Deno.serve(async (req: Request) => {
  console.log('[EDGE] Received request:', req.method, req.url);

  if (req.method === 'OPTIONS') {
    console.log('[EDGE] OPTIONS request, returning CORS headers');
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    console.log('[EDGE] Auth header present:', !!authHeader);

    if (!authHeader) {
      console.error('[EDGE] Missing authorization header');
      return jsonResponse({ error: 'Missing authorization header' }, 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    console.log('[EDGE] Creating Supabase clients...');

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    console.log('[EDGE] Getting user from token...');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

    if (userError) {
      console.error('[EDGE] User error:', userError);
      return jsonResponse({ error: 'Unauthorized: ' + userError.message }, 401);
    }

    if (!user) {
      console.error('[EDGE] No user found');
      return jsonResponse({ error: 'Unauthorized: No user' }, 401);
    }

    console.log('[EDGE] User authenticated:', user.email, user.id);

    console.log('[EDGE] Parsing form data...');
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const fileExt = formData.get('extension') as string;

    console.log('[EDGE] File received:', {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      extension: fileExt
    });

    if (!file || !fileExt) {
      console.error('[EDGE] Missing file or extension');
      return jsonResponse({ error: 'Missing file or extension' }, 400);
    }

    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      console.error('[EDGE] File too large:', file.size);
      return jsonResponse({ error: 'File too large. Maximum 10MB' }, 400);
    }

    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    console.log('[EDGE] Generated filename:', fileName);

    console.log('[EDGE] Reading file as blob...');
    const fileBlob = await file.arrayBuffer();
    console.log('[EDGE] Blob size:', fileBlob.byteLength, 'bytes');

    console.log('[EDGE] Uploading to storage...');
    const { data, error } = await supabaseAdmin.storage
      .from('social-media')
      .upload(fileName, fileBlob, {
        contentType: file.type,
        cacheControl: '86400',
        upsert: false,
      });

    if (error) {
      console.error('[EDGE] Upload error:', error);
      return jsonResponse({ error: `Upload failed: ${error.message}` }, 500);
    }

    console.log('[EDGE] Upload success, path:', data.path);

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('social-media')
      .getPublicUrl(data.path);

    console.log('[EDGE] Public URL generated:', publicUrl);

    return jsonResponse({ url: publicUrl }, 200);

  } catch (error: any) {
    console.error('[EDGE] Unexpected error:', error);
    return jsonResponse({ error: error.message || 'Internal server error' }, 500);
  }
});