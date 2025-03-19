
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import OfferBrowser from '@/components/affiliate/OfferBrowser';
import MarketplaceOverview from '@/components/marketplace/MarketplaceOverview';
import { LoadingState } from '@/components/LoadingState';

export default function MarketplacePage() {
  const { user, isLoading, profileError, retryFetchProfile } = useAuth();
  
  // Add better logging to track component state
  useEffect(() => {
    console.log('MarketplacePage: Component mounted/updated', { 
      isLoading, 
      hasUser: !!user, 
      hasProfileError: !!profileError,
      userRole: user?.role 
    });
    
    return () => {
      console.log('MarketplacePage: Component unmounting');
    };
  }, [user, isLoading, profileError]);
  
  // Show error state if there's a profile error
  if (profileError) {
    return <LoadingState errorMessage={profileError} onRetry={retryFetchProfile} />;
  }
  
  // Show loading state while auth is initializing or user data is being fetched
  if (isLoading || !user) {
    return <LoadingState />;
  }
  
  // If we have user data, render the appropriate component based on role
  return user.role === 'affiliate' ? <OfferBrowser /> : <MarketplaceOverview />;
}
