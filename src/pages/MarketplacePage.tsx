
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
  
  // During initial load, show loading state
  if (isLoading) {
    console.log('[MarketplacePage] Auth is still loading, showing loading state');
    return <LoadingState />;
  }
  
  // Session check will be handled by ProtectedRoute
  return (
    <ProtectedRoute>
      {/* If we have a user, render role-specific content */}
      {user?.role === 'affiliate' ? (
        <OfferBrowser />
      ) : (
        <MarketplaceOverview />
      )}
    </ProtectedRoute>
  );
}
