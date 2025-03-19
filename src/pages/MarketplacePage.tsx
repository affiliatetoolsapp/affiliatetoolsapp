
import { useAuth } from '@/context/AuthContext';
import OfferBrowser from '@/components/affiliate/OfferBrowser';
import MarketplaceOverview from '@/components/marketplace/MarketplaceOverview';
import { LoadingState } from '@/components/LoadingState';

export default function MarketplacePage() {
  const { user, session, isLoading } = useAuth();
  
  // Show loading state during initial load
  if (isLoading) {
    return <LoadingState />;
  }
  
  // If we have a session but no user data yet, show loading
  if (session && !user) {
    return <LoadingState />;
  }
  
  // If we have user data, render the appropriate component based on role
  if (user) {
    return user.role === 'affiliate' ? <OfferBrowser /> : <MarketplaceOverview />;
  }
  
  // Fallback loading state
  return <LoadingState />;
}
