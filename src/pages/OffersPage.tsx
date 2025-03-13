
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import OffersList from '@/components/offers/OffersList';
import OfferDetails from '@/components/offers/OfferDetails';
import CreateOffer from '@/components/offers/CreateOffer';
import { useEffect } from 'react';

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
  
  if (!user) return null;
  
  // If we have an ID with "create", we show the creation form (only for advertisers and admins)
  if (id === 'create' && (user.role === 'advertiser' || user.role === 'admin')) {
    return <CreateOffer />;
  }
  
  // If we have an ID, we show the offer details
  if (id) {
    return <OfferDetails offerId={id} />;
  }
  
  // Otherwise, we show the list of offers
  return <OffersList />;
}
