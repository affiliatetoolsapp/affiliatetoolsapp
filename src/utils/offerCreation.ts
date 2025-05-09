
import { supabase } from '@/integrations/supabase/client';
import { Offer } from '@/types';

/**
 * Creates a new offer using the Supabase RPC function
 */
export const createOffer = async (offerData: Partial<Offer>) => {
  try {
    // Convert the Offer type to a plain object that can be serialized
    const plainOfferData = JSON.parse(JSON.stringify(offerData));
    
    const { data, error } = await supabase
      .rpc('create_offer_safely', { p_offer_data: plainOfferData });

    if (error) {
      console.error('Error creating offer:', error);
      throw error;
    }

    return { success: true, offerId: data };
  } catch (error) {
    console.error('Error in createOffer:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error('Unknown error occurred')
    };
  }
};
