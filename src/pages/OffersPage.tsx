
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

export default function OffersPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    console.log("OffersPage rendered with id:", id, "user role:", user?.role);
    // If user is affiliate and tries to create an offer, redirect to the offers list
    if (id === 'create' && user?.role === 'affiliate') {
      navigate('/offers');
    }
  }, [id, user, navigate]);
  
  if (!user) return null;
  
  // If we have an ID with "create", we show the creation form (only for advertisers and admins)
  if (id === 'create' && (user.role === 'advertiser' || user.role === 'admin')) {
    return <CreateOffer />;
  }
  
  // If we have an ID, we show the offer details
  if (id) {
    console.log("Rendering OfferDetails for offer:", id);
    return <OfferDetails offerId={id} />;
  }
  
  // For the main offers page, we show different views based on the user role
  return (
    <>
      {user.role === 'affiliate' && (
        <ProtectedRoute allowedRoles={['affiliate']}>
          <AffiliateOffers />
        </ProtectedRoute>
      )}
      
      {user.role === 'advertiser' && (
        <ProtectedRoute allowedRoles={['advertiser']}>
          <OfferManagement />
        </ProtectedRoute>
      )}
      
      {user.role === 'admin' && (
        <ProtectedRoute allowedRoles={['admin']}>
          <OffersList />
        </ProtectedRoute>
      )}
    </>
  );
}
