
import { supabase } from '@/integrations/supabase/client';

// Define known table names to avoid TypeScript errors
type TableName = 
  | "affiliate_offers" 
  | "users" 
  | "offers" 
  | "clicks" 
  | "conversions" 
  | "custom_postbacks" 
  | "payments" 
  | "payout_requests" 
  | "pending_applications_view" 
  | "system_logs" 
  | "system_settings" 
  | "tracking_links" 
  | "wallets";

type ViewName = 
  | "affiliate_offer_details" 
  | "affiliate_offers_match" 
  | "affiliate_offers_with_advertiser" 
  | "affiliate_offers_with_offers";

/**
 * Utility for debugging database structure and contents
 */
export const debugTable = async (tableName: TableName | ViewName, limit: number = 10) => {
  try {
    console.log(`Fetching ${limit} records from ${tableName}...`);
    
    const { data, error } = await supabase
      .from(tableName as any)
      .select('*')
      .limit(limit);
    
    if (error) {
      console.error(`Error fetching from ${tableName}:`, error);
      return { success: false, error };
    }
    
    console.log(`Data from ${tableName}:`, data);
    
    if (data && data.length > 0) {
      const sample = data[0];
      console.log(`Sample structure:`, Object.keys(sample));
      console.log(`Column types:`, Object.entries(sample).map(([key, value]) => 
        `${key}: ${typeof value}`
      ));
    } else {
      console.log(`No records found in ${tableName}`);
    }
    
    return { success: true, data };
  } catch (error) {
    console.error(`Error in debugTable for ${tableName}:`, error);
    return { success: false, error };
  }
};

/**
 * Utility for debugging RPC function signatures
 */
export const debugRpcFunction = async (functionName: string) => {
  try {
    console.log(`Checking RPC function ${functionName}`);
    
    const { data, error } = await supabase.rpc('debug_jwt_claims');
    
    if (error) {
      console.error(`Error checking RPC function ${functionName}:`, error);
      return { success: false, error };
    }
    
    return { success: true, data };
  } catch (error) {
    console.error(`Error in debugRpcFunction for ${functionName}:`, error);
    return { success: false, error };
  }
};

/**
 * Utility to check JWT claims for debugging auth issues
 */
export const debugJwtClaims = async () => {
  try {
    const { data, error } = await supabase.rpc('debug_jwt_claims');
    
    if (error) {
      console.error('Error fetching JWT claims:', error);
      return { success: false, error };
    }
    
    console.log('JWT claims:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error in debugJwtClaims:', error);
    return { success: false, error };
  }
};

/**
 * Utility to debug RLS policies
 */
export const debugRlsPolicies = async () => {
  try {
    // Check if we can access data with current authentication
    const tablesResult = await Promise.all([
      debugTable('users', 2),
      debugTable('offers', 2),
      debugTable('affiliate_offers', 2)
    ]);
    
    const rlsResult = {
      users: tablesResult[0].success ? 'accessible' : 'restricted',
      offers: tablesResult[1].success ? 'accessible' : 'restricted',
      affiliate_offers: tablesResult[2].success ? 'accessible' : 'restricted'
    };
    
    console.log('RLS policy check results:', rlsResult);
    
    return { success: true, data: rlsResult };
  } catch (error) {
    console.error('Error in debugRlsPolicies:', error);
    return { success: false, error };
  }
};
