
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// Define CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Get the Supabase URL and service role key from environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  // Handle health checks (requests without query parameters)
  const url = new URL(req.url);
  if (url.search === '') {
    console.log('Received health check request');
    return new Response(
      JSON.stringify({ status: 'healthy' }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
  
  console.log('Received postback request with URL:', req.url);
  console.log('Query parameters:', Object.fromEntries(url.searchParams.entries()));
  
  try {
    // Extract all query parameters to forward
    const queryParams = url.searchParams.toString();
    
    // Construct the destination URL (internal Supabase function)
    const postbackUrl = `${supabaseUrl}/functions/v1/postback?${queryParams}`;
    
    console.log(`Forwarding request to internal endpoint: ${postbackUrl}`);
    
    // Forward the request to the internal Supabase function
    const response = await fetch(postbackUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      }
    });
    
    // Get the response data
    const data = await response.json();
    
    console.log('Received response from internal function:', {
      status: response.status,
      data: data
    });
    
    // Return the response to the client
    return new Response(
      JSON.stringify(data),
      { 
        status: response.status, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error forwarding postback request:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
