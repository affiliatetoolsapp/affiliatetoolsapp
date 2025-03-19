
import { useAuth } from '@/context/AuthContext';
import OfferBrowser from '@/components/affiliate/OfferBrowser';
import MarketplaceOverview from '@/components/marketplace/MarketplaceOverview';
import { LoadingState } from '@/components/LoadingState';

export default function MarketplacePage() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingState />;
  }
  
  // If we don't have user data yet, show loading
  if (!user) {
    return <LoadingState />;
  }
  
  // If we have user data, render the appropriate component based on role
  return user.role === 'affiliate' ? <OfferBrowser /> : <MarketplaceOverview />;
}
