import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Shield, Lock, Key, Bell } from 'lucide-react';

export function AdminSecurityPage() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState('30');
  const [maxLoginAttempts, setMaxLoginAttempts] = useState('5');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Security Settings</h1>
        <Button>
          <Shield className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Security Notice</AlertTitle>
        <AlertDescription>
          These settings affect the security of your entire platform. Please review changes carefully before saving.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">
                  Require 2FA for all admin accounts
                </p>
              </div>
              <Switch
                checked={twoFactorEnabled}
                onCheckedChange={setTwoFactorEnabled}
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Session Timeout (minutes)</Label>
                <Input
                  type="number"
                  value={sessionTimeout}
                  onChange={(e) => setSessionTimeout(e.target.value)}
                  className="w-[200px]"
                />
              </div>

              <div className="space-y-2">
                <Label>Maximum Login Attempts</Label>
                <Input
                  type="number"
                  value={maxLoginAttempts}
                  onChange={(e) => setMaxLoginAttempts(e.target.value)}
                  className="w-[200px]"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Password Policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Require Strong Passwords</Label>
                <p className="text-sm text-muted-foreground">
                  Enforce password complexity requirements
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Minimum Password Length</Label>
                <Input
                  type="number"
                  defaultValue="12"
                  className="w-[200px]"
                />
              </div>

              <div className="space-y-2">
                <Label>Password Expiry (days)</Label>
                <Input
                  type="number"
                  defaultValue="90"
                  className="w-[200px]"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>API Rate Limiting</Label>
                <p className="text-sm text-muted-foreground">
                  Limit API requests to prevent abuse
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>API Key Expiry (days)</Label>
                <Input
                  type="number"
                  defaultValue="365"
                  className="w-[200px]"
                />
              </div>

              <div className="space-y-2">
                <Label>Allowed IP Addresses</Label>
                <Input
                  type="text"
                  placeholder="192.168.1.1, 10.0.0.1"
                  className="w-full"
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
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Security Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications for security events
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Alert Email Addresses</Label>
                <Input
                  type="text"
                  placeholder="admin@example.com, security@example.com"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>Alert Threshold</Label>
                <Input
                  type="number"
                  defaultValue="5"
                  className="w-[200px]"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 