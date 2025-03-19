
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
  
  // Still loading, show loading state
  if (isLoading) {
    return <LoadingState />;
  }
  
  // We have a profile error but we can retry
  if (profileError) {
    return <LoadingState errorMessage={profileError} onRetry={retryFetchProfile} />;
  }
  
  // If no user data despite finishing loading, show a different error
  if (!user) {
    return <LoadingState errorMessage="Could not load user profile. Please try refreshing the page." />;
  }
  
  // If we have user data, render the appropriate component based on role
  return user.role === 'affiliate' ? <OfferBrowser /> : <MarketplaceOverview />;
}
