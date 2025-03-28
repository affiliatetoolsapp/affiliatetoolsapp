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
        
        // Use the same approach as AffiliateApprovals component by doing a join with nested selects
        const { data: approvedPartners, error: affiliatesError } = await supabase
          .from('affiliate_offers')
          .select(`
            id,
            offer_id,
            affiliate_id,
            applied_at,
            reviewed_at,
            offers(id, name)
          `)
          .eq('status', 'approved')
          .in('offer_id', offerIds);
          
        if (affiliatesError) {
          console.error('Error fetching approved affiliates:', affiliatesError);
          throw affiliatesError;
        }
        
        console.log('Approved partners with user data:', approvedPartners);
        
        if (!approvedPartners || approvedPartners.length === 0) {
          return [];
        }
        
        // Count stats for each affiliate - using the same data processing pattern as before
        const affiliateMap = new Map();
        
        for (const affOffer of approvedPartners) {
          const affiliateId = affOffer.affiliate_id;
          
          console.log('Processing affiliate:', affiliateId);
          
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
              email: 'Hidden for Privacy',
              contact_name: `Affiliate ID: ${affiliateId}`,
              company_name: '',
              website: '',
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
  
  // Filter affiliates based on search query
  const filteredAffiliates = affiliates?.filter(affiliate => 
    affiliate.contact_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    affiliate.email.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const viewAffiliateProfile = (affiliate: any) => {
    setSelectedAffiliate(affiliate);
    setIsProfileDialogOpen(true);
  };

  const handleInviteAffiliate = () => {
    if (!inviteEmail) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter an email address",
      });
      return;
    }
    
    // In a real app, this would send an invitation email
    // For now, we'll just show a success toast
    toast({
      title: "Invitation Sent",
      description: "The affiliate has been invited to join your program",
    });
    
    setIsInviteDialogOpen(false);
    setInviteEmail('');
    setInviteMessage('');
  };
  
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
                Send an invitation to join your affiliate program
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="affiliate@example.com"
                />
              </div>
              <div>
                <Label htmlFor="message">Message (Optional)</Label>
                <Textarea
                  id="message"
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  placeholder="Add a personal message to your invitation..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleInviteAffiliate}>
                Send Invitation
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
                          <div className="text-sm text-muted-foreground">ID: {affiliate.id}</div>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Affiliate Profile</DialogTitle>
          </DialogHeader>
          {selectedAffiliate && (
            <div className="space-y-4">
              <div>
                <Label>Contact Name</Label>
                <p className="text-sm">{selectedAffiliate.contact_name}</p>
              </div>
              <div>
                <Label>Email</Label>
                <p className="text-sm">{selectedAffiliate.email}</p>
              </div>
              <div>
                <Label>Company</Label>
                <p className="text-sm">{selectedAffiliate.company_name || 'Not provided'}</p>
              </div>
              <div>
                <Label>Website</Label>
                <p className="text-sm">{selectedAffiliate.website || 'Not provided'}</p>
              </div>
              <div>
                <Label>Traffic Sources</Label>
                <p className="text-sm">
                  {selectedAffiliate.traffic_sources?.length 
                    ? selectedAffiliate.traffic_sources.join(', ') 
                    : 'Not provided'}
                </p>
              </div>
              <div>
                <Label>Performance</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Clicks</p>
                    <p className="font-medium">{selectedAffiliate.total_clicks.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Conversions</p>
                    <p className="font-medium">{selectedAffiliate.total_conversions}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Conversion Rate</p>
                    <p className="font-medium">{selectedAffiliate.conversion_rate}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Payout</p>
                    <p className="font-medium">${selectedAffiliate.total_payout.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
