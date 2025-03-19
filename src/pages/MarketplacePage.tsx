
import { useAuth } from '@/context/AuthContext';
import OfferBrowser from '@/components/affiliate/OfferBrowser';
import MarketplaceOverview from '@/components/marketplace/MarketplaceOverview';
import { LoadingState } from '@/components/LoadingState';
import { useEffect, useState } from 'react';

export default function MarketplacePage() {
  const { user, isLoading } = useAuth();
  const [showLoading, setShowLoading] = useState(true);
  
  // Add a timeout to prevent infinite loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoading(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // If still loading and within the timeout period, show loading state
  if (isLoading && showLoading) {
    return <LoadingState />;
  }
  
  // Default to OfferBrowser for affiliates, MarketplaceOverview for others
  // If we don't have user data yet, make a best guess based on what component is simpler
  if (!user) {
    console.log('MarketplacePage: No user data, defaulting to OfferBrowser');
    return <OfferBrowser />;
  }
  
  // If we have user data, render the appropriate component based on role
  return user.role === 'affiliate' ? <OfferBrowser /> : <MarketplaceOverview />;
}
