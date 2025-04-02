
import { supabase } from '@/integrations/supabase/client';

/**
 * Deletes an offer and all its related data
 */
export const deleteOfferCompletely = async (offerId: string) => {
  try {
    const { data, error } = await supabase
      .rpc('direct_delete_offer', { p_offer_id: offerId });

    if (error) {
      console.error('Error deleting offer:', error);
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error in deleteOfferCompletely:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error('Unknown error occurred')
    };
  }
};
