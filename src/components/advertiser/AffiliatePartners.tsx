
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, 
  Filter, 
  UserPlus, 
  CheckCircle, 
  XCircle, 
  ExternalLink,
  Mail,
  User
} from 'lucide-react';

export default function AffiliatePartners() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAffiliate, setSelectedAffiliate] = useState<any>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  
  // Get approved affiliates
  const { data: affiliates, isLoading: affiliatesLoading } = useQuery({
    queryKey: ['advertiser-affiliates', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      try {
        // This would be replaced with actual Supabase query in a real app
        // Mock implementation for demo
        return [
          { 
            id: 'aff-1', 
            email: 'affiliate1@example.com', 
            contact_name: 'John Affiliate', 
            approved_offers: 3,
            total_clicks: 1245,
            total_conversions: 87,
            conversion_rate: 6.99,
            total_payout: 825.50,
            join_date: '2023-01-15',
            traffic_sources: ['Social Media', 'Blog', 'Email'],
            status: 'active'
          },
          { 
            id: 'aff-2', 
            email: 'affiliate2@example.com', 
            contact_name: 'Sarah Partner', 
            approved_offers: 2,
            total_clicks: 957,
            total_conversions: 42,
            conversion_rate: 4.39,
            total_payout: 623.75,
            join_date: '2023-03-22',
            traffic_sources: ['PPC', 'Content'],
            status: 'active'
          },
          { 
            id: 'aff-3', 
            email: 'affiliate3@example.com', 
            contact_name: 'Mike Marketer', 
            approved_offers: 5,
            total_clicks: 2134,
            total_conversions: 154,
            conversion_rate: 7.22,
            total_payout: 1432.80,
            join_date: '2022-11-05',
            traffic_sources: ['Social Media', 'SEO', 'YouTube'],
            status: 'active'
          },
          { 
            id: 'aff-4', 
            email: 'affiliate4@example.com', 
            contact_name: 'Emma Promoter', 
            approved_offers: 1,
            total_clicks: 356,
            total_conversions: 12,
            conversion_rate: 3.37,
            total_payout: 156.20,
            join_date: '2023-06-10',
            traffic_sources: ['Instagram', 'TikTok'],
            status: 'active'
          },
        ];
      } catch (error) {
        console.error('Error fetching affiliates:', error);
        throw error;
      }
    },
    enabled: !!user && user.role === 'advertiser',
  });
  
  // Get pending applications
  const { data: applications, isLoading: applicationsLoading } = useQuery({
    queryKey: ['affiliate-applications', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      try {
        // Mock implementation for demo
        return [
          {
            id: 'app-1',
            affiliate_id: 'aff-5',
            affiliate_email: 'newaffiliate@example.com',
            affiliate_name: 'Alex Newbie',
            offer_id: 'offer-1',
            offer_name: 'Finance App Promotion',
            traffic_source: 'Blog, Email Newsletter',
            applied_at: '2023-07-12T15:30:00Z',
            notes: 'I have a finance blog with 10k monthly visitors and an email list of 5k subscribers.'
          },
          {
            id: 'app-2',
            affiliate_id: 'aff-6',
            affiliate_email: 'marketerpro@example.com',
            affiliate_name: 'Chris Marketer',
            offer_id: 'offer-2',
            offer_name: 'SaaS Subscription',
            traffic_source: 'YouTube, Social Media',
            applied_at: '2023-07-10T09:15:00Z',
            notes: 'I have a tech YouTube channel with 50k subscribers and active social media presence.'
          }
        ];
      } catch (error) {
        console.error('Error fetching applications:', error);
        throw error;
      }
    },
    enabled: !!user && user.role === 'advertiser',
  });
  
  // Invite affiliate mutation
  const inviteAffiliateMutation = useMutation({
    mutationFn: async (variables: { email: string, message: string }) => {
      if (!user) throw new Error('User not authenticated');
      
      // This would connect to a real API endpoint in production
      // Mock implementation for demo
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Invitation Sent",
        description: "The affiliate has been invited to join your program",
      });
      
      setIsInviteDialogOpen(false);
      setInviteEmail('');
      setInviteMessage('');
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send invitation",
      });
    }
  });
  
  // Application response mutation
  const respondToApplicationMutation = useMutation({
    mutationFn: async (variables: { applicationId: string, status: 'approved' | 'rejected' }) => {
      if (!user) throw new Error('User not authenticated');
      
      // This would update a real database in production
      // Mock implementation for demo
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      return { success: true };
    },
    onSuccess: (_, variables) => {
      toast({
        title: variables.status === 'approved' ? "Application Approved" : "Application Rejected",
        description: variables.status === 'approved' 
          ? "The affiliate has been approved to promote your offer" 
          : "The application has been rejected",
      });
      
      queryClient.invalidateQueries({ queryKey: ['affiliate-applications', user?.id] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to process application",
      });
    }
  });
  
  const handleInviteAffiliate = () => {
    if (!inviteEmail) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter an email address",
      });
      return;
    }
    
    setIsInviting(true);
    inviteAffiliateMutation.mutate({
      email: inviteEmail,
      message: inviteMessage
    });
    setIsInviting(false);
  };
  
  const handleRespondToApplication = (applicationId: string, status: 'approved' | 'rejected') => {
    respondToApplicationMutation.mutate({
      applicationId,
      status
    });
  };
  
  const viewAffiliateProfile = (affiliate: any) => {
    setSelectedAffiliate(affiliate);
    setIsProfileDialogOpen(true);
  };
  
  // Filter affiliates based on search query
  const filteredAffiliates = affiliates?.filter(affiliate => 
    affiliate.contact_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    affiliate.email.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Affiliate Partners</h1>
          <p className="text-muted-foreground">
            Manage your affiliates and applications
          </p>
        </div>
        
        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite Affiliate
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite New Affiliate</DialogTitle>
              <DialogDescription>
                Send an invitation to a new affiliate to join your program.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  placeholder="affiliate@example.com" 
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="message">Invitation Message (Optional)</Label>
                <Textarea 
                  id="message" 
                  placeholder="Enter a personal message..." 
                  rows={4}
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleInviteAffiliate}
                disabled={isInviting || !inviteEmail}
              >
                {isInviting ? "Sending..." : "Send Invitation"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <Tabs defaultValue="partners">
        <TabsList>
          <TabsTrigger value="partners">Active Partners</TabsTrigger>
          <TabsTrigger value="applications">Pending Applications</TabsTrigger>
        </TabsList>
        
        <TabsContent value="partners">
          <div className="flex items-center space-x-2 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search" 
                placeholder="Search partners..." 
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
          
          {affiliatesLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredAffiliates?.length ? (
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-3 text-left font-medium">Affiliate</th>
                      <th className="p-3 text-left font-medium">Joined</th>
                      <th className="p-3 text-left font-medium">Approved Offers</th>
                      <th className="p-3 text-left font-medium">Clicks</th>
                      <th className="p-3 text-left font-medium">Conv.</th>
                      <th className="p-3 text-left font-medium">Rate</th>
                      <th className="p-3 text-left font-medium">Paid</th>
                      <th className="p-3 text-left font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAffiliates.map((affiliate) => (
                      <tr key={affiliate.id} className="border-b hover:bg-muted/50">
                        <td className="p-3">
                          <div className="font-medium">{affiliate.contact_name}</div>
                          <div className="text-sm text-muted-foreground">{affiliate.email}</div>
                        </td>
                        <td className="p-3">{affiliate.join_date}</td>
                        <td className="p-3">{affiliate.approved_offers}</td>
                        <td className="p-3">{affiliate.total_clicks.toLocaleString()}</td>
                        <td className="p-3">{affiliate.total_conversions}</td>
                        <td className="p-3">{affiliate.conversion_rate}%</td>
                        <td className="p-3">${affiliate.total_payout.toFixed(2)}</td>
                        <td className="p-3">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => viewAffiliateProfile(affiliate)}
                          >
                            <User className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Mail className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground mb-4">You don't have any active affiliate partners yet</p>
              <Button onClick={() => setIsInviteDialogOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Invite Your First Affiliate
              </Button>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="applications">
          {applicationsLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : applications?.length ? (
            <div className="grid gap-6">
              {applications.map((app) => (
                <Card key={app.id}>
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                      <div>
                        <CardTitle>{app.affiliate_name}</CardTitle>
                        <CardDescription>{app.affiliate_email}</CardDescription>
                      </div>
                      <div className="mt-2 sm:mt-0 text-sm text-muted-foreground">
                        Applied: {new Date(app.applied_at).toLocaleDateString()}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="text-sm font-medium mb-1">Applying for Offer:</div>
                      <div className="flex items-center">
                        <span className="font-medium">{app.offer_name}</span>
                        <Button variant="ghost" size="icon" className="h-8 w-8 ml-1">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium mb-1">Traffic Source:</div>
                      <div>{app.traffic_source}</div>
                    </div>
                    
                    {app.notes && (
                      <div>
                        <div className="text-sm font-medium mb-1">Additional Notes:</div>
                        <div className="text-sm">{app.notes}</div>
                      </div>
                    )}
                    
                    <div className="flex justify-end gap-3 pt-2">
                      <Button 
                        variant="outline" 
                        className="text-destructive"
                        onClick={() => handleRespondToApplication(app.id, 'rejected')}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                      <Button
                        onClick={() => handleRespondToApplication(app.id, 'approved')}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No pending applications</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Affiliate Profile Dialog */}
      <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Affiliate Profile</DialogTitle>
          </DialogHeader>
          
          {selectedAffiliate && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">{selectedAffiliate.contact_name}</h3>
                  <p className="text-muted-foreground">{selectedAffiliate.email}</p>
                  <div className="mt-4">
                    <div className="text-sm font-medium mb-1">ID:</div>
                    <div className="text-sm font-mono">{selectedAffiliate.id}</div>
                  </div>
                  <div className="mt-2">
                    <div className="text-sm font-medium mb-1">Joined:</div>
                    <div>{selectedAffiliate.join_date}</div>
                  </div>
                  <div className="mt-2">
                    <div className="text-sm font-medium mb-1">Status:</div>
                    <div className="capitalize">{selectedAffiliate.status}</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <div className="text-sm font-medium mb-1">Total Clicks:</div>
                    <div>{selectedAffiliate.total_clicks.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-1">Total Conversions:</div>
                    <div>{selectedAffiliate.total_conversions}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-1">Conversion Rate:</div>
                    <div>{selectedAffiliate.conversion_rate}%</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-1">Total Paid:</div>
                    <div>${selectedAffiliate.total_payout.toFixed(2)}</div>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium mb-2">Traffic Sources:</div>
                <div className="flex flex-wrap gap-2">
                  {selectedAffiliate.traffic_sources.map((source: string) => (
                    <span 
                      key={source} 
                      className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium"
                    >
                      {source}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium mb-2">Approved Offers:</div>
                <p className="text-sm text-muted-foreground">
                  This affiliate is approved for {selectedAffiliate.approved_offers} offers.
                </p>
              </div>
              
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setIsProfileDialogOpen(false)}>
                  Close
                </Button>
                <Button>
                  <Mail className="mr-2 h-4 w-4" />
                  Contact
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
