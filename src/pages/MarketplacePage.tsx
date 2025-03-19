
import { useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import OfferBrowser from '@/components/affiliate/OfferBrowser';
import MarketplaceOverview from '@/components/marketplace/MarketplaceOverview';
import { LoadingState } from '@/components/LoadingState';

export default function MarketplacePage() {
  const { user, isLoading } = useAuth();
  
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
        <LoadingState />
      )}
    </ProtectedRoute>
  );
}
