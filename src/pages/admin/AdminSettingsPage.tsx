
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, 
  Users,
  CreditCard,
  Briefcase,
  Shield,
  BellRing,
  Save
} from 'lucide-react';
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const platformSettingsForm = useForm({
    defaultValues: {
      siteName: "Streamlined Affiliate Network",
      allowSignups: true,
      maintenanceMode: false,
      defaultCommission: "20",
      currency: "USD",
      timezone: "UTC",
      minimumPayout: "50",
    },
  });
  
  const affiliateSettingsForm = useForm({
    defaultValues: {
      requireApproval: true,
      minimumWithdrawal: "50",
      withdrawalFee: "3",
      allowDirectLinks: true,
      maxTrackingLinks: "500",
    },
  });
  
  const advertiserSettingsForm = useForm({
    defaultValues: {
      requireApproval: true,
      minimumDeposit: "100",
      depositFee: "0",
      maxOffers: "50",
      requireOfferApproval: true,
    },
  });
  
  const securitySettingsForm = useForm({
    defaultValues: {
      twoFactorAuth: false,
      sessionTimeout: "720",
      maxLoginAttempts: "5",
      passwordMinLength: "8",
      passwordRequireUppercase: true,
      passwordRequireNumbers: true,
      passwordRequireSymbols: false,
    },
  });
  
  const notificationSettingsForm = useForm({
    defaultValues: {
      emailNotifications: true,
      slackWebhook: "",
      notifyNewUser: true,
      notifyNewOffer: true,
      notifyNewConversion: true,
      notifyLargeWithdrawal: true,
      largeWithdrawalThreshold: "1000",
    },
  });
  
  const handlePlatformSettingsSave = (data: any) => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      console.log('Platform settings saved:', data);
      
      toast({
        title: "Settings saved",
        description: "Platform settings have been updated successfully.",
      });
      
      setIsLoading(false);
    }, 1000);
  };
  
  const handleAffiliateSettingsSave = (data: any) => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      console.log('Affiliate settings saved:', data);
      
      toast({
        title: "Settings saved",
        description: "Affiliate settings have been updated successfully.",
      });
      
      setIsLoading(false);
    }, 1000);
  };
  
  const handleAdvertiserSettingsSave = (data: any) => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      console.log('Advertiser settings saved:', data);
      
      toast({
        title: "Settings saved",
        description: "Advertiser settings have been updated successfully.",
      });
      
      setIsLoading(false);
    }, 1000);
  };
  
  const handleSecuritySettingsSave = (data: any) => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      console.log('Security settings saved:', data);
      
      toast({
        title: "Settings saved",
        description: "Security settings have been updated successfully.",
      });
      
      setIsLoading(false);
    }, 1000);
  };
  
  const handleNotificationSettingsSave = (data: any) => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      console.log('Notification settings saved:', data);
      
      toast({
        title: "Settings saved",
        description: "Notification settings have been updated successfully.",
      });
      
      setIsLoading(false);
    }, 1000);
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Settings</h1>
        <p className="text-muted-foreground">
          Configure global settings for the affiliate network
        </p>
      </div>
      
      <Tabs defaultValue="general">
        <TabsList className="w-full flex justify-start">
          <TabsTrigger value="general" className="flex items-center">
            <Settings className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="affiliate" className="flex items-center">
            <Users className="h-4 w-4 mr-2" />
            Affiliates
          </TabsTrigger>
          <TabsTrigger value="advertiser" className="flex items-center">
            <Briefcase className="h-4 w-4 mr-2" />
            Advertisers
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center">
            <BellRing className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>General Platform Settings</CardTitle>
              <CardDescription>
                Configure basic platform settings and defaults
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...platformSettingsForm}>
                <form onSubmit={platformSettingsForm.handleSubmit(handlePlatformSettingsSave)} className="space-y-4">
                  <FormField
                    control={platformSettingsForm.control}
                    name="siteName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Site Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          The name of your affiliate network platform
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={platformSettingsForm.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Currency</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select currency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="USD">USD ($)</SelectItem>
                              <SelectItem value="EUR">EUR (€)</SelectItem>
                              <SelectItem value="GBP">GBP (£)</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={platformSettingsForm.control}
                      name="timezone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Timezone</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select timezone" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="UTC">UTC</SelectItem>
                              <SelectItem value="EST">EST (Eastern)</SelectItem>
                              <SelectItem value="PST">PST (Pacific)</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={platformSettingsForm.control}
                      name="defaultCommission"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Commission (%)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={platformSettingsForm.control}
                      name="minimumPayout"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Minimum Payout</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <FormField
                      control={platformSettingsForm.control}
                      name="allowSignups"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Allow Signups</FormLabel>
                            <FormDescription>
                              Enable new user registrations
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={platformSettingsForm.control}
                      name="maintenanceMode"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Maintenance Mode</FormLabel>
                            <FormDescription>
                              Put the platform in maintenance mode
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Button type="submit" disabled={isLoading} className="mt-4">
                    {isLoading && <Save className="mr-2 h-4 w-4 animate-spin" />}
                    Save Settings
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="affiliate" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Affiliate Settings</CardTitle>
              <CardDescription>
                Configure settings for affiliate users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...affiliateSettingsForm}>
                <form onSubmit={affiliateSettingsForm.handleSubmit(handleAffiliateSettingsSave)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={affiliateSettingsForm.control}
                      name="minimumWithdrawal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Minimum Withdrawal Amount</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormDescription>
                            Minimum amount an affiliate can withdraw
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={affiliateSettingsForm.control}
                      name="withdrawalFee"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Withdrawal Fee (%)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormDescription>
                            Percentage fee charged on withdrawals
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={affiliateSettingsForm.control}
                    name="maxTrackingLinks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Tracking Links</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormDescription>
                          Maximum number of tracking links an affiliate can create
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  <div className="space-y-4">
                    <FormField
                      control={affiliateSettingsForm.control}
                      name="requireApproval"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Require Approval</FormLabel>
                            <FormDescription>
                              Require manual approval for new affiliate accounts
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={affiliateSettingsForm.control}
                      name="allowDirectLinks"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Allow Direct Linking</FormLabel>
                            <FormDescription>
                              Allow affiliates to use direct linking to offers
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Button type="submit" disabled={isLoading} className="mt-4">
                    {isLoading && <Save className="mr-2 h-4 w-4 animate-spin" />}
                    Save Affiliate Settings
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="advertiser" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Advertiser Settings</CardTitle>
              <CardDescription>
                Configure settings for advertiser users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...advertiserSettingsForm}>
                <form onSubmit={advertiserSettingsForm.handleSubmit(handleAdvertiserSettingsSave)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={advertiserSettingsForm.control}
                      name="minimumDeposit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Minimum Deposit Amount</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormDescription>
                            Minimum amount an advertiser can deposit
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={advertiserSettingsForm.control}
                      name="depositFee"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Deposit Fee (%)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormDescription>
                            Percentage fee charged on deposits
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={advertiserSettingsForm.control}
                    name="maxOffers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Active Offers</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormDescription>
                          Maximum number of active offers an advertiser can have
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  <div className="space-y-4">
                    <FormField
                      control={advertiserSettingsForm.control}
                      name="requireApproval"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Require Approval</FormLabel>
                            <FormDescription>
                              Require manual approval for new advertiser accounts
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={advertiserSettingsForm.control}
                      name="requireOfferApproval"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Require Offer Approval</FormLabel>
                            <FormDescription>
                              Require admin approval for new offers
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Button type="submit" disabled={isLoading} className="mt-4">
                    {isLoading && <Save className="mr-2 h-4 w-4 animate-spin" />}
                    Save Advertiser Settings
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Configure platform security settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...securitySettingsForm}>
                <form onSubmit={securitySettingsForm.handleSubmit(handleSecuritySettingsSave)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={securitySettingsForm.control}
                      name="sessionTimeout"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Session Timeout (minutes)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormDescription>
                            How long users stay logged in while inactive
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={securitySettingsForm.control}
                      name="maxLoginAttempts"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Login Attempts</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormDescription>
                            Maximum failed login attempts before lockout
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={securitySettingsForm.control}
                    name="passwordMinLength"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Password Length</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <div className="space-y-4">
                    <FormField
                      control={securitySettingsForm.control}
                      name="twoFactorAuth"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Require Two-Factor Authentication</FormLabel>
                            <FormDescription>
                              Require all users to set up two-factor authentication
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={securitySettingsForm.control}
                      name="passwordRequireUppercase"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Require Uppercase Letters</FormLabel>
                            <FormDescription>
                              Passwords must contain at least one uppercase letter
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={securitySettingsForm.control}
                      name="passwordRequireNumbers"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Require Numbers</FormLabel>
                            <FormDescription>
                              Passwords must contain at least one number
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={securitySettingsForm.control}
                      name="passwordRequireSymbols"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Require Symbols</FormLabel>
                            <FormDescription>
                              Passwords must contain at least one special character
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Button type="submit" disabled={isLoading} className="mt-4">
                    {isLoading && <Save className="mr-2 h-4 w-4 animate-spin" />}
                    Save Security Settings
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure platform notification settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...notificationSettingsForm}>
                <form onSubmit={notificationSettingsForm.handleSubmit(handleNotificationSettingsSave)} className="space-y-4">
                  <FormField
                    control={notificationSettingsForm.control}
                    name="slackWebhook"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slack Webhook URL</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          URL for sending notifications to Slack
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={notificationSettingsForm.control}
                    name="largeWithdrawalThreshold"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Large Withdrawal Threshold</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormDescription>
                          Amount that triggers a large withdrawal notification
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  <div className="space-y-4">
                    <FormField
                      control={notificationSettingsForm.control}
                      name="emailNotifications"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Email Notifications</FormLabel>
                            <FormDescription>
                              Send admin notifications via email
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={notificationSettingsForm.control}
                      name="notifyNewUser"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">New User Notifications</FormLabel>
                            <FormDescription>
                              Notify when new users register
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={notificationSettingsForm.control}
                      name="notifyNewOffer"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">New Offer Notifications</FormLabel>
                            <FormDescription>
                              Notify when new offers are created
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={notificationSettingsForm.control}
                      name="notifyNewConversion"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">New Conversion Notifications</FormLabel>
                            <FormDescription>
                              Notify when new conversions are recorded
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={notificationSettingsForm.control}
                      name="notifyLargeWithdrawal"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Large Withdrawal Notifications</FormLabel>
                            <FormDescription>
                              Notify when large withdrawals are requested
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Button type="submit" disabled={isLoading} className="mt-4">
                    {isLoading && <Save className="mr-2 h-4 w-4 animate-spin" />}
                    Save Notification Settings
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
