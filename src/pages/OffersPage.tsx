
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import OffersList from '@/components/offers/OffersList';
import OfferDetails from '@/components/offers/OfferDetails';
import CreateOffer from '@/components/offers/CreateOffer';
import OfferBrowser from '@/components/affiliate/OfferBrowser';
import OfferManagement from '@/components/advertiser/OfferManagement';
import AffiliateOffers from '@/components/affiliate/AffiliateOffers';
import { useEffect, useState } from 'react';
import AffiliateApprovals from '@/components/offers/AffiliateApprovals';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import OfferDetailView from '@/components/affiliate/OfferDetailView';
import AffiliatePostbackSetup from '@/components/affiliate/AffiliatePostbackSetup';
import AdvertiserPostbackSetup from '@/components/advertiser/AdvertiserPostbackSetup';
import { Offer } from '@/types';
import { LoadingState } from '@/components/LoadingState';

export default function OffersPage() {
  const { id } = useParams();
  const { user, session, isLoading } = useAuth();
  const navigate = useNavigate();
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
  
  useEffect(() => {
    // If user is affiliate and tries to create an offer, redirect to the offers list
    if (!isLoading && id === 'create' && user?.role === 'affiliate') {
      navigate('/offers');
    }
  }, [id, user, navigate, isLoading]);
  
  // Log current page and parameters
  useEffect(() => {
    console.log("[OffersPage] Loaded with id:", id);
    console.log("[OffersPage] Current user:", user);
    console.log("[OffersPage] Auth loading state:", isLoading);
    console.log("[OffersPage] Session exists:", !!session);
  }, [id, user, isLoading, session]);

  // Fetch offer data only when auth state is determined and id is available
  const { data: offerData, isLoading: isOfferLoading } = useQuery({
    queryKey: ['offer', id, user?.id],
    queryFn: async () => {
      if (!id || !session) return null;
      
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error("Error fetching offer:", error);
        return null;
      }
      
      return data;
    },
    enabled: !!id && !!session && !isLoading,
  });

  // Fetch application status for affiliate
  const { data: applicationData, isLoading: isApplicationLoading } = useQuery({
    queryKey: ['offer-application', id, user?.id],
    queryFn: async () => {
      if (!id || !user || user.role !== 'affiliate') return null;
      
      const { data, error } = await supabase
        .from('affiliate_offers')
        .select('status')
        .eq('offer_id', id)
        .eq('affiliate_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error("Error fetching application:", error);
      }
      
      return data;
    },
    enabled: !!id && !!user && user.role === 'affiliate' && !isLoading,
  });
  
  // Update application status when data changes
  useEffect(() => {
    if (applicationData) {
      setApplicationStatus(applicationData.status);
    } else {
      setApplicationStatus(null);
    }
  }, [applicationData]);
  
  // During initial auth state determination, show loading state
  if (isLoading) {
    console.log("[OffersPage] Showing loading state while auth is being determined");
    return <LoadingState />;
  }
  
  // Handle special routes that require a logged-in user
  if (id === 'create' && (user?.role === 'advertiser' || user?.role === 'admin')) {
    console.log("[OffersPage] Rendering CreateOffer component");
    return (
      <ProtectedRoute allowedRoles={['advertiser', 'admin']}>
        <CreateOffer />
      </ProtectedRoute>
    );
  }
  
  if (id === 'approve' && user?.role === 'advertiser') {
    console.log("[OffersPage] Loading approval interface for advertiser");
    return (
      <ProtectedRoute allowedRoles={['advertiser']}>
        <AffiliateApprovals />
      </ProtectedRoute>
    );
  }
  
  if (id === 'postback' && user?.role === 'affiliate') {
    console.log("[OffersPage] Loading postback setup interface for affiliate");
    return (
      <ProtectedRoute allowedRoles={['affiliate']}>
        <AffiliatePostbackSetup />
      </ProtectedRoute>
    );
  }
  
  if (id === 'postback' && user?.role === 'advertiser') {
    console.log("[OffersPage] Loading postback setup interface for advertiser");
    return (
      <ProtectedRoute allowedRoles={['advertiser']}>
        <AdvertiserPostbackSetup />
      </ProtectedRoute>
    );
  }
  
  // Show loading state while fetching offer data for a specific offer
  if (id && isOfferLoading) {
    console.log("[OffersPage] Showing loading state while fetching offer data");
    return <LoadingState />;
  }
  
  // Handle specific offer view with proper role-based components
  if (id && offerData) {
    if (user?.role === 'affiliate') {
      console.log("[OffersPage] Showing affiliate offer detail view with status:", applicationStatus);
      // Convert offerData to Offer type explicitly to ensure type compatibility
      const offer: Offer = {
        ...offerData,
        geo_targets: offerData.geo_targets as Offer['geo_targets']
      };
      
      return (
        <ProtectedRoute allowedRoles={['affiliate']}>
          <OfferDetailView 
            offer={offer} 
            applicationStatus={applicationStatus} 
            onBack={() => navigate('/offers')} 
          />
        </ProtectedRoute>
      );
    }
    
    return (
      <ProtectedRoute>
        <OfferDetails offerId={id} />
      </ProtectedRoute>
    );
  }
  
  // For the main offers page, render role-specific views
  return (
    <ProtectedRoute>
      {user?.role === 'affiliate' ? (
        <AffiliateOffers />
      ) : user?.role === 'advertiser' ? (
        <OfferManagement />
      ) : (
        <OffersList />
      )}
    </ProtectedRoute>
  );
}
