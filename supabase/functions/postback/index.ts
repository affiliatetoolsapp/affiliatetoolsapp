
// Follow Deno standard library for HTTP server
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers to allow all origins - essential for external postback access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Simple response helpers
const createErrorResponse = (message, status = 400) => {
  return new Response(
    JSON.stringify({ error: message }),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

const createSuccessResponse = (data, status = 200) => {
  return new Response(
    JSON.stringify({ success: true, ...data }),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// Main server function - simplified for direct handling without auth
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    // Get the URL and parameters
    const url = new URL(req.url)
    console.log('Received postback request:', url.toString())

    // Simple health check
    if (url.searchParams.size === 0) {
      return createSuccessResponse({ status: 'healthy' })
    }

    // Critical parameters
    const click_id = url.searchParams.get('click_id') || 
                    url.searchParams.get('clickId') || 
                    url.searchParams.get('clickid')
    
    const goal = url.searchParams.get('goal') || 
               url.searchParams.get('event') || 
               'conversion'
               
    const payout = url.searchParams.get('payout') || 
                  url.searchParams.get('amount') || 
                  url.searchParams.get('revenue')

    // Basic validation
    if (!click_id) {
      console.error('Missing required field: click_id')
      return createErrorResponse('Missing required field: click_id')
    }

    console.log(`Processing postback: click_id=${click_id}, goal=${goal}, payout=${payout || 'not provided'}`)
    
    // Create Supabase client with the service role key - this is crucial
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
      {
        auth: {
          persistSession: false, // Important for serverless functions
          autoRefreshToken: false,
        },
      }
    )
    
    // Get click data
    const { data: clickData, error: clickError } = await supabaseAdmin
      .from('clicks')
      .select('*, offer:offers(*)')
      .eq('click_id', click_id)
      .maybeSingle()

    if (clickError) {
      console.error('Database error:', clickError)
      return createErrorResponse('Database error: ' + clickError.message, 500)
    }

    if (!clickData) {
      console.error('Click not found:', click_id)
      return createErrorResponse('Click not found', 404)
    }

    // Parse payout value if provided
    let revenue = null
    if (payout) {
      const parsedValue = parseFloat(payout)
      revenue = !isNaN(parsedValue) ? parsedValue : null
    }

    // Record the conversion
    const { data: conversionData, error: conversionError } = await supabaseAdmin
      .from('conversions')
      .insert({
        click_id: click_id,
        event_type: goal,
        revenue: revenue,
        commission: 0, // Will be calculated by a trigger or function
        status: 'pending',
        metadata: { 
          source: 's2s_postback',
          goal: goal,
          payout: revenue,
          request_url: req.url,
          all_parameters: Object.fromEntries(url.searchParams.entries())
        }
      })
      .select()
      .single()

    if (conversionError) {
      console.error('Error creating conversion:', conversionError)
      return createErrorResponse('Failed to record conversion: ' + conversionError.message, 500)
    }

    console.log('Conversion recorded successfully:', conversionData.id)

    // Simple success response
    return createSuccessResponse({ 
      message: `Conversion recorded for click_id ${click_id}`,
      conversionId: conversionData.id,
      goal,
      clickInfo: {
        offer_id: clickData.offer_id,
        affiliate_id: clickData.affiliate_id
      }
    })

  } catch (error) {
    console.error('Unhandled error:', error)
    return createErrorResponse('Server error: ' + (error.message || 'Unknown error'), 500)
  }
})
