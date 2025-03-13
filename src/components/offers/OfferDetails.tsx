
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Offer, AffiliateOffer } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ExternalLink, MoreVertical, Edit, Trash2, Users, AlertTriangle } from 'lucide-react';

interface OfferDetailsProps {
  offerId: string;
}

export default function OfferDetails({ offerId }: OfferDetailsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  const isAdvertiser = user?.role === 'advertiser';
  
  // Get offer details
  const { data: offer, isLoading } = useQuery({
    queryKey: ['offer', offerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .eq('id', offerId)
        .single();
      
      if (error) throw error;
      return data as Offer;
    },
    enabled: !!offerId,
  });
  
  // Get affiliates for this offer
  const { data: affiliateOffers } = useQuery({
    queryKey: ['offer-affiliates', offerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('affiliate_offers')
        .select(`
          *,
          affiliates:users!affiliate_id(*)
        `)
        .eq('offer_id', offerId);
      
      if (error) throw error;
      return data;
    },
    enabled: !!offerId && isAdvertiser,
  });
  
  // Get offer stats (clicks, conversions)
  const { data: offerStats } = useQuery({
    queryKey: ['offer-stats', offerId],
    queryFn: async () => {
      // Get clicks count
      const { count: clicksCount, error: clicksError } = await supabase
        .from('clicks')
        .select('*', { count: 'exact', head: true })
        .eq('offer_id', offerId);
      
      if (clicksError) throw clicksError;
      
      // Get conversions and sum revenue
      const { data: conversions, error: convsError } = await supabase
        .from('clicks')
        .select(`
          click_id,
          conversions:conversions(*)
        `)
        .eq('offer_id', offerId);
      
      if (convsError) throw convsError;
      
      // Calculate total conversions and revenue
      let convCount = 0;
      let totalRevenue = 0;
      let totalCommissions = 0;
      
      conversions.forEach(item => {
        if (item.conversions && item.conversions.length > 0) {
          convCount += item.conversions.length;
          
          item.conversions.forEach((conv: any) => {
            totalRevenue += conv.revenue || 0;
            totalCommissions += conv.commission || 0;
          });
        }
      });
      
      return {
        clicks: clicksCount || 0,
        conversions: convCount,
        revenue: totalRevenue,
        commissions: totalCommissions
      };
    },
    enabled: !!offerId && isAdvertiser,
  });
  
  // Toggle offer status
  const toggleStatus = useMutation({
    mutationFn: async (newStatus: string) => {
      const { error } = await supabase
        .from('offers')
        .update({ status: newStatus })
        .eq('id', offerId);
      
      if (error) throw error;
      return newStatus;
    },
    onSuccess: (newStatus) => {
      queryClient.invalidateQueries({ queryKey: ['offer', offerId] });
      toast({
        title: 'Status Updated',
        description: `Offer status changed to ${newStatus}`,
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update offer status',
      });
      console.error(error);
    },
  });
  
  // Delete offer
  const deleteOffer = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('offers')
        .delete()
        .eq('id', offerId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Offer Deleted',
        description: 'Your offer has been deleted successfully',
      });
      navigate('/offers');
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete offer. It may have active affiliates or tracking data.',
      });
      console.error(error);
    },
  });
  
  // Handle status toggle
  const handleStatusToggle = (checked: boolean) => {
    const newStatus = checked ? 'active' : 'paused';
    toggleStatus.mutate(newStatus);
  };
  
  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    deleteOffer.mutate();
  };
  
  // Get counts for different affiliate statuses
  const approvedAffiliates = affiliateOffers?.filter(ao => ao.status === 'approved').length || 0;
  const pendingAffiliates = affiliateOffers?.filter(ao => ao.status === 'pending').length || 0;
  
  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!offer) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold mb-2">Offer Not Found</h2>
        <p className="text-muted-foreground mb-4">The requested offer could not be found</p>
        <Button asChild>
          <a href="/offers">Back to Offers</a>
        </Button>
      </div>
    );
  }
  
  // Check if current user is the owner
  const isOwner = user?.id === offer.advertiser_id;
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{offer.name}</h1>
            <Badge variant={offer.status === 'active' ? 'default' : 'secondary'} className="capitalize">
              {offer.status}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">{offer.description}</p>
        </div>
        
        {isOwner && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="status" className="cursor-pointer">
                {offer.status === 'active' ? 'Active' : 'Paused'}
              </Label>
              <Switch
                id="status"
                checked={offer.status === 'active'}
                onCheckedChange={handleStatusToggle}
              />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => navigate(`/offers/${offerId}/edit`)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Offer
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setDeleteDialogOpen(true)} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Offer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
      
      {isAdvertiser && offerStats && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{offerStats.clicks}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{offerStats.conversions}</div>
              <p className="text-xs text-muted-foreground">
                CR: {offerStats.clicks ? ((offerStats.conversions / offerStats.clicks) * 100).toFixed(2) : '0.00'}%
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${offerStats.revenue.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Commissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${offerStats.commissions.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Offer Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Offer URL</h4>
              <div className="flex items-center gap-2 mt-1">
                <p className="font-mono text-sm truncate">{offer.url}</p>
                <Button size="icon" variant="ghost" className="h-6 w-6" asChild>
                  <a href={offer.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Commission</h4>
              <p className="mt-1">
                {offer.commission_type === 'RevShare' 
                  ? `${offer.commission_percent}% Revenue Share` 
                  : `$${offer.commission_amount} per ${offer.commission_type.slice(2)}`}
              </p>
            </div>
            
            {offer.niche && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Niche</h4>
                <p className="mt-1">{offer.niche}</p>
              </div>
            )}
            
            {isAdvertiser && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Affiliates</h4>
                <div className="flex items-center gap-2 mt-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <p>{approvedAffiliates} approved</p>
                  {pendingAffiliates > 0 && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      {pendingAffiliates} pending
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {isAdvertiser && (
        <Tabs defaultValue="affiliates">
          <TabsList>
            <TabsTrigger value="affiliates">Affiliates</TabsTrigger>
            <TabsTrigger value="tracking">Tracking</TabsTrigger>
          </TabsList>
          
          <TabsContent value="affiliates">
            <Card>
              <CardHeader>
                <CardTitle>Approved Affiliates</CardTitle>
                <CardDescription>
                  Affiliates currently promoting this offer
                </CardDescription>
              </CardHeader>
              <CardContent>
                {affiliateOffers?.filter(ao => ao.status === 'approved').length ? (
                  <div className="rounded-md border">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="p-2 text-left font-medium">Affiliate</th>
                            <th className="p-2 text-left font-medium">Traffic Source</th>
                            <th className="p-2 text-left font-medium">Approved On</th>
                            <th className="p-2 text-left font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {affiliateOffers
                            .filter((ao: any) => ao.status === 'approved')
                            .map((ao: any) => (
                              <tr key={ao.id} className="border-b hover:bg-muted/50">
                                <td className="p-2">
                                  {ao.affiliates.contact_name || ao.affiliates.email}
                                </td>
                                <td className="p-2">{ao.traffic_source || 'Not specified'}</td>
                                <td className="p-2">
                                  {new Date(ao.reviewed_at).toLocaleDateString()}
                                </td>
                                <td className="p-2">
                                  <Button variant="outline" size="sm">
                                    View Stats
                                  </Button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 border rounded-md">
                    <p className="text-muted-foreground">No approved affiliates yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="tracking">
            <Card>
              <CardHeader>
                <CardTitle>Tracking Information</CardTitle>
                <CardDescription>
                  Implementation details for your technical team
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Postback URL</h4>
                  <div className="bg-muted p-3 rounded-md font-mono text-sm break-all">
                    {`${window.location.origin}/api/conversion?click_id={click_id}&event_type=sale&revenue=100&secret_key=YOUR_SECRET_KEY`}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Use this URL to send conversion data back to our system. Replace <code>{`{click_id}`}</code> with the click ID passed to your offer URL, and update the event type and revenue as needed.
                  </p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Available Parameters</h4>
                  <div className="grid gap-2">
                    <div className="grid grid-cols-4 p-2 border-b">
                      <div className="font-medium">Parameter</div>
                      <div className="font-medium">Required</div>
                      <div className="font-medium">Example</div>
                      <div className="font-medium">Description</div>
                    </div>
                    <div className="grid grid-cols-4 p-2 border-b">
                      <div className="font-mono text-sm">click_id</div>
                      <div>Yes</div>
                      <div className="font-mono text-sm">abc123</div>
                      <div className="text-sm">Unique identifier for the click</div>
                    </div>
                    <div className="grid grid-cols-4 p-2 border-b">
                      <div className="font-mono text-sm">event_type</div>
                      <div>Yes</div>
                      <div className="font-mono text-sm">sale</div>
                      <div className="text-sm">Type: lead, sale, action, deposit</div>
                    </div>
                    <div className="grid grid-cols-4 p-2 border-b">
                      <div className="font-mono text-sm">revenue</div>
                      <div>For RevShare</div>
                      <div className="font-mono text-sm">99.95</div>
                      <div className="text-sm">Transaction amount (for RevShare)</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
      
      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Offer
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this offer? This action cannot be undone and will remove all related tracking links.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteConfirm}
              disabled={deleteOffer.isPending}
            >
              {deleteOffer.isPending ? 'Deleting...' : 'Delete Offer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
