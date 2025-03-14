
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import OffersList from '@/components/offers/OffersList';
import OfferDetails from '@/components/offers/OfferDetails';
import CreateOffer from '@/components/offers/CreateOffer';
import OfferBrowser from '@/components/affiliate/OfferBrowser';
import OfferManagement from '@/components/advertiser/OfferManagement';
import AffiliateOffers from '@/components/affiliate/AffiliateOffers';
import { useEffect } from 'react';
import AffiliateApprovals from '@/components/offers/AffiliateApprovals';

export default function OffersPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
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
  
  if (!user) return null;
  
  // If we have an ID with "create", we show the creation form (only for advertisers and admins)
  if (id === 'create' && (user.role === 'advertiser' || user.role === 'admin')) {
    return <CreateOffer />;
  }
  
  // If we have "approve" in the URL, show the approval interface (only for advertisers)
  if (id === 'approve' && user.role === 'advertiser') {
    console.log("[OffersPage] Loading approval interface for advertiser");
    return <AffiliateApprovals />;
  }
  
  // If we have an ID, we show the offer details (for all user types)
  if (id) {
    return <OfferDetails offerId={id} />;
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
