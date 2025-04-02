
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { SignInForm } from '@/components/auth/SignInForm';
import { useAuth } from '@/context/AuthContext';
import { PublicHeader } from '@/components/PublicHeader';
import { LoadingState } from '@/components/LoadingState';
import { testDatabaseAccess } from '@/utils/rls-debug';
import { useToast } from '@/hooks/use-toast';
import { debugRlsPolicies } from '@/utils/supabase-debug'; 

export default function LoginPage() {
  const { isLoading, session } = useAuth();
  const { toast } = useToast();
  
  const handleDebugClick = async () => {
    const result = await testDatabaseAccess();
    console.log("Database access test result:", result);
    
    toast({
      title: result.success ? "Access Test Complete" : "Access Test Failed",
      description: result.success 
        ? `Check console for detailed results` 
        : `Error: ${result.message || 'Unknown error'}`,
      variant: result.success ? "default" : "destructive",
    });
  };
  
  // Add an additional debug function for RLS policies
  const handleRlsDebugClick = async () => {
    const rlsResult = await debugRlsPolicies();
    console.log("RLS Policies test result:", rlsResult);
    
    toast({
      title: rlsResult.success ? "RLS Test Complete" : "RLS Test Failed",
      description: rlsResult.success 
        ? `Check console for detailed RLS results` 
        : `Error: ${rlsResult.error || 'Unknown error'}`,
      variant: rlsResult.success ? "default" : "destructive",
    });
  };
  
  // Show loading state during initialization
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <PublicHeader />
        <LoadingState />
      </div>
    );
  }
  
  // Show login form
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <div className="flex items-center justify-center min-h-screen pt-16">
        <div className="w-full max-w-md p-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">AffiliateTools</h1>
            <p className="text-muted-foreground">Sign in to your account</p>
          </div>
          <SignInForm />
          
          {/* Debug section - only visible in development */}
          {import.meta.env.DEV && (
            <div className="mt-8 p-4 border border-dashed border-muted-foreground rounded-md">
              <h3 className="text-sm font-semibold mb-2">Debug Tools</h3>
              <div className="flex flex-col gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleDebugClick}
                  disabled={!session}
                >
                  Test Database Access
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRlsDebugClick}
                  disabled={!session}
                >
                  Test RLS Policies
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {session ? 'Click to test database access and RLS policies' : 'Sign in first to test access'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
