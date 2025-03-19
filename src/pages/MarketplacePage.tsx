
import { useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import OfferBrowser from '@/components/affiliate/OfferBrowser';
import MarketplaceOverview from '@/components/marketplace/MarketplaceOverview';

export default function MarketplacePage() {
  const { user } = useAuth();
  
  if (!user) return null;
  
  return (
    <ProtectedRoute>
      {user.role === 'affiliate' ? (
        <OfferBrowser />
      ) : (
        <MarketplaceOverview />
      )}
    </ProtectedRoute>
  );
}
