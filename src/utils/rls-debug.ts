
import { supabase } from "@/integrations/supabase/client";

/**
 * Utility function to test database access
 * Use this function to check if a user can access specific tables
 */
export async function testDatabaseAccess() {
  try {
    console.log("Testing database access...");
    
    // Get current session and log
    const { data: { session } } = await supabase.auth.getSession();
    console.log("Current session:", session ? "Authenticated" : "Not authenticated");
    
    if (!session) {
      console.log("No active session. Please sign in first.");
      return { success: false, message: "Not authenticated" };
    }
    
    // Test users table access
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
      
    console.log("Users table access:", usersError ? "❌ Denied" : "✅ Granted");
    if (usersError) console.error("Users table error:", usersError);
    
    // Test offers table access
    const { data: offers, error: offersError } = await supabase
      .from('offers')
      .select('*')
      .limit(1);
      
    console.log("Offers table access:", offersError ? "❌ Denied" : "✅ Granted");
    if (offersError) console.error("Offers table error:", offersError);
    
    // Test clicks table access
    const { data: clicks, error: clicksError } = await supabase
      .from('clicks')
      .select('*')
      .limit(1);
      
    console.log("Clicks table access:", clicksError ? "❌ Denied" : "✅ Granted");
    if (clicksError) console.error("Clicks table error:", clicksError);
    
    // Return results
    return {
      success: true,
      access: {
        users: !usersError,
        offers: !offersError,
        clicks: !clicksError
      }
    };
  } catch (error) {
    console.error("Error testing database access:", error);
    return { success: false, error };
  }
}
