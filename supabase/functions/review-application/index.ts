
// Review application edge function (approve/reject)
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
    console.log(`Processing review application request:`, requestData)

    // Extract required fields
    const { applicationId, decision } = requestData
    
    if (!applicationId || !decision) {
      return createErrorResponse('Missing required fields: applicationId and decision')
    }
    
    if (decision !== 'approved' && decision !== 'rejected') {
      return createErrorResponse('Invalid decision: must be "approved" or "rejected"')
    }
    
    // Check if user is an advertiser or admin
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (userData?.role !== 'advertiser' && userData?.role !== 'admin') {
      return createErrorResponse('Only advertisers can review applications', 403)
    }
    
    // Get the application and offer details
    const { data: application, error: fetchError } = await supabaseAdmin
      .from('affiliate_offers')
      .select('id, offer_id, affiliate_id, status')
      .eq('id', applicationId)
      .single()
    
    if (fetchError || !application) {
      return createErrorResponse('Application not found', 404)
    }
    
    // Verify the advertiser owns the offer
    const { data: offer, error: offerError } = await supabaseAdmin
      .from('offers')
      .select('id, advertiser_id')
      .eq('id', application.offer_id)
      .single()
    
    if (offerError || !offer) {
      return createErrorResponse('Offer not found', 404)
    }
    
    if (offer.advertiser_id !== user.id && userData?.role !== 'admin') {
      return createErrorResponse('You do not have permission to review this application', 403)
    }
    
    if (application.status !== 'pending') {
      return createErrorResponse(`Cannot review application with status: ${application.status}`, 400)
    }
    
    // Update the application status
    const { data: updatedApplication, error: updateError } = await supabaseAdmin
      .from('affiliate_offers')
      .update({ 
        status: decision,
        reviewed_at: new Date().toISOString() 
      })
      .eq('id', applicationId)
      .select()
      .single()
    
    if (updateError) {
      console.error('Error updating application:', updateError)
      return createErrorResponse(`Failed to update: ${updateError.message}`, 500)
    }
    
    console.log(`Application ${decision} successfully:`, applicationId)
    return createSuccessResponse({ 
      message: `Application ${decision} successfully`,
      application: updatedApplication 
    })
  } catch (error) {
    console.error('Unhandled error:', error)
    return createErrorResponse('Server error: ' + (error.message || 'Unknown error'), 500)
  }
})
