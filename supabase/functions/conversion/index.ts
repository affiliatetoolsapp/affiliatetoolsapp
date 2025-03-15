
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
      return new Response(JSON.stringify({ error: 'Click not found' }), { 
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
        metadata: body.metadata || null,
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
      conversionId: conversionData.id,
      message: `Conversion recorded for ${body.eventType} event`
    }), { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
    
  } catch (error) {
    console.error('Error processing conversion:', error)
    
    return new Response(JSON.stringify({ error: 'Internal server error' }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})
