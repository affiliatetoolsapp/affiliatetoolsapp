
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
  
  console.log('Received request with URL:', req.url);
  console.log('Query parameters:', Object.fromEntries(url.searchParams.entries()));
  
  // Check if environment variables are available
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    return new Response(
      JSON.stringify({ 
        error: 'Configuration error', 
        message: 'Missing required environment variables'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
  
  // Health check
  if (url.search === '') {
    console.log('Handling as health check request');
    return new Response(
      JSON.stringify({ status: 'healthy' }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
  
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
    
    // Log the raw response
    console.log('Raw response status:', response.status);
    console.log('Raw response headers:', Object.fromEntries(response.headers.entries()));
    
    // Get the response data
    const responseText = await response.text();
    console.log('Raw response body:', responseText);
    
    let data;
    try {
      // Try to parse as JSON
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Error parsing response as JSON:', parseError);
      data = { rawResponse: responseText };
    }
    
    console.log('Processed response data:', data);
    
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
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        stack: error instanceof Error ? error.stack : undefined
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
