import { useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import OffersList from '@/components/offers/OffersList';
import OfferDetails from '@/components/offers/OfferDetails';
import CreateOffer from '@/components/offers/CreateOffer';

export default function OffersPage() {
  const { id } = useParams();
  const { user } = useAuth();
  
  if (!user) return null;
  
  // If we have an ID with "create", we show the creation form
  if (id === 'create') {
    return <CreateOffer />;
  }
  
  // If we have an ID, we show the offer details
  if (id) {
    return <OfferDetails offerId={id} />;
  }
  
  // Otherwise, we show the list of offers
  return <OffersList />;
}
