
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
  Mail,
  User
} from 'lucide-react';
import AffiliateApprovals from '../offers/AffiliateApprovals';

export default function AffiliatePartners() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAffiliate, setSelectedAffiliate] = useState<any>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  
  // Get approved affiliates - real data from Supabase
  const { data: affiliates, isLoading: affiliatesLoading } = useQuery({
    queryKey: ['advertiser-affiliates', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      try {
        console.log('Fetching active affiliates for advertiser:', user.id);
        
        // Get all approved affiliate_offers for this advertiser's offers
        const { data: advertiserOffers, error: offersError } = await supabase
          .from('offers')
          .select('id')
          .eq('advertiser_id', user.id);
          
        if (offersError) throw offersError;
        
        if (!advertiserOffers || advertiserOffers.length === 0) {
          return [];
        }
        
        const offerIds = advertiserOffers.map(offer => offer.id);
        
        // Get approved affiliates for these offers with proper user data
        const { data: approvedAffiliates, error: affiliatesError } = await supabase
          .from('affiliate_offers')
          .select(`
            id,
            offer_id,
            affiliate_id,
            applied_at,
            reviewed_at,
            offers(id, name),
            users:affiliate_id(
              id, 
              email, 
              contact_name, 
              company_name, 
              website
            )
          `)
          .eq('status', 'approved')
          .in('offer_id', offerIds);
          
        if (affiliatesError) {
          console.error('Error fetching approved affiliates:', affiliatesError);
          throw affiliatesError;
        }
        
        console.log('Approved affiliates data:', approvedAffiliates);
        
        if (!approvedAffiliates || approvedAffiliates.length === 0) {
          return [];
        }
        
        // Count stats for each affiliate
        const affiliateMap = new Map();
        
        for (const affOffer of approvedAffiliates) {
          const affiliateId = affOffer.affiliate_id;
          const userData = affOffer.users;
          
          console.log('Processing affiliate:', affiliateId, 'User data:', userData);
          
          if (!affiliateMap.has(affiliateId)) {
            // Get performance data for this affiliate
            const { data: clicks, error: clicksError } = await supabase
              .from('clicks')
              .select('click_id, created_at')
              .eq('affiliate_id', affiliateId)
              .in('offer_id', offerIds);
              
            if (clicksError) console.error('Error fetching clicks:', clicksError);
            
            const totalClicks = clicks?.length || 0;
            
            // Get conversions
            let conversions = [];
            let totalPayout = 0;
            
            if (totalClicks > 0) {
              const clickIds = clicks.map(c => c.click_id);
              
              const { data: convData, error: convError } = await supabase
                .from('conversions')
                .select('*')
                .in('click_id', clickIds);
                
              if (convError) console.error('Error fetching conversions:', convError);
              
              conversions = convData || [];
              totalPayout = conversions.reduce((sum, conv) => sum + (conv.commission || 0), 0);
            }
            
            const totalConversions = conversions.length;
            const convRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
            
            // Create affiliate entry with properly accessed user data
            affiliateMap.set(affiliateId, {
              id: affiliateId,
              email: userData?.email || 'Unknown',
              contact_name: userData?.contact_name || 'Unknown Affiliate',
              company_name: userData?.company_name || '',
              website: userData?.website || '',
              approved_offers: 1,
              total_clicks: totalClicks,
              total_conversions: totalConversions,
              conversion_rate: parseFloat(convRate.toFixed(2)),
              total_payout: totalPayout,
              join_date: new Date(affOffer.reviewed_at || affOffer.applied_at).toISOString().split('T')[0],
              traffic_sources: [],
              status: 'active'
            });
          } else {
            // Update existing affiliate
            const affiliate = affiliateMap.get(affiliateId);
            affiliate.approved_offers += 1;
          }
        }
        
        const result = Array.from(affiliateMap.values());
        console.log('Processed affiliates:', result);
        return result;
      } catch (error) {
        console.error('Error fetching affiliates:', error);
        throw error;
      }
    },
    enabled: !!user && user.role === 'advertiser',
  });
  
  // Invite affiliate mutation
  const inviteAffiliateMutation = useMutation({
    mutationFn: async ({ email, message }: { email: string, message: string }) => {
      if (!user) throw new Error('User not authenticated');
      
      // In a real app, this would send an invitation email
      // For now, we'll just show a success toast
      
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
  
  const handleInviteAffiliate = () => {
    if (!inviteEmail) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter an email address",
      });
      return;
    }
    
    inviteAffiliateMutation.mutate({
      email: inviteEmail,
      message: inviteMessage
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
                disabled={inviteAffiliateMutation.isPending || !inviteEmail}
              >
                {inviteAffiliateMutation.isPending ? "Sending..." : "Send Invitation"}
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
          <AffiliateApprovals />
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
                  {selectedAffiliate.traffic_sources && selectedAffiliate.traffic_sources.length > 0 ? (
                    selectedAffiliate.traffic_sources.map((source: string) => (
                      <span 
                        key={source} 
                        className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium"
                      >
                        {source}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No traffic sources specified</span>
                  )}
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
