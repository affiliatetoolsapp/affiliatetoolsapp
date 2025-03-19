
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
      userRole: user?.role || session?.user?.user_metadata?.role || 'unknown'
    });
  }, [isLoading, user, session]);
  
  // Session check will be handled by ProtectedRoute
  return (
    <ProtectedRoute>
      {isLoading ? (
        <LoadingState />
      ) : (
        /* If we have a user or session with role, render role-specific content */
        user?.role === 'affiliate' || session?.user?.user_metadata?.role === 'affiliate' ? (
          <OfferBrowser />
        ) : (
          <MarketplaceOverview />
        )
      )}
    </ProtectedRoute>
  );
}
