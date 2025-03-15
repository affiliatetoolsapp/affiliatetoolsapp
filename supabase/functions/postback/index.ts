
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
    
    // Get click information
    const { data: clickData, error: clickError } = await supabase
      .from('clicks')
      .select('*, offer:offers(*)')
      .eq('click_id', click_id)
      .single()
    
    if (clickError || !clickData) {
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
    
    // Create conversion record using existing conversion function
    const { data: conversion, error: conversionError } = await supabase.rpc(
      'log_conversion',
      {
        p_click_id: click_id,
        p_event_type: event_type,
        p_revenue: payout || 0,
        p_metadata: { source: 's2s_postback', goal: goal }
      }
    )
    
    if (conversionError) {
      console.error('Error recording conversion:', conversionError)
      return new Response(JSON.stringify({ error: 'Error recording conversion' }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
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
      conversionId: conversion
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
