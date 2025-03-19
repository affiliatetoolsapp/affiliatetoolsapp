
import { useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import OfferBrowser from '@/components/affiliate/OfferBrowser';
import MarketplaceOverview from '@/components/marketplace/MarketplaceOverview';
import { LoadingState } from '@/components/LoadingState';
import { useEffect } from 'react';

export default function MarketplacePage() {
  const { user, session, isLoading } = useAuth();
  
  // Log the component state for debugging
  useEffect(() => {
    console.log('[MarketplacePage] Rendering with auth state:', { 
      isLoading, 
      hasUser: !!user, 
      hasSession: !!session,
      userRole: user?.role
    });
  }, [isLoading, user, session]);
  
  // Show loading state while auth is being determined
  if (isLoading) {
    console.log('[MarketplacePage] Auth is still loading, showing loading state');
    return <LoadingState />;
  }
  
  // If authentication has completed but we don't have a user,
  // Let the ProtectedRoute component handle redirection to login
  if (!isLoading && !user) {
    console.log('[MarketplacePage] No user after auth loading complete');
    return (
      <ProtectedRoute>
        <LoadingState />
      </ProtectedRoute>
    );
  }
  
  // Once we have the user, show the appropriate content based on role
  return (
    <ProtectedRoute>
      {user?.role === 'affiliate' ? (
        <OfferBrowser />
      ) : (
        <MarketplaceOverview />
      )}
    </ProtectedRoute>
  );
}
