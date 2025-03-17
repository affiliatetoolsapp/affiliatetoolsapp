
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-function-path',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    })
  }

  try {
    // Get the function path from the header
    const functionPath = req.headers.get('x-function-path') || '';
    
    // Parse the request body
    const requestData = await req.json();
    console.log(`Processing ${functionPath} request with data:`, requestData);

    // Route based on the function path
    switch (functionPath) {
      case 'apply':
        return await handleApply(req, requestData);
      case 'cancel':
        return await handleCancel(req, requestData);
      case 'review':
        return await handleReview(req, requestData);
      default:
        return new Response(
          JSON.stringify({ error: `Unknown function path: ${functionPath}` }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        );
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
})

// Handler for applying to an offer
async function handleApply(req: Request, data: any) {
  const { offerId, trafficSource, notes } = data;
  
  if (!offerId) {
    return new Response(
      JSON.stringify({ error: 'Offer ID is required' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }

  try {
    // Get the user's JWT from the request
    const authHeader = req.headers.get('Authorization')!;
    const jwt = authHeader.replace('Bearer ', '');

    // Get the user's ID from the JWT claims
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(jwt);
    if (userError) throw userError;

    const userId = userData.user.id;
    console.log(`User ${userId} is applying for offer ${offerId}`);

    // Check if the user has already applied for this offer
    const { data: existingApplication, error: checkError } = await supabaseAdmin
      .from('affiliate_offers')
      .select('id, status')
      .eq('affiliate_id', userId)
      .eq('offer_id', offerId)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existingApplication) {
      return new Response(
        JSON.stringify({ 
          error: `You have already applied for this offer (status: ${existingApplication.status})` 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Insert the new application
    const { data: newApplication, error: insertError } = await supabaseAdmin
      .from('affiliate_offers')
      .insert({
        affiliate_id: userId,
        offer_id: offerId,
        status: 'pending',
        applied_at: new Date().toISOString(),
        traffic_source: trafficSource || null,
        notes: notes || null
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Application submitted successfully',
        application: newApplication
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in apply handler:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to submit application' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
}

// Handler for canceling an application
async function handleCancel(req: Request, data: any) {
  const { applicationId } = data;
  
  if (!applicationId) {
    return new Response(
      JSON.stringify({ error: 'Application ID is required' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }

  try {
    // Get the user's JWT from the request
    const authHeader = req.headers.get('Authorization')!;
    const jwt = authHeader.replace('Bearer ', '');

    // Get the user's ID from the JWT claims
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(jwt);
    if (userError) throw userError;

    const userId = userData.user.id;
    console.log(`User ${userId} is canceling application ${applicationId}`);

    // Verify that the application belongs to the user and is in a pending state
    const { data: application, error: fetchError } = await supabaseAdmin
      .from('affiliate_offers')
      .select('id, status, affiliate_id')
      .eq('id', applicationId)
      .single();

    if (fetchError) throw fetchError;

    if (application.affiliate_id !== userId) {
      return new Response(
        JSON.stringify({ error: 'You are not authorized to cancel this application' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        }
      );
    }

    if (application.status !== 'pending') {
      return new Response(
        JSON.stringify({ error: `Cannot cancel application with status: ${application.status}` }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Delete the application
    const { error: deleteError } = await supabaseAdmin
      .from('affiliate_offers')
      .delete()
      .eq('id', applicationId);

    if (deleteError) throw deleteError;

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Application canceled successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in cancel handler:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to cancel application' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
}

// Handler for reviewing an application (approve or reject)
async function handleReview(req: Request, data: any) {
  const { applicationId, action } = data;
  
  if (!applicationId || !action) {
    return new Response(
      JSON.stringify({ error: 'Application ID and action are required' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }

  if (action !== 'approve' && action !== 'reject') {
    return new Response(
      JSON.stringify({ error: 'Action must be either "approve" or "reject"' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }

  try {
    // Get the user's JWT from the request
    const authHeader = req.headers.get('Authorization')!;
    const jwt = authHeader.replace('Bearer ', '');

    // Get the user's ID from the JWT claims
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(jwt);
    if (userError) throw userError;

    const userId = userData.user.id;
    console.log(`User ${userId} is ${action}ing application ${applicationId}`);

    // Get the application and related offer
    const { data: applicationData, error: fetchError } = await supabaseAdmin
      .from('affiliate_offers')
      .select(`
        id, 
        offer_id,
        status,
        offers:offer_id (
          id,
          advertiser_id
        )
      `)
      .eq('id', applicationId)
      .single();

    if (fetchError) throw fetchError;

    // Verify that the user is the advertiser who owns the offer
    if (applicationData.offers.advertiser_id !== userId) {
      return new Response(
        JSON.stringify({ error: 'You are not authorized to review this application' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        }
      );
    }

    if (applicationData.status !== 'pending') {
      return new Response(
        JSON.stringify({ error: `Cannot review application with status: ${applicationData.status}` }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Update the application status
    const { data: updatedApplication, error: updateError } = await supabaseAdmin
      .from('affiliate_offers')
      .update({
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewed_at: new Date().toISOString()
      })
      .eq('id', applicationId)
      .select()
      .single();

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Application ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
        application: updatedApplication
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in review handler:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to review application' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
}

// Initialize Supabase admin client using environment variables
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.23.0'

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)
