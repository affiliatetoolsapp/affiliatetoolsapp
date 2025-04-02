
import { supabase } from '@/integrations/supabase/client';

export const debugJwtClaims = async () => {
  try {
    const { data, error } = await supabase.rpc('debug_jwt_claims');
    
    if (error) {
      console.error('Error getting JWT claims:', error);
      return {
        success: false,
        error: error.message
      };
    }
    
    console.log('JWT claims data:', data);
    return {
      success: true,
      claims: data
    };
  } catch (error) {
    console.error('Error in debugJwtClaims:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const testDatabaseAccess = async () => {
  try {
    const results = {};
    const tables = [
      'users',
      'offers',
      'affiliate_offers',
      'tracking_links',
      'clicks',
      'conversions',
      'payments',
      'wallets'
    ];
    
    // Test access to each table
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .limit(1);
      
      results[table] = {
        success: !error,
        message: error ? error.message : `Successfully queried ${table}`,
        data: data && data.length > 0 ? 'Data found' : 'No data found'
      };
    }
    
    console.log('Database access test results:', results);
    return {
      success: true,
      results
    };
  } catch (error) {
    console.error('Error in testDatabaseAccess:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
