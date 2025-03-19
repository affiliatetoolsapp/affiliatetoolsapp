
import { useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import OfferBrowser from '@/components/affiliate/OfferBrowser';
import MarketplaceOverview from '@/components/marketplace/MarketplaceOverview';
import { LoadingState } from '@/components/LoadingState';
import { useEffect, useState } from 'react';

export default function MarketplacePage() {
  const { user, session, isLoading } = useAuth();
  const [showLoading, setShowLoading] = useState(true);
  
  // Add timeout to prevent infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoading(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Log the component state for debugging
  useEffect(() => {
    console.log('[MarketplacePage] Rendering with auth state:', { 
      isLoading, 
      hasUser: !!user, 
      hasSession: !!session,
      userRole: user?.role || session?.user?.user_metadata?.role || 'unknown'
    });
  }, [isLoading, user, session]);
  
  // Use protected route to handle authentication
  return (
    <ProtectedRoute>
      {isLoading && showLoading ? (
        <LoadingState />
      ) : (
        getRoleBasedContent()
      )}
    </ProtectedRoute>
  );
  
  // Helper function to determine content based on role
  function getRoleBasedContent() {
    // First try to get role from user object
    const role = user?.role || session?.user?.user_metadata?.role;
    
    // Render appropriate content based on role
    if (role === 'affiliate') {
      return <OfferBrowser />;
    } else {
      return <MarketplaceOverview />;
    }
  }
}
