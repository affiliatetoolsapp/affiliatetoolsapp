
import { useAuth } from '@/context/AuthContext';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import AdvertiserDashboard from '@/components/dashboard/AdvertiserDashboard';
import AffiliateDashboard from '@/components/dashboard/AffiliateDashboard';

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'advertiser':
      return <AdvertiserDashboard />;
    case 'affiliate':
      return <AffiliateDashboard />;
    default:
      return <div>Unknown role</div>;
  }
}
