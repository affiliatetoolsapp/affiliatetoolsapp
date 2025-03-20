
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
import { toast } from '@/hooks/use-toast';

export default function OffersPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  
  useEffect(() => {
    // If user is affiliate and tries to create an offer, redirect to the offers list
    if (id === 'create' && user?.role === 'affiliate') {
      navigate('/offers');
    }
  }, [id, user, navigate]);
  
  // Log current page and parameters
  useEffect(() => {
    console.log("[OffersPage] Loaded with id:", id);
    console.log("[OffersPage] Current user:", user);
  }, [id, user]);

  // Fetch offer data
  const { data: offerData } = useQuery({
    queryKey: ['offer', id],
    queryFn: async () => {
      if (!id || !user) return null;
      
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
    enabled: !!id && !!user,
  });

  // Fetch application status for affiliate
  const { data: applicationData } = useQuery({
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
    enabled: !!id && !!user && user.role === 'affiliate',
  });
  
  // Update application status when data changes
  useEffect(() => {
    if (applicationData) {
      setApplicationStatus(applicationData.status);
    } else {
      setApplicationStatus(null);
    }
  }, [applicationData]);
  
  if (!user) return null;
  
  // If we're in edit mode and have offer data, show the creation form with the offer data
  if (isEditMode && offerData && (user.role === 'advertiser' || user.role === 'admin')) {
    return <CreateOffer initialData={offerData as Offer} />;
  }
  
  // If we have an ID with "create", we show the creation form (only for advertisers and admins)
  if (id === 'create' && (user.role === 'advertiser' || user.role === 'admin')) {
    console.log("[OffersPage] Rendering CreateOffer component");
    return <CreateOffer />;
  }
  
  // If we have "approve" in the URL, show the approval interface (only for advertisers)
  if (id === 'approve' && user.role === 'advertiser') {
    console.log("[OffersPage] Loading approval interface for advertiser");
    return <AffiliateApprovals />;
  }
  
  // If we have "postback" in the URL, show the postback setup interface (only for affiliates)
  if (id === 'postback' && user.role === 'affiliate') {
    console.log("[OffersPage] Loading postback setup interface for affiliate");
    return <AffiliatePostbackSetup />;
  }
  
  // If we have "postback" in the URL, show the postback setup interface (only for advertisers)
  if (id === 'postback' && user.role === 'advertiser') {
    console.log("[OffersPage] Loading postback setup interface for advertiser");
    return <AdvertiserPostbackSetup />;
  }
  
  // If we have an ID, we show the offer details based on user role
  if (id && offerData) {
    // For affiliates, show the enhanced OfferDetailView
    if (user.role === 'affiliate') {
      console.log("[OffersPage] Showing affiliate offer detail view with status:", applicationStatus);
      // Convert offerData to Offer type explicitly to ensure type compatibility
      const offer: Offer = {
        ...offerData,
        geo_targets: offerData.geo_targets as Offer['geo_targets']
      };
      
      return (
        <OfferDetailView 
          offer={offer} 
          applicationStatus={applicationStatus} 
          onBack={() => navigate('/offers')} 
        />
      );
    }
    
    // For advertisers and admins, continue using the existing OfferDetails component
    // But pass a prop to handle edit mode
    return <OfferDetails 
      offerId={id} 
      onEditClick={() => {
        // When edit is clicked, set edit mode to true
        setIsEditMode(true);
      }} 
    />;
  }
  
  // For the main offers page, we show different views based on the user role
  if (user.role === 'affiliate') {
    console.log("[OffersPage] Loading affiliate offers view");
    return (
      <ProtectedRoute allowedRoles={['affiliate']}>
        <AffiliateOffers />
      </ProtectedRoute>
    );
  }
  
  if (user.role === 'advertiser') {
    console.log("[OffersPage] Loading advertiser offer management");
    return (
      <ProtectedRoute allowedRoles={['advertiser']}>
        <OfferManagement />
      </ProtectedRoute>
    );
  }
  
  if (user.role === 'admin') {
    return (
      <ProtectedRoute allowedRoles={['admin']}>
        <OffersList />
      </ProtectedRoute>
    );
  }
  
  return null;
}
