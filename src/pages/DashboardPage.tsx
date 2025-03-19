
import { useAuth } from '@/context/AuthContext';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import AdvertiserDashboard from '@/components/dashboard/AdvertiserDashboard';
import AffiliateDashboard from '@/components/dashboard/AffiliateDashboard';
import DashboardOverview from '@/components/dashboard/DashboardOverview';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

  const renderRoleDashboard = () => {
    switch (user.role) {
      case 'admin':
        return (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="advanced">Advanced Analytics</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-6">
              <DashboardOverview />
            </TabsContent>
            <TabsContent value="advanced" className="space-y-6">
              <AdminDashboard />
            </TabsContent>
          </Tabs>
        );
      case 'advertiser':
        return (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="advanced">Campaign Analytics</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-6">
              <DashboardOverview />
            </TabsContent>
            <TabsContent value="advanced" className="space-y-6">
              <AdvertiserDashboard />
            </TabsContent>
          </Tabs>
        );
      case 'affiliate':
        return (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="detailed">Detailed Analytics</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-6">
              <DashboardOverview />
            </TabsContent>
            <TabsContent value="detailed" className="space-y-6">
              <AffiliateDashboard />
            </TabsContent>
          </Tabs>
        );
      default:
        return <div>Unknown role</div>;
    }
  };

  return (
    <div className="w-full max-w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome, {user.contact_name || user.email}</h1>
        <p className="text-muted-foreground">
          {user.role === 'admin' 
            ? 'View and manage your affiliate network'
            : user.role === 'advertiser'
            ? 'Track your campaigns and manage affiliates'
            : 'Find offers and monitor your performance'}
        </p>
      </div>
      
      <div className="mt-6 max-w-full">
        {renderRoleDashboard()}
      </div>
    </div>
  );
}
