
import { useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import OfferBrowser from '@/components/affiliate/OfferBrowser';
import MarketplaceOverview from '@/components/marketplace/MarketplaceOverview';
import { LoadingState } from '@/components/LoadingState';

export default function MarketplacePage() {
  const { user, session, isLoading } = useAuth();
  
  // Show loading state during initial load
  if (isLoading) {
    return <LoadingState />;
  }
  
  return (
    <ProtectedRoute>
      {user ? (
        user.role === 'affiliate' ? (
          <OfferBrowser />
        ) : (
          <MarketplaceOverview />
        )
      ) : (
        // If we have a session but no user data yet, show loading
        session ? <LoadingState /> : <LoadingState />
      )}
    </ProtectedRoute>
  );
}
