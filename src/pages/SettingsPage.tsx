
import { useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import UserSettings from '@/components/settings/UserSettings';

export default function SettingsPage() {
  const { user } = useAuth();
  
  if (!user) return null;
  
  return (
    <ProtectedRoute>
      <UserSettings />
    </ProtectedRoute>
  );
}
