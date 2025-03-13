
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Bell, Mail, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function NotificationSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    emailOfferUpdates: true,
    emailPayments: true,
    emailSecurity: true,
    pushNewOffers: false,
    pushMessages: true,
    pushPayments: true,
  });

  const handleToggle = (setting: keyof typeof notificationSettings) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handleSave = () => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Settings saved",
        description: "Your notification preferences have been updated",
      });
    }, 800);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mail className="mr-2 h-5 w-5" />
            Email Notifications
          </CardTitle>
          <CardDescription>
            Manage what emails you receive from us
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="emailOfferUpdates" className="flex flex-col space-y-1">
              <span>Offer Updates</span>
              <span className="font-normal text-xs text-muted-foreground">
                Receive emails when offers you applied for are updated
              </span>
            </Label>
            <Switch
              id="emailOfferUpdates"
              checked={notificationSettings.emailOfferUpdates}
              onCheckedChange={() => handleToggle('emailOfferUpdates')}
            />
          </div>
          
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="emailPayments" className="flex flex-col space-y-1">
              <span>Payment Notifications</span>
              <span className="font-normal text-xs text-muted-foreground">
                Receive emails about new payments and commissions
              </span>
            </Label>
            <Switch
              id="emailPayments"
              checked={notificationSettings.emailPayments}
              onCheckedChange={() => handleToggle('emailPayments')}
            />
          </div>
          
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="emailSecurity" className="flex flex-col space-y-1">
              <span>Security Alerts</span>
              <span className="font-normal text-xs text-muted-foreground">
                Receive emails about security events and login attempts
              </span>
            </Label>
            <Switch
              id="emailSecurity"
              checked={notificationSettings.emailSecurity}
              onCheckedChange={() => handleToggle('emailSecurity')}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="mr-2 h-5 w-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Control notifications in your browser or mobile app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="pushNewOffers" className="flex flex-col space-y-1">
              <span>New Offers</span>
              <span className="font-normal text-xs text-muted-foreground">
                Get notified when new offers matching your profile are available
              </span>
            </Label>
            <Switch
              id="pushNewOffers"
              checked={notificationSettings.pushNewOffers}
              onCheckedChange={() => handleToggle('pushNewOffers')}
            />
          </div>
          
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="pushMessages" className="flex flex-col space-y-1">
              <span>Messages</span>
              <span className="font-normal text-xs text-muted-foreground">
                Get notified when you receive new messages
              </span>
            </Label>
            <Switch
              id="pushMessages"
              checked={notificationSettings.pushMessages}
              onCheckedChange={() => handleToggle('pushMessages')}
            />
          </div>
          
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="pushPayments" className="flex flex-col space-y-1">
              <span>Payments</span>
              <span className="font-normal text-xs text-muted-foreground">
                Get notified about payment updates and commissions
              </span>
            </Label>
            <Switch
              id="pushPayments"
              checked={notificationSettings.pushPayments}
              onCheckedChange={() => handleToggle('pushPayments')}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Preferences
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
