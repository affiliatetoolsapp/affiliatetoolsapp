import { supabase } from "../integrations/supabase/client";

// Function for deleting offers via RPC
export async function deleteOfferViaRPC(offerId: string) {
  console.log('Attempting to delete offer with ID:', offerId);
  
  try {
    // Use the delete_offer_simple RPC function
    const { data, error } = await supabase.rpc('delete_offer_simple', {
      p_offer_id: offerId
    });
    
    if (error) {
      console.error('Error deleting offer:', error);
      return { success: false, error };
    }
    
    console.log('Offer deleted successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Exception deleting offer:', error);
    return { success: false, error };
  }
} 