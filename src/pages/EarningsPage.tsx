
import { useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import AffiliateEarnings from '@/components/affiliate/AffiliateEarnings';

export default function EarningsPage() {
  const { user } = useAuth();
  
  if (!user) return null;
  
  return (
    <ProtectedRoute allowedRoles={['affiliate']}>
      <AffiliateEarnings />
    </ProtectedRoute>
  );
}
