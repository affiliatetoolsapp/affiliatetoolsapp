
import { useAuth } from '@/context/AuthContext';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import AdvertiserDashboard from '@/components/dashboard/AdvertiserDashboard';
import AffiliateDashboard from '@/components/dashboard/AffiliateDashboard';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-28 mb-4" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-[300px] w-full rounded-md" />
      </div>
    );
  }

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
