
import { useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import AffiliatePartners from '@/components/advertiser/AffiliatePartners';

export default function PartnersPage() {
  const { user } = useAuth();
  
  if (!user) return null;
  
  return (
    <ProtectedRoute allowedRoles={['advertiser']}>
      <AffiliatePartners />
    </ProtectedRoute>
  );
}
