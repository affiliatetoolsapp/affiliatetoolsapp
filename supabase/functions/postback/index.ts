
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
  
  // Get URL and query parameters
  const url = new URL(req.url);
  const click_id = url.searchParams.get('click_id');
  const goal = url.searchParams.get('goal') || 'conversion';
  
  console.log(`Received postback request: click_id=${click_id}, goal=${goal}`)
  
  // Validate required fields
  if (!click_id) {
    console.error('Missing required field: click_id')
    return new Response(JSON.stringify({ error: 'Missing required field: click_id' }), { 
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
  
  try {
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
    console.log(`Looking for click with ID: ${click_id}`)
    const { data: clickData, error: clickError } = await supabase
      .from('clicks')
      .select('*, offer:offers(*)')
      .eq('click_id', click_id)
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
      return new Response(JSON.stringify({ error: 'Click not found' }), { 
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }
    
    console.log(`Found click data for affiliate_id ${clickData.affiliate_id}`)
    
    // Map the goal to event_type
    let event_type = goal;
    
    // Create basic conversion record
    const { data: conversionData, error: conversionError } = await supabase
      .from('conversions')
      .insert({
        click_id: click_id,
        event_type: event_type,
        revenue: 0,
        commission: 0, // We'll handle commission later
        status: 'pending',
        metadata: { source: 's2s_postback', goal: goal },
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
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: `Conversion recorded for click_id ${click_id}`,
      conversionId: conversionData.id
    }), { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
    
  } catch (error) {
    console.error('Error processing postback:', error)
    
    return new Response(JSON.stringify({ error: 'Internal server error' }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})
