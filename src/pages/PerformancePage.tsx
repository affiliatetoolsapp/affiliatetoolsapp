
import { useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import ReportsPage from '@/pages/ReportsPage';

export default function PerformancePage() {
  const { user } = useAuth();
  
  if (!user) return null;
  
  return (
    <ProtectedRoute allowedRoles={['affiliate']}>
      <ReportsPage />
    </ProtectedRoute>
  );
}
