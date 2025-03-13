
import { useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import TrackingLinkGenerator from '@/components/affiliate/TrackingLinkGenerator';

export default function LinksPage() {
  const { user } = useAuth();
  
  if (!user) return null;
  
  return (
    <ProtectedRoute allowedRoles={['affiliate']}>
      <TrackingLinkGenerator />
    </ProtectedRoute>
  );
}
