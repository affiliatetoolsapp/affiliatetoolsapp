
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import OfferBrowser from '@/components/affiliate/OfferBrowser';
import MarketplaceOverview from '@/components/marketplace/MarketplaceOverview';
import { LoadingState } from '@/components/LoadingState';

export default function MarketplacePage() {
  const { user, isLoading } = useAuth();
  
  // Add better logging to track component state
  useEffect(() => {
    console.log('MarketplacePage: Component mounted/updated', { 
      isLoading, 
      hasUser: !!user, 
      userRole: user?.role 
    });
    
    return () => {
      console.log('MarketplacePage: Component unmounting');
    };
  }, [user, isLoading]);
  
  // Show loading state while auth is initializing or user data is being fetched
  if (isLoading || !user) {
    return <LoadingState />;
  }
  
  // If we have user data, render the appropriate component based on role
  return user.role === 'affiliate' ? <OfferBrowser /> : <MarketplaceOverview />;
}
