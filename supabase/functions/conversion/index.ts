
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
  
  try {
    // Get request body
    const body = await req.json()
    console.log('Received conversion request:', body)
    
    // Validate required fields
    if (!body.clickId || !body.eventType) {
      console.error('Missing required fields')
      return new Response(JSON.stringify({ error: 'Missing required fields: clickId, eventType' }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase configuration')
      return new Response(JSON.stringify({ error: 'Server configuration error' }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Get click information
    console.log(`Looking for click with ID: ${body.clickId}`)
    const { data: clickData, error: clickError } = await supabase
      .from('clicks')
      .select(`
        *,
        offer:offers(*)
      `)
      .eq('click_id', body.clickId)
      .maybeSingle()
    
    if (clickError) {
      console.error('Error fetching click:', clickError)
      return new Response(JSON.stringify({ error: 'Error retrieving click data' }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }
    
    if (!clickData) {
      console.error('Click not found')
      
      // Additional diagnostic info
      console.log('Attempting to find click with similar ID pattern...');
      
      // Try to find clicks with similar patterns
      const { data: similarClicks } = await supabase
        .from('clicks')
        .select('click_id')
        .limit(5);
        
      if (similarClicks && similarClicks.length > 0) {
        console.log('Found some recent clicks:', similarClicks.map(c => c.click_id).join(', '));
      } else {
        console.log('No recent clicks found in database');
      }
      
      return new Response(JSON.stringify({ 
        error: 'Click not found',
        message: 'The clickId provided does not match any records in our system.',
        debug: { provided_click_id: body.clickId }
      }), { 
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }
    
    console.log('Found click data:', clickData)
    
    // Create conversion record
    const { data: conversionData, error: conversionError } = await supabase
      .from('conversions')
      .insert({
        click_id: body.clickId,
        event_type: body.eventType,
        revenue: body.revenue || null,
        commission: 0, // We'll handle commission calculations later
        status: 'pending',
        metadata: { 
          ...body.metadata || {},
          source: 'api_conversion',
          request_path: req.url
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (conversionError) {
      console.error('Error creating conversion:', conversionError)
      return new Response(JSON.stringify({ error: 'Failed to create conversion record' }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }
    
    console.log('Created conversion record:', conversionData)
    
    // Check if we need to forward this conversion to the affiliate's custom postback
    try {
      // Check if affiliate has a custom postback URL
      const { data: postbackData } = await supabase
        .from('custom_postbacks')
        .select('postback_url, events')
        .eq('affiliate_id', clickData.affiliate_id)
        .maybeSingle();
      
      if (postbackData?.postback_url && postbackData.events && postbackData.events.includes(body.eventType)) {
        console.log(`Forwarding conversion to affiliate postback URL: ${postbackData.postback_url}`);
        
        // Create the forward URL by replacing placeholders
        let forwardUrl = postbackData.postback_url
          .replace(/\{click_id\}/g, body.clickId)
          .replace(/\{goal\}/g, body.eventType);
        
        if (body.revenue !== null && body.revenue !== undefined) {
          forwardUrl = forwardUrl.replace(/\{payout\}/g, body.revenue.toString());
        }
        
        // Send the request asynchronously
        try {
          const forwardRes = await Promise.race<Response>([
            fetch(forwardUrl),
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('Postback forward timeout')), 5000)
            )
          ]);
          
          console.log(`Forwarded postback result: ${forwardRes.status}`);
        } catch (forwardErr) {
          console.error('Error forwarding postback:', forwardErr);
        }
      }
    } catch (postbackErr) {
      // Don't fail if postback forwarding fails
      console.error('Error checking affiliate postback:', postbackErr);
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      conversionId: conversionData.id,
      message: `Conversion recorded for ${body.eventType} event`,
      clickInfo: {
        offer_id: clickData.offer_id,
        affiliate_id: clickData.affiliate_id
      }
    }), { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
    
  } catch (error) {
    console.error('Error processing conversion:', error)
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})
