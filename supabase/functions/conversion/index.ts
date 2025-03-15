
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('Conversion function called with URL:', req.url);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    console.error('Method not allowed:', req.method);
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
  
  try {
    // Get request body
    let body;
    try {
      body = await req.json();
      console.log('Received conversion request body:', JSON.stringify(body));
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    // Validate required fields
    if (!body.clickId || !body.eventType) {
      console.error('Missing required fields. Received:', JSON.stringify(body));
      return new Response(JSON.stringify({ error: 'Missing required fields: clickId, eventType' }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase credentials. URL exists:', !!supabaseUrl, 'Key exists:', !!supabaseKey);
      return new Response(JSON.stringify({ error: 'Server configuration error' }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log(`Processing conversion for click ID: ${body.clickId}, event type: ${body.eventType}`);
    
    // Get click information
    console.log(`Querying clicks table for click_id: ${body.clickId}`);
    const { data: clickData, error: clickError } = await supabase
      .from('clicks')
      .select(`
        *,
        offer:offers(*)
      `)
      .eq('click_id', body.clickId)
      .maybeSingle();
    
    if (clickError) {
      console.error('Error retrieving click:', clickError);
      return new Response(JSON.stringify({ error: 'Error retrieving click data', details: clickError.message }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    if (!clickData) {
      console.error('Click not found for ID:', body.clickId);
      return new Response(JSON.stringify({ error: 'Click not found', clickId: body.clickId }), { 
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    console.log('Retrieved click data:', JSON.stringify(clickData));
    console.log('Offer data from click:', JSON.stringify(clickData.offer));
    
    // Validate offer data
    if (!clickData.offer || !clickData.offer.commission_type) {
      console.error('Invalid offer data:', clickData.offer);
      return new Response(JSON.stringify({ error: 'Invalid offer data', details: 'Offer or commission type missing' }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    // Calculate commission based on event type and offer commission model
    let commission = 0;
    
    if (clickData.offer.commission_type === 'RevShare' && body.revenue && clickData.offer.commission_percent) {
      commission = (parseFloat(body.revenue) * clickData.offer.commission_percent) / 100;
    } else if (
      (clickData.offer.commission_type === 'CPL' && body.eventType === 'lead') || 
      (clickData.offer.commission_type === 'CPA' && body.eventType === 'action') || 
      (clickData.offer.commission_type === 'CPS' && body.eventType === 'sale')
    ) {
      commission = clickData.offer.commission_amount || 0;
    }
    
    console.log(`Calculated commission: ${commission}`);
    
    // Create conversion record
    console.log('Creating conversion record with:', {
      click_id: body.clickId,
      event_type: body.eventType,
      revenue: body.revenue || null,
      commission,
      status: 'pending'
    });
    
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
      .single();
    
    if (conversionError) {
      console.error('Error creating conversion:', conversionError);
      return new Response(JSON.stringify({ error: 'Error creating conversion', details: conversionError.message }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    console.log('Created conversion record:', JSON.stringify(conversionData));
    
    // Update affiliate wallet with pending commission
    if (commission > 0 && clickData.affiliate_id) {
      console.log(`Updating wallet for affiliate ${clickData.affiliate_id} with ${commission} commission`);
      
      const { data: walletData, error: walletFetchError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', clickData.affiliate_id)
        .maybeSingle();
      
      if (walletFetchError) {
        console.error('Error fetching wallet:', walletFetchError);
      } else if (walletData) {
        const { error: walletUpdateError } = await supabase
          .from('wallets')
          .update({
            pending: walletData.pending + commission,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', clickData.affiliate_id);
        
        if (walletUpdateError) {
          console.error('Error updating wallet:', walletUpdateError);
        } else {
          console.log(`Successfully updated wallet for affiliate ${clickData.affiliate_id} with ${commission} commission`);
        }
      } else {
        console.error('Wallet not found for affiliate', clickData.affiliate_id);
      }
    }
    
    // Optional: Trigger custom postbacks for the affiliate
    if (clickData.affiliate_id) {
      console.log(`Checking for custom postbacks for affiliate ${clickData.affiliate_id}`);
      
      const { data: postbacks, error: postbackError } = await supabase
        .from('custom_postbacks')
        .select('*')
        .eq('affiliate_id', clickData.affiliate_id)
        .contains('events', [body.eventType]);
      
      if (postbackError) {
        console.error('Error fetching custom postbacks:', postbackError);
      } else if (postbacks && postbacks.length > 0) {
        console.log(`Found ${postbacks.length} custom postbacks to trigger for affiliate ${clickData.affiliate_id}`);
        
        // In a production environment, we would trigger external postbacks here
        // using fetch() to call each postback URL with the relevant parameters
      }
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      conversionId: conversionData.id,
      message: `Conversion recorded for ${body.eventType} event`
    }), { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
    
  } catch (error) {
    console.error('Error processing conversion:', error);
    console.error('Error stack:', error.stack);
    
    return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
