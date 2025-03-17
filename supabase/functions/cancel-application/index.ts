
// Cancel application edge function
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
    console.log(`Processing cancel application request:`, requestData)

    // Extract required fields
    const { applicationId } = requestData
    
    if (!applicationId) {
      return createErrorResponse('Missing required field: applicationId')
    }
    
    // Verify ownership and pending status
    const { data: application, error: fetchError } = await supabaseAdmin
      .from('affiliate_offers')
      .select('id, status')
      .eq('id', applicationId)
      .eq('affiliate_id', user.id)
      .single()
    
    if (fetchError || !application) {
      return createErrorResponse('Application not found or you do not have permission to cancel it', 404)
    }
    
    if (application.status !== 'pending') {
      return createErrorResponse(`Cannot cancel application with status: ${application.status}`, 400)
    }
    
    // Delete the application
    const { error: deleteError } = await supabaseAdmin
      .from('affiliate_offers')
      .delete()
      .eq('id', applicationId)
    
    if (deleteError) {
      console.error('Error cancelling application:', deleteError)
      return createErrorResponse(`Failed to cancel: ${deleteError.message}`, 500)
    }
    
    console.log('Application cancelled successfully:', applicationId)
    return createSuccessResponse({ 
      message: 'Application cancelled successfully',
      applicationId 
    })
  } catch (error) {
    console.error('Unhandled error:', error)
    return createErrorResponse('Server error: ' + (error.message || 'Unknown error'), 500)
  }
})
