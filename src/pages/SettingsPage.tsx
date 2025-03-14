
import { useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate, useLocation } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import ProfileInformation from '@/components/profile/ProfileInformation';
import SecuritySettings from '@/components/profile/SecuritySettings';
import NotificationSettings from '@/components/profile/NotificationSettings';
import AffiliatePostbackSetup from '@/components/affiliate/AffiliatePostbackSetup';

export default function SettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const tabFromHash = location.hash ? location.hash.substring(1) : 'profile';
  
  // Update URL hash when tab changes
  const handleTabChange = (value: string) => {
    navigate(`#${value}`, { replace: true });
  };
  
  // Set initial tab from URL hash
  useEffect(() => {
    // Any setup needed for tabs
  }, [location]);
  
  if (!user) return null;
  
  return (
    <ProtectedRoute allowedRoles={['admin', 'affiliate', 'advertiser']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>
        
        <Tabs defaultValue={tabFromHash} onValueChange={handleTabChange}>
          <TabsList className="mb-6">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            {user.role === 'affiliate' && (
              <TabsTrigger value="tracking">Tracking</TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="profile">
            <ProfileInformation />
          </TabsContent>
          
          <TabsContent value="security">
            <SecuritySettings />
          </TabsContent>
          
          <TabsContent value="notifications">
            <NotificationSettings />
          </TabsContent>
          
          {user.role === 'affiliate' && (
            <TabsContent value="tracking">
              <AffiliatePostbackSetup />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </ProtectedRoute>
  );
}
