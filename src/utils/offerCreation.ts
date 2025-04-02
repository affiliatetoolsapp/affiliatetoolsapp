import { supabase } from "../integrations/supabase/client";

// Function for creating offers via RPC
export async function createOfferViaRPC(offerData: any) {
  console.log('Attempting to create offer with data:', JSON.stringify(offerData, null, 2));
  
  try {
    // Use the create_offer_simple RPC function
    const { data, error } = await supabase.rpc('create_offer_simple', { 
      p_offer_data: offerData 
    });
    
    if (error) {
      console.error('Error creating offer:', error);
      return { success: false, error };
    }
    
    console.log('Offer created successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Exception creating offer:', error);
    return { success: false, error };
  }
} 