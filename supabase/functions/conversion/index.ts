
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
    
    // Validate required fields
    if (!body.clickId || !body.eventType) {
      return new Response(JSON.stringify({ error: 'Missing required fields: clickId, eventType' }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    console.log(`Processing conversion for click ID: ${body.clickId}, event type: ${body.eventType}`)
    
    // Get click information
    const { data: clickData, error: clickError } = await supabase
      .from('clicks')
      .select(`
        *,
        offer:offers(*)
      `)
      .eq('click_id', body.clickId)
      .single()
    
    if (clickError || !clickData) {
      console.error('Click not found:', clickError)
      return new Response(JSON.stringify({ error: 'Click not found' }), { 
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }
    
    console.log('Retrieved click data:', clickData)
    
    // Calculate commission based on event type and offer commission model
    let commission = 0
    
    if (clickData.offer.commission_type === 'RevShare' && body.revenue && clickData.offer.commission_percent) {
      commission = (parseFloat(body.revenue) * clickData.offer.commission_percent) / 100
    } else if (
      (clickData.offer.commission_type === 'CPL' && body.eventType === 'lead') || 
      (clickData.offer.commission_type === 'CPA' && body.eventType === 'action') || 
      (clickData.offer.commission_type === 'CPS' && body.eventType === 'sale')
    ) {
      commission = clickData.offer.commission_amount || 0
    }
    
    console.log(`Calculated commission: ${commission}`)
    
    // Create conversion record
    const { data: conversionData, error: conversionError } = await supabase
      .from('conversions')
      .insert({
        click_id: body.clickId,
        event_type: body.eventType,
        revenue: body.revenue || null,
        commission,
        status: 'pending', // All conversions start as pending
        metadata: body.metadata || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (conversionError) {
      console.error('Error creating conversion:', conversionError)
      throw conversionError
    }
    
    console.log('Created conversion record:', conversionData)
    
    // Update affiliate wallet with pending commission
    if (commission > 0) {
      const { data: walletData, error: walletFetchError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', clickData.affiliate_id)
        .single()
      
      if (walletFetchError) {
        console.error('Error fetching wallet:', walletFetchError)
      } else if (walletData) {
        const { error: walletUpdateError } = await supabase
          .from('wallets')
          .update({
            pending: walletData.pending + commission,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', clickData.affiliate_id)
        
        if (walletUpdateError) {
          console.error('Error updating wallet:', walletUpdateError)
        } else {
          console.log(`Updated wallet for affiliate ${clickData.affiliate_id} with ${commission} commission`)
        }
      }
    }
    
    // Optional: Trigger custom postbacks for the affiliate
    const { data: postbacks } = await supabase
      .from('custom_postbacks')
      .select('*')
      .eq('affiliate_id', clickData.affiliate_id)
      .contains('events', [body.eventType])
    
    if (postbacks && postbacks.length > 0) {
      console.log(`Found ${postbacks.length} custom postbacks to trigger for affiliate ${clickData.affiliate_id}`)
    }
    
    // In a production environment, we would trigger external postbacks here
    // using fetch() to call each postback URL with the relevant parameters
    
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
