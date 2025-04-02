
import { supabase } from '@/integrations/supabase/client';

/**
 * A utility function for debugging Supabase Row Level Security (RLS) policies.
 * This function performs various database queries and checks permissions.
 */
export const debugRlsPolicies = async () => {
  const results: Record<string, any> = {};
  try {
    // Get current session for debugging
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.error('No active session found. User is not authenticated.');
      return { 
        success: false, 
        message: 'Not authenticated' 
      };
    }
    
    console.log('Current user:', session.user);
    
    // Test tables access
    const tables = [
      'users',
      'offers',
      'affiliate_offers',
      'clicks',
      'conversions',
      'tracking_links',
      'wallets',
      'payments',
      'payout_requests'
    ];
    
    // Try selecting from each table
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
          
        if (error) {
          console.error(`Access denied to ${table}:`, error);
          results[table] = {
            access: false,
            error: error.message
          };
        } else {
          console.log(`Access granted to ${table}`);
          results[table] = {
            access: true,
            sample: data
          };
        }
      } catch (err) {
        console.error(`Error testing ${table}:`, err);
        results[table] = {
          access: false,
          error: err instanceof Error ? err.message : String(err)
        };
      }
    }
    
    return {
      success: true,
      session: {
        user: session.user.id,
        email: session.user.email,
        role: session.user.user_metadata?.role
      },
      results
    };
  } catch (error) {
    console.error('Error in RLS debugging:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
};
