import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

/**
 * QR Code Generator Edge Function
 * Generates QR codes for 2FA setup without client-side dependencies
 */
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== 'GET') {
    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders
    });
  }

  try {
    const url = new URL(req.url);
    const data = url.searchParams.get('data');

    if (!data) {
      return new Response('Missing data parameter', {
        status: 400,
        headers: corsHeaders
      });
    }

    // Validate otpauth:// format
    if (!data.startsWith('otpauth://')) {
      return new Response('Invalid OTP URI format', {
        status: 400,
        headers: corsHeaders
      });
    }

    const size = parseInt(url.searchParams.get('size') || '220');

    // Use QR Server API for generation
    // This is a free, reliable service for QR code generation
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}&format=png`;

    // Fetch QR code image
    const qrResponse = await fetch(qrApiUrl);

    if (!qrResponse.ok) {
      throw new Error('QR generation failed');
    }

    // Get image buffer
    const imageBuffer = await qrResponse.arrayBuffer();

    // Return image with proper headers
    return new Response(imageBuffer, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'image/png',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('QR generation error:', error);
    return new Response('QR generation failed', {
      status: 500,
      headers: corsHeaders
    });
  }
});
