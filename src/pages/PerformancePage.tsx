
import { useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import AffiliatePerformance from '@/components/affiliate/AffiliatePerformance';

export default function PerformancePage() {
  const { user } = useAuth();
  
  if (!user) return null;
  
  return (
    <ProtectedRoute allowedRoles={['affiliate']}>
      <AffiliatePerformance />
    </ProtectedRoute>
  );
}
