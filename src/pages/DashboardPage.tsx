
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import AdvertiserDashboard from '@/components/dashboard/AdvertiserDashboard';
import AffiliateDashboard from '@/components/dashboard/AffiliateDashboard';
import DashboardOverview from '@/components/dashboard/DashboardOverview';
import { NotificationAlert } from '@/components/ui/notification-alert';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Users, ArrowRight, Bell } from 'lucide-react';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  
  // Local storage keys for dismissible notifications
  const PENDING_APPLICATIONS_DISMISSED_KEY = 'pendingApplicationsDismissed';
  const LAST_APPLICATION_STATUS_SEEN_KEY = 'lastApplicationStatusSeen';
  
  // State for notification visibility
  const [showPendingApplicationsAlert, setShowPendingApplicationsAlert] = useState(false);
  const [applicationStatusNotification, setApplicationStatusNotification] = useState<{
    status: 'approved' | 'rejected';
    offerId: string;
    offerName: string;
  } | null>(null);
  
  // For advertisers: Get pending applications count
  const { data: pendingApplicationsCount = 0 } = useQuery({
    queryKey: ['pending-applications-count', user?.id],
    queryFn: async () => {
      if (!user || user.role !== 'advertiser') return 0;
      
      const { count, error } = await supabase
        .from('affiliate_offers')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .eq('offer.advertiser_id', user.id);
      
      if (error) {
        console.error('Error fetching pending applications count:', error);
        return 0;
      }
      
      return count || 0;
    },
    enabled: !!user && user.role === 'advertiser',
  });
  
  // For affiliates: Get recently reviewed applications
  const { data: recentApplications } = useQuery({
    queryKey: ['recent-application-statuses', user?.id],
    queryFn: async () => {
      if (!user || user.role !== 'affiliate') return [];
      
      // Get the timestamp of the last seen application status update
      const lastSeen = localStorage.getItem(LAST_APPLICATION_STATUS_SEEN_KEY) || '2000-01-01T00:00:00Z';
      
      const { data, error } = await supabase
        .from('affiliate_offers')
        .select('id, status, reviewed_at, offer_id, offer:offers(name)')
        .eq('affiliate_id', user.id)
        .or(`status.eq.approved,status.eq.rejected`)
        .gt('reviewed_at', lastSeen)
        .order('reviewed_at', { ascending: false })
        .limit(1);
      
      if (error) {
        console.error('Error fetching recent application statuses:', error);
        return [];
      }
      
      return data;
    },
    enabled: !!user && user.role === 'affiliate',
  });
  
  // Handle pending applications alert for advertisers
  useEffect(() => {
    if (user?.role === 'advertiser' && pendingApplicationsCount > 0) {
      const dismissed = localStorage.getItem(PENDING_APPLICATIONS_DISMISSED_KEY);
      if (!dismissed || JSON.parse(dismissed) < pendingApplicationsCount) {
        setShowPendingApplicationsAlert(true);
      }
    }
  }, [pendingApplicationsCount, user?.role]);
  
  // Handle application status notifications for affiliates
  useEffect(() => {
    if (user?.role === 'affiliate' && recentApplications && recentApplications.length > 0) {
      const mostRecent = recentApplications[0];
      if (mostRecent.reviewed_at && mostRecent.status && (mostRecent.status === 'approved' || mostRecent.status === 'rejected')) {
        setApplicationStatusNotification({
          status: mostRecent.status as 'approved' | 'rejected',
          offerId: mostRecent.offer_id,
          offerName: mostRecent.offer?.name || 'an offer'
        });
      }
    }
  }, [recentApplications, user?.role]);
  
  // Dismiss pending applications alert
  const dismissPendingApplicationsAlert = () => {
    localStorage.setItem(PENDING_APPLICATIONS_DISMISSED_KEY, JSON.stringify(pendingApplicationsCount));
    setShowPendingApplicationsAlert(false);
  };
  
  // Dismiss application status notification
  const dismissApplicationStatusNotification = () => {
    if (recentApplications && recentApplications.length > 0) {
      localStorage.setItem(LAST_APPLICATION_STATUS_SEEN_KEY, recentApplications[0].reviewed_at);
    }
    setApplicationStatusNotification(null);
  };
  
  // Navigate to pending applications
  const handleViewPendingApplications = () => {
    navigate('/offers');
    dismissPendingApplicationsAlert();
  };
  
  // Navigate to offer details
  const handleViewOffer = (offerId: string) => {
    navigate(`/offers/${offerId}`);
    dismissApplicationStatusNotification();
  };

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
      {/* Notifications Area */}
      <div className="mb-6 space-y-3">
        {/* For advertisers: Pending applications alert */}
        {user.role === 'advertiser' && showPendingApplicationsAlert && (
          <NotificationAlert 
            variant="info"
            title="Pending Affiliate Applications"
            onClose={dismissPendingApplicationsAlert}
            icon={<Users className="h-5 w-5 text-blue-600" />}
          >
            <div className="flex items-center justify-between">
              <div>
                You have {pendingApplicationsCount} pending affiliate application{pendingApplicationsCount !== 1 ? 's' : ''} waiting for your review.
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                className="ml-4 flex items-center gap-1 bg-white dark:bg-blue-900/30"
                onClick={handleViewPendingApplications}
              >
                Review Now
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </NotificationAlert>
        )}
        
        {/* For affiliates: Application status notification */}
        {user.role === 'affiliate' && applicationStatusNotification && (
          <NotificationAlert
            variant={applicationStatusNotification.status === 'approved' ? 'success' : 'warning'}
            title={`Offer Application ${applicationStatusNotification.status === 'approved' ? 'Approved' : 'Rejected'}`}
            onClose={dismissApplicationStatusNotification}
          >
            <div className="flex items-center justify-between">
              <div>
                Your application for <span className="font-medium">{applicationStatusNotification.offerName}</span> has been {applicationStatusNotification.status}.
              </div>
              {applicationStatusNotification.status === 'approved' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="ml-4 flex items-center gap-1 bg-white dark:bg-green-900/30"
                  onClick={() => handleViewOffer(applicationStatusNotification.offerId)}
                >
                  View Offer
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              )}
            </div>
          </NotificationAlert>
        )}
      </div>

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
