
import { useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import OfferBrowser from '@/components/affiliate/OfferBrowser';

export default function MarketplacePage() {
  const { user } = useAuth();
  
  if (!user) return null;
  
  return (
    <ProtectedRoute allowedRoles={['affiliate']}>
      <OfferBrowser />
    </ProtectedRoute>
  );
}
