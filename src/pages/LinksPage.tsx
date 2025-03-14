
import { useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import TrackingLinkGenerator from '@/components/affiliate/TrackingLinkGenerator';
import { useSearchParams } from 'react-router-dom';

export default function LinksPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const offerId = searchParams.get('offer');
  
  if (!user) return null;
  
  return (
    <ProtectedRoute allowedRoles={['affiliate']}>
      <TrackingLinkGenerator preselectedOfferId={offerId} />
    </ProtectedRoute>
  );
}
