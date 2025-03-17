
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Configure CORS headers to allow all origins
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Create a Supabase client with the service role key
const getServiceClient = (): SupabaseClient => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration');
  }
  
  return createClient(supabaseUrl, supabaseKey);
};

// Response helpers
const createErrorResponse = (message: string, status = 500, details?: Record<string, any>) => {
  return new Response(
    JSON.stringify({ 
      error: message,
      ...(details && { details }),
    }),
    { 
      status, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
};

const createSuccessResponse = (data: Record<string, any>, status = 200) => {
  return new Response(
    JSON.stringify({ success: true, ...data }),
    { 
      status, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
};

// Parse query parameters from URL
const parseQueryParams = (url: URL) => {
  // Get more flexible parameter handling - check multiple possible parameter names
  const click_id = url.searchParams.get('click_id') || 
                  url.searchParams.get('clickId') || 
                  url.searchParams.get('clickid') || 
                  url.searchParams.get('cid');
  
  // Get goal and handle both string and numeric formats
  const rawGoal = url.searchParams.get('goal') || 
                 url.searchParams.get('event') || 
                 'conversion';
  
  // Map numeric goals to string values if needed
  const goalMap: Record<string, string> = {
    '1': 'lead',
    '2': 'sale',
    '3': 'action',
    '4': 'deposit'
  };
  
  const goal = goalMap[rawGoal] || rawGoal;
  
  // Get payout if available
  const payout = url.searchParams.get('payout') || 
                url.searchParams.get('amount') || 
                url.searchParams.get('revenue');
  
  return {
    click_id,
    rawGoal,
    goal,
    payout,
    allParams: Object.fromEntries(url.searchParams.entries())
  };
};

// Parse payout value to a number if possible
const parsePayoutValue = (payout: string | null): number | null => {
  if (!payout) return null;
  
  const parsedValue = parseFloat(payout);
  return !isNaN(parsedValue) ? parsedValue : null;
};

// Find click ID when using placeholders
const resolveClickId = async (
  supabase: SupabaseClient,
  click_id: string
): Promise<{ actualClickId: string; lookupByCustomParam: boolean }> => {
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
    
    // If we have a parameter name like 'sub1', look for clicks with that in custom_params
    if (paramName) {
      console.log(`Looking for clicks with ${paramName} in custom_params`);
      
      const { data: customParamClicks, error: customParamError } = await supabase
        .from('clicks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (customParamError) {
        console.error('Error fetching clicks by custom param:', customParamError);
      } else if (customParamClicks?.length) {
        console.log(`Found ${customParamClicks.length} clicks, searching for ${paramName} match`);
        
        // Find the first click that has this param name in custom_params
        for (const click of customParamClicks) {
          if (click.custom_params && typeof click.custom_params === 'object') {
            console.log(`Checking click ${click.click_id} custom_params:`, click.custom_params);
            
            // If this is the click we need, use its ID
            if (click.custom_params[paramName]) {
              actualClickId = click.click_id;
              console.log(`Found match! Using click ID ${actualClickId} for conversion`);
              break;
            }
          }
        }
      }
    }
  }
  
  return { actualClickId, lookupByCustomParam };
};

// Find the most recent click if we couldn't find by custom param
const findFallbackClick = async (
  supabase: SupabaseClient
): Promise<string | null> => {
  const { data: recentClicks, error: recentError } = await supabase
    .from('clicks')
    .select('*, offer:offers(*)')
    .order('created_at', { ascending: false })
    .limit(50);
  
  if (recentError) {
    console.error('Error fetching recent clicks:', recentError);
    return null;
  }
  
  if (recentClicks?.length) {
    console.log(`Found ${recentClicks.length} recent clicks, using most recent as fallback`);
    
    // As a last resort, just use the most recent click
    if (recentClicks[0]) {
      return recentClicks[0].click_id;
    }
  }
  
  return null;
};

// Get click data
const getClickData = async (
  supabase: SupabaseClient,
  clickId: string
) => {
  console.log(`Looking for click with ID: ${clickId}`);
  const { data, error } = await supabase
    .from('clicks')
    .select('*, offer:offers(*)')
    .eq('click_id', clickId)
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching click:', error);
    throw error;
  }
  
  return data;
};

// Log diagnostic info when click is not found
const logDiagnosticInfo = async (supabase: SupabaseClient) => {
  console.log('Attempting to find click with similar ID pattern...');
  
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
};

// Create conversion record
const createConversionRecord = async (
  supabase: SupabaseClient,
  params: {
    clickId: string;
    goal: string;
    rawGoal: string;
    revenue: number | null;
    requestUrl: string;
    originalClickId?: string | null;
    allParams: Record<string, string>;
  }
) => {
  const { clickId, goal, rawGoal, revenue, requestUrl, originalClickId, allParams } = params;
  
  const { data, error } = await supabase
    .from('conversions')
    .insert({
      click_id: clickId,
      event_type: goal,
      revenue: revenue,
      commission: 0, // We'll handle commission calculation in a trigger or function
      status: 'pending',
      metadata: { 
        source: 's2s_postback', 
        goal: goal,
        raw_goal: rawGoal,
        payout: revenue,
        request_url: requestUrl,
        original_click_id: originalClickId,
        all_parameters: allParams
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating conversion:', error);
    throw error;
  }
  
  console.log('Created conversion record:', data);
  return data;
};

// Forward postback to affiliate if needed
const forwardToAffiliate = async (
  supabase: SupabaseClient,
  affiliateId: string,
  params: {
    clickId: string;
    goal: string;
    revenue: number | null;
  }
) => {
  try {
    // Check if affiliate has a custom postback URL
    const { data: postbackData } = await supabase
      .from('custom_postbacks')
      .select('postback_url, events')
      .eq('affiliate_id', affiliateId)
      .maybeSingle();
    
    if (!postbackData?.postback_url || !postbackData.events || !postbackData.events.includes(params.goal)) {
      return; // No forwarding needed
    }
    
    console.log(`Forwarding conversion to affiliate postback URL: ${postbackData.postback_url}`);
    
    // Create the forward URL by replacing placeholders
    let forwardUrl = postbackData.postback_url
      .replace(/\{click_id\}/g, params.clickId)
      .replace(/\{goal\}/g, params.goal);
    
    if (params.revenue !== null) {
      forwardUrl = forwardUrl.replace(/\{payout\}/g, params.revenue.toString());
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
  } catch (postbackErr) {
    // Don't fail if postback forwarding fails
    console.error('Error checking affiliate postback:', postbackErr);
  }
};

// Main handler function
const handlePostback = async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  
  // For health checks or simple status checks, return a 200 response
  if (url.searchParams.size === 0) {
    return createSuccessResponse({ status: 'healthy' });
  }
  
  // Get URL and query parameters
  console.log('Received postback request with URL:', req.url);
  console.log('All query parameters:', Object.fromEntries(url.searchParams.entries()));
  
  // Parse the query parameters
  const { click_id, rawGoal, goal, payout, allParams } = parseQueryParams(url);
  
  console.log(`Processing postback with: click_id=${click_id}, goal=${goal}, raw goal=${rawGoal}, payout=${payout || 'not provided'}`);
  
  // Validate required fields
  if (!click_id) {
    console.error('Missing required field: click_id');
    return createErrorResponse('Missing required field: click_id', 400);
  }
  
  try {
    // Create a Supabase client with service role key
    const supabase = getServiceClient();
    
    // Resolve the click ID (handle placeholders)
    const { actualClickId, lookupByCustomParam } = await resolveClickId(supabase, click_id);
    
    // If we couldn't find a match by custom param and we're still using the original click_id,
    // try to find a fallback click
    let finalClickId = actualClickId;
    if (lookupByCustomParam && actualClickId === click_id) {
      const fallbackClickId = await findFallbackClick(supabase);
      if (fallbackClickId) {
        finalClickId = fallbackClickId;
        console.log(`Using most recent click ID for conversion: ${finalClickId}`);
      }
    }
    
    // Get the click data
    const clickData = await getClickData(supabase, finalClickId);
    
    if (!clickData) {
      console.error('Click not found');
      await logDiagnosticInfo(supabase);
      
      return createErrorResponse(
        'Click not found', 
        404, 
        { 
          message: 'The click_id provided does not match any records in our system.',
          debug: { 
            provided_click_id: click_id,
            actual_click_id: finalClickId,
            lookupByCustomParam
          }
        }
      );
    }
    
    console.log(`Found click data for affiliate_id ${clickData.affiliate_id}, offer_id ${clickData.offer_id}`);
    
    // Parse payout if provided
    const revenue = parsePayoutValue(payout);
    
    // Create conversion record
    const conversionData = await createConversionRecord(supabase, {
      clickId: finalClickId,
      goal,
      rawGoal,
      revenue,
      requestUrl: req.url,
      originalClickId: click_id !== finalClickId ? click_id : null,
      allParams
    });
    
    // Forward to affiliate if needed
    await forwardToAffiliate(supabase, clickData.affiliate_id, {
      clickId: finalClickId,
      goal,
      revenue
    });
    
    return createSuccessResponse({ 
      message: `Conversion recorded for click_id ${finalClickId}`,
      conversionId: conversionData.id,
      goal,
      clickInfo: {
        offer_id: clickData.offer_id,
        affiliate_id: clickData.affiliate_id
      }
    });
    
  } catch (error) {
    console.error('Error processing postback:', error);
    
    return createErrorResponse(
      'Internal server error',
      500,
      { message: error instanceof Error ? error.message : 'Unknown error occurred' }
    );
  }
};

// Main server
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  return handlePostback(req);
});
