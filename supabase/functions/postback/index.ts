
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
  console.log('Received postback request with URL:', req.url);
  console.log('All query parameters:', Object.fromEntries(url.searchParams.entries()));
  
  // More flexible parameter handling - check multiple possible parameter names
  const click_id = url.searchParams.get('click_id') || url.searchParams.get('clickId') || url.searchParams.get('clickid') || url.searchParams.get('cid');
  
  // Get goal and handle both string and numeric formats
  const rawGoal = url.searchParams.get('goal') || url.searchParams.get('event') || 'conversion';
  
  // Map numeric goals to string values if needed
  const goalMap: Record<string, string> = {
    '1': 'lead',
    '2': 'sale',
    '3': 'action',
    '4': 'deposit'
  };
  
  const goal = goalMap[rawGoal] || rawGoal;
  
  // Get payout if available
  const payout = url.searchParams.get('payout') || url.searchParams.get('amount') || url.searchParams.get('revenue');
  
  console.log(`Processing postback with: click_id=${click_id}, goal=${goal}, raw goal=${rawGoal}, payout=${payout || 'not provided'}`);
  
  // Validate required fields
  if (!click_id) {
    console.error('Missing required field: click_id');
    return new Response(JSON.stringify({ error: 'Missing required field: click_id' }), { 
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
  
  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase configuration');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // The click_id might be a placeholder or the actual ID. Check if it contains variables
    let actualClickId = click_id;
    let lookupByCustomParam = false;
    
    // If the click_id contains {sub1}, {sub2}, etc. then we need to check custom params
    if (click_id.includes('{sub') || click_id === '{clickId}') {
      lookupByCustomParam = true;
      console.log('Detected placeholder in click_id, will search by custom_params:', click_id);
      
      // Try to extract what param name we need to look for
      let paramName = null;
      if (click_id.startsWith('{') && click_id.endsWith('}')) {
        paramName = click_id.substring(1, click_id.length - 1);
        console.log('Extracted param name from placeholder:', paramName);
      }
    }
    
    // Get click information
    console.log(`Looking for click with ID: ${actualClickId}`);
    let clickQuery = supabase.from('clicks').select('*, offer:offers(*)');
    
    if (lookupByCustomParam) {
      // If we're using a placeholder, try to find clicks with custom params recently first
      const { data: recentClicks, error: recentError } = await supabase
        .from('clicks')
        .select('*, offer:offers(*)')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (recentError) {
        console.error('Error fetching recent clicks:', recentError);
      } else if (recentClicks?.length) {
        console.log(`Found ${recentClicks.length} recent clicks, searching for custom params match`);
        
        // This can be improved to match the exact placeholder pattern,
        // but for now we'll just take the most recent click
        if (recentClicks[0]) {
          actualClickId = recentClicks[0].click_id;
          console.log(`Using most recent click ID for conversion: ${actualClickId}`);
        }
      }
    }
    
    const { data: clickData, error: clickError } = await supabase
      .from('clicks')
      .select('*, offer:offers(*)')
      .eq('click_id', actualClickId)
      .maybeSingle();
    
    if (clickError) {
      console.error('Error fetching click:', clickError);
      return new Response(JSON.stringify({ error: 'Error retrieving click data' }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    if (!clickData) {
      console.error('Click not found');
      
      // Additional diagnostic info to help troubleshoot
      console.log('Attempting to find click with similar ID pattern...');
      
      // Try to find clicks with similar patterns in case of encoding issues
      const { data: similarClicks } = await supabase
        .from('clicks')
        .select('click_id, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (similarClicks && similarClicks.length > 0) {
        console.log('Found some recent clicks:', 
          similarClicks.map(c => ({ id: c.click_id, date: c.created_at }))
        );
      } else {
        console.log('No recent clicks found in database.');
      }
      
      return new Response(JSON.stringify({ 
        error: 'Click not found', 
        message: 'The click_id provided does not match any records in our system.',
        debug: { 
          provided_click_id: click_id,
          actual_click_id: actualClickId,
          lookupByCustomParam: lookupByCustomParam
        }
      }), { 
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    console.log(`Found click data for affiliate_id ${clickData.affiliate_id}, offer_id ${clickData.offer_id}`);
    
    // Parse payout if provided
    let revenue = null;
    if (payout) {
      const parsedPayout = parseFloat(payout);
      if (!isNaN(parsedPayout)) {
        revenue = parsedPayout;
        console.log(`Parsed payout: ${revenue}`);
      } else {
        console.warn(`Invalid payout value: ${payout}`);
      }
    }
    
    // Create conversion record
    const { data: conversionData, error: conversionError } = await supabase
      .from('conversions')
      .insert({
        click_id: actualClickId,
        event_type: goal,
        revenue: revenue,
        commission: 0, // We'll handle commission calculation in a trigger or function
        status: 'pending',
        metadata: { 
          source: 's2s_postback', 
          goal: goal,
          raw_goal: rawGoal,
          payout: payout || null,
          request_url: req.url,
          original_click_id: click_id !== actualClickId ? click_id : null,
          all_parameters: Object.fromEntries(url.searchParams.entries())
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (conversionError) {
      console.error('Error creating conversion:', conversionError);
      return new Response(JSON.stringify({ error: 'Failed to create conversion record' }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    console.log('Created conversion record:', conversionData);
    
    // Check if we need to forward this conversion to the affiliate's custom postback
    try {
      // Check if affiliate has a custom postback URL
      const { data: postbackData } = await supabase
        .from('custom_postbacks')
        .select('postback_url, events')
        .eq('affiliate_id', clickData.affiliate_id)
        .maybeSingle();
      
      if (postbackData?.postback_url && postbackData.events && postbackData.events.includes(goal)) {
        console.log(`Forwarding conversion to affiliate postback URL: ${postbackData.postback_url}`);
        
        // Create the forward URL by replacing placeholders
        let forwardUrl = postbackData.postback_url
          .replace(/\{click_id\}/g, actualClickId)
          .replace(/\{goal\}/g, goal);
        
        if (revenue !== null) {
          forwardUrl = forwardUrl.replace(/\{payout\}/g, revenue.toString());
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
      message: `Conversion recorded for click_id ${actualClickId}`,
      conversionId: conversionData.id,
      goal: goal,
      clickInfo: {
        offer_id: clickData.offer_id,
        affiliate_id: clickData.affiliate_id
      }
    }), { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
    
  } catch (error) {
    console.error('Error processing postback:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});

