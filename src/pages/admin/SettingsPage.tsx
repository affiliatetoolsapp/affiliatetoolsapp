import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Settings, Mail, Globe, CreditCard, Bell } from 'lucide-react';

export function AdminSettingsPage() {
  const [siteName, setSiteName] = useState('Affiliate Network');
  const [siteDescription, setSiteDescription] = useState('Your trusted affiliate marketing platform');
  const [contactEmail, setContactEmail] = useState('support@example.com');
  const [timezone, setTimezone] = useState('UTC');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Platform Settings</h1>
        <Button>
          <Settings className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Site Name</Label>
                <Input
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  placeholder="Enter site name"
                />
              </div>

              <div className="space-y-2">
                <Label>Site Description</Label>
                <Textarea
                  value={siteDescription}
                  onChange={(e) => setSiteDescription(e.target.value)}
                  placeholder="Enter site description"
                />
              </div>

              <div className="space-y-2">
                <Label>Timezone</Label>
                <Input
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  placeholder="Enter timezone"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Email Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Contact Email</Label>
                <Input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="Enter contact email"
                />
              </div>

              <div className="space-y-2">
                <Label>SMTP Host</Label>
                <Input
                  type="text"
                  placeholder="smtp.example.com"
                />
              </div>

              <div className="space-y-2">
                <Label>SMTP Port</Label>
                <Input
                  type="number"
                  placeholder="587"
                />
              </div>

              <div className="space-y-2">
                <Label>SMTP Username</Label>
                <Input
                  type="text"
                  placeholder="Enter SMTP username"
                />
              </div>

              <div className="space-y-2">
                <Label>SMTP Password</Label>
                <Input
                  type="password"
                  placeholder="Enter SMTP password"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Minimum Payout Amount</Label>
                <Input
                  type="number"
                  placeholder="100"
                />
              </div>

              <div className="space-y-2">
                <Label>Payment Processing Fee (%)</Label>
                <Input
                  type="number"
                  placeholder="2.5"
                />
              </div>

              <div className="space-y-2">
                <Label>Payment Methods</Label>
                <Input
                  type="text"
                  placeholder="PayPal, Bank Transfer, Crypto"
                />
              </div>

              <div className="space-y-2">
                <Label>Payment Schedule</Label>
                <Input
                  type="text"
                  placeholder="Monthly"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Send email notifications for important events
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable push notifications for real-time updates
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>SMS Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Send SMS notifications for critical alerts
                  </p>
                </div>
                <Switch />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 