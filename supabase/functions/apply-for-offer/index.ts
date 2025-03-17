
// Apply for offer edge function
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers for external access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Response helpers
const createErrorResponse = (message: string, status = 400) => {
  return new Response(
    JSON.stringify({ error: message }),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

const createSuccessResponse = (data: any, status = 200) => {
  return new Response(
    JSON.stringify({ success: true, ...data }),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// Main server function
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    // Create Supabase client with auth from request
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_ANON_KEY') || '',
      {
        global: { headers: { Authorization: req.headers.get('Authorization')! } },
        auth: { persistSession: false }
      }
    )
    
    // Create admin client for operations that need elevated privileges
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    )

    // Get user data from token
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return createErrorResponse('Unauthorized', 401)
    }

    // Get request body
    const requestData = await req.json().catch(() => ({}))
    console.log(`Processing apply for offer request:`, requestData)

    // Extract required fields
    const { offerId, trafficSource, notes } = requestData
    
    if (!offerId) {
      return createErrorResponse('Missing required field: offerId')
    }

    // Check if user is an affiliate
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (userData?.role !== 'affiliate') {
      return createErrorResponse('Only affiliates can apply for offers', 403)
    }

    // Check if already applied
    const { data: existingApplication } = await supabaseAdmin
      .from('affiliate_offers')
      .select('id, status')
      .eq('affiliate_id', user.id)
      .eq('offer_id', offerId)
      .maybeSingle()
    
    if (existingApplication) {
      return createErrorResponse(`You have already applied for this offer (status: ${existingApplication.status})`, 400)
    }

    // Create application
    const { data: application, error: applicationError } = await supabaseAdmin
      .from('affiliate_offers')
      .insert({
        affiliate_id: user.id,
        offer_id: offerId,
        applied_at: new Date().toISOString(),
        traffic_source: trafficSource || null,
        notes: notes || null,
        status: 'pending'
      })
      .select()
      .single()
    
    if (applicationError) {
      console.error('Error creating application:', applicationError)
      return createErrorResponse(`Failed to apply: ${applicationError.message}`, 500)
    }

    console.log('Application created successfully:', application.id)
    return createSuccessResponse({ 
      message: 'Application submitted successfully',
      application 
    })
  } catch (error) {
    console.error('Unhandled error:', error)
    return createErrorResponse('Server error: ' + (error.message || 'Unknown error'), 500)
  }
})
