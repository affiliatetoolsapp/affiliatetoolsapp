
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
  const goal = url.searchParams.get('goal') || 'conversion'; // Default to 'conversion' if no goal
  const payout = url.searchParams.get('payout') ? parseFloat(url.searchParams.get('payout')!) : null;
  
  // Validate required fields
  if (!click_id) {
    return new Response(JSON.stringify({ error: 'Missing required field: click_id' }), { 
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
  
  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    console.log(`Processing postback for click_id ${click_id}, goal ${goal}, payout ${payout}`)
    
    // Get click information
    const { data: clickData, error: clickError } = await supabase
      .from('clicks')
      .select('*, offer:offers(*)')
      .eq('click_id', click_id)
      .single()
    
    if (clickError || !clickData) {
      console.error('Click not found:', clickError)
      return new Response(JSON.stringify({ error: 'Click not found' }), { 
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }
    
    console.log(`Processing postback for click_id ${click_id}, goal ${goal}, affiliate_id ${clickData.affiliate_id}`)
    
    // Map the goal to event_type for our database
    let event_type = goal;
    // If goal is numeric, map to appropriate event types
    if (!isNaN(parseInt(goal))) {
      const goalNum = parseInt(goal);
      switch(goalNum) {
        case 1: event_type = 'lead'; break;
        case 2: event_type = 'sale'; break;
        case 3: event_type = 'action'; break;
        case 4: event_type = 'deposit'; break;
        default: event_type = `goal_${goal}`; // For any other numeric goals
      }
    }
    
    console.log(`Mapped goal ${goal} to event_type ${event_type}`)
    
    // Calculate commission based on event type and offer commission model
    let commission = 0
    
    if (clickData.offer.commission_type === 'RevShare' && payout && clickData.offer.commission_percent) {
      commission = (payout * clickData.offer.commission_percent) / 100
    } else if (
      (clickData.offer.commission_type === 'CPL' && event_type === 'lead') || 
      (clickData.offer.commission_type === 'CPA' && event_type === 'action') || 
      (clickData.offer.commission_type === 'CPS' && event_type === 'sale')
    ) {
      commission = clickData.offer.commission_amount || 0
    }
    
    console.log(`Calculated commission: ${commission}`)
    
    // Create conversion record
    const { data: conversionData, error: conversionError } = await supabase
      .from('conversions')
      .insert({
        click_id: click_id,
        event_type: event_type,
        revenue: payout || 0,
        commission,
        status: 'pending', // All conversions start as pending
        metadata: { source: 's2s_postback', goal: goal },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (conversionError) {
      console.error('Error recording conversion:', conversionError)
      return new Response(JSON.stringify({ error: 'Error recording conversion' }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
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
    
    // Get affiliate's postback URL if they have one
    const { data: postbackData, error: postbackError } = await supabase
      .from('custom_postbacks')
      .select('*')
      .eq('affiliate_id', clickData.affiliate_id)
      .maybeSingle()
    
    if (postbackError) {
      console.error('Error getting affiliate postback:', postbackError)
    }
    
    // If affiliate has a postback URL and the event type is in their list of events to forward, call it
    if (postbackData?.postback_url && (!postbackData.events || postbackData.events.includes(event_type))) {
      try {
        console.log(`Forwarding postback to affiliate URL: ${postbackData.postback_url}`)
        
        // Replace placeholders with actual values
        let affiliateUrl = postbackData.postback_url
          .replace(/{click_id}/g, click_id)
          .replace(/{goal}/g, goal);
          
        if (payout !== null) {
          affiliateUrl = affiliateUrl.replace(/{payout}/g, payout.toString());
        }
        
        // Make HTTP request to affiliate's postback URL
        const response = await fetch(affiliateUrl);
        console.log(`Affiliate postback response status: ${response.status}`);
      } catch (forwardError) {
        console.error('Error forwarding to affiliate postback:', forwardError);
        // Continue - don't fail the whole request if forwarding fails
      }
    }
    
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
