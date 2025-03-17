import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Offer, AffiliateOffer, Click, Conversion, Wallet, TrackingLink } from '@/types';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Search, ExternalLink, Copy, Link } from 'lucide-react';

export default function AffiliateDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [offerSearch, setOfferSearch] = useState('');
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [trafficSource, setTrafficSource] = useState('');
  const [applicationNotes, setApplicationNotes] = useState('');

  // Get all available offers
  const { data: offers } = useQuery({
    queryKey: ['available-offers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .eq('status', 'active');
      if (error) throw error;
      return data as Offer[];
    },
  });

  // Get user's offer applications
  const { data: affiliateOffers, refetch: refetchAffiliateOffers } = useQuery({
    queryKey: ['affiliate-offers', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('affiliate_offers')
        .select('*, offers(*)')
        .eq('affiliate_id', user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Get user's clicks
  const { data: clicks } = useQuery({
    queryKey: ['affiliate-clicks', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('clicks')
        .select('*')
        .eq('affiliate_id', user.id);
      if (error) throw error;
      return data as Click[];
    },
    enabled: !!user,
  });

  // Get user's conversions
  const { data: conversions } = useQuery({
    queryKey: ['affiliate-conversions', user?.id],
    queryFn: async () => {
      if (!user || !clicks || clicks.length === 0) return [];
      const clickIds = clicks.map(click => click.click_id);
      const { data, error } = await supabase
        .from('conversions')
        .select('*')
        .in('click_id', clickIds);
      if (error) throw error;
      return data as Conversion[];
    },
    enabled: !!(user && clicks && clicks.length > 0),
  });

  // Get user's wallet
  const { data: wallet } = useQuery({
    queryKey: ['affiliate-wallet', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (error) throw error;
      return data as Wallet;
    },
    enabled: !!user,
  });

  // Get user's tracking links
  const { data: trackingLinks, refetch: refetchTrackingLinks } = useQuery({
    queryKey: ['affiliate-tracking-links', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('tracking_links')
        .select('*, offers(*)')
        .eq('affiliate_id', user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Apply to offer using affiliate/apply endpoint
  const applyToOffer = async () => {
    if (!user || !selectedOffer) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('affiliate', {
        method: 'POST',
        body: {
          offerId: selectedOffer.id,
          trafficSource,
          notes: applicationNotes
        },
        urlParams: { path: 'apply' }
      });
      
      if (error) throw error;
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      toast({
        title: 'Application Submitted',
        description: 'Your application has been submitted for review',
      });
      
      setSelectedOffer(null);
      setTrafficSource('');
      setApplicationNotes('');
      refetchAffiliateOffers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit application',
        variant: 'destructive',
      });
    }
  };

  // Generate tracking link
  const generateTrackingLink = async (offer_id: string) => {
    if (!user) return;
    
    try {
      // Generate a unique tracking code
      const trackingCode = `${user.id.slice(0, 8)}-${offer_id.slice(0, 8)}-${Date.now().toString(36)}`;
      
      const { error } = await supabase
        .from('tracking_links')
        .insert({
          affiliate_id: user.id,
          offer_id: offer_id,
          tracking_code: trackingCode,
        });
      
      if (error) throw error;
      
      toast({
        title: 'Link Generated',
        description: 'Your tracking link has been created',
      });
      
      refetchTrackingLinks();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate tracking link',
        variant: 'destructive',
      });
    }
  };

  // Copy tracking link to clipboard
  const copyTrackingLink = (trackingCode: string) => {
    const baseUrl = window.location.origin;
    const trackingUrl = `${baseUrl}/click/${trackingCode}`;
    
    navigator.clipboard.writeText(trackingUrl);
    
    toast({
      title: 'Link Copied',
      description: 'Tracking link copied to clipboard',
    });
  };

  // Filter offers based on search term
  const filteredOffers = offers?.filter(offer => 
    offer.name.toLowerCase().includes(offerSearch.toLowerCase()) ||
    offer.description?.toLowerCase().includes(offerSearch.toLowerCase()) ||
    offer.niche?.toLowerCase().includes(offerSearch.toLowerCase())
  );

  // Stats
  const approvedOffers = affiliateOffers?.filter(ao => ao.status === 'approved').length || 0;
  const pendingOffers = affiliateOffers?.filter(ao => ao.status === 'pending').length || 0;
  const totalClicks = clicks?.length || 0;
  const totalConversions = conversions?.length || 0;
  const pendingBalance = wallet?.pending || 0;
  const availableBalance = wallet?.balance || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Affiliate Dashboard</h1>
        <p className="text-muted-foreground">
          Find offers, generate links, and track your performance
        </p>
      </div>
      
      <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Offers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedOffers}</div>
            <p className="text-xs text-muted-foreground">
              {pendingOffers} pending approval
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClicks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalConversions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${availableBalance.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              ${pendingBalance.toFixed(2)} pending
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="my-offers">
        <TabsList>
          <TabsTrigger value="my-offers">My Offers</TabsTrigger>
          <TabsTrigger value="find-offers">Find Offers</TabsTrigger>
          <TabsTrigger value="tracking-links">Tracking Links</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="my-offers" className="space-y-4">
          <div className="rounded-md border">
            <div className="p-4">
              <h3 className="text-lg font-semibold">My Approved Offers</h3>
              <p className="text-sm text-muted-foreground">Offers you can promote</p>
            </div>
            <div className="border-t">
              {affiliateOffers?.filter(ao => ao.status === 'approved').length ? (
                <div className="divide-y">
                  {affiliateOffers
                    .filter(ao => ao.status === 'approved')
                    .map((ao: any) => (
                      <div key={ao.id} className="p-4 flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{ao.offers.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {ao.offers.commission_type === 'RevShare' 
                              ? `${ao.offers.commission_percent}% RevShare` 
                              : `$${ao.offers.commission_amount} per ${ao.offers.commission_type.slice(2)}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <a href={ao.offers.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-1" />
                              View
                            </a>
                          </Button>
                          <Button size="sm" onClick={() => generateTrackingLink(ao.offers.id)}>
                            <Link className="h-4 w-4 mr-1" />
                            Generate Link
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="p-6 text-center">
                  <p className="text-muted-foreground">You don't have any approved offers yet</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="rounded-md border">
            <div className="p-4">
              <h3 className="text-lg font-semibold">Pending Applications</h3>
              <p className="text-sm text-muted-foreground">Offers awaiting approval from advertisers</p>
            </div>
            <div className="border-t">
              {affiliateOffers?.filter(ao => ao.status === 'pending').length ? (
                <div className="divide-y">
                  {affiliateOffers
                    .filter(ao => ao.status === 'pending')
                    .map((ao: any) => (
                      <div key={ao.id} className="p-4">
                        <h4 className="font-medium">{ao.offers.name}</h4>
                        <p className="text-sm text-muted-foreground">Applied on {new Date(ao.applied_at).toLocaleDateString()}</p>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="p-6 text-center">
                  <p className="text-muted-foreground">You don't have any pending applications</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="find-offers" className="space-y-4">
          <div className="flex items-center w-full max-w-sm space-x-2 mb-4">
            <Input 
              type="search" 
              placeholder="Search offers..." 
              value={offerSearch}
              onChange={(e) => setOfferSearch(e.target.value)}
              className="w-full"
            />
            <Button type="submit" variant="ghost" size="icon">
              <Search className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filteredOffers?.map(offer => (
              <Card key={offer.id} className="overflow-hidden">
                <CardHeader className="p-4">
                  <CardTitle className="text-lg">{offer.name}</CardTitle>
                  <CardDescription className="line-clamp-2">{offer.description}</CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0 flex flex-col gap-2">
                  <div className="text-sm">
                    <span className="font-medium">Commission: </span>
                    {offer.commission_type === 'RevShare' 
                      ? `${offer.commission_percent}% RevShare` 
                      : `$${offer.commission_amount} per ${offer.commission_type.slice(2)}`}
                  </div>
                  {offer.niche && (
                    <div className="text-sm">
                      <span className="font-medium">Niche: </span>{offer.niche}
                    </div>
                  )}
                  
                  <div className="mt-2">
                    {affiliateOffers?.some((ao: any) => ao.offer_id === offer.id) ? (
                      <Button disabled className="w-full">Already Applied</Button>
                    ) : (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button className="w-full">Apply to Offer</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle>Apply to Offer: {offer.name}</DialogTitle>
                            <DialogDescription>
                              Tell the advertiser how you plan to promote their offer
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                              <Label htmlFor="traffic-source">Traffic Source</Label>
                              <Input
                                id="traffic-source"
                                placeholder="e.g., Email, Social Media, Blog"
                                value={trafficSource}
                                onChange={(e) => setTrafficSource(e.target.value)}
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="notes">Additional Notes</Label>
                              <Input
                                id="notes"
                                placeholder="Tell the advertiser more about your promotion plan"
                                value={applicationNotes}
                                onChange={(e) => setApplicationNotes(e.target.value)}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button onClick={() => {
                              setSelectedOffer(offer);
                              applyToOffer();
                            }}>Submit Application</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {filteredOffers?.length === 0 && (
              <div className="col-span-full p-8 text-center border rounded-md">
                <p className="text-muted-foreground">No matching offers found</p>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="tracking-links" className="space-y-4">
          <div className="rounded-md border">
            <div className="p-4">
              <h3 className="text-lg font-semibold">Your Tracking Links</h3>
              <p className="text-sm text-muted-foreground">Use these links to track your promotions</p>
            </div>
            <div className="border-t">
              {trackingLinks?.length ? (
                <div className="divide-y">
                  {trackingLinks.map((link: any) => {
                    const baseUrl = window.location.origin;
                    const trackingUrl = `${baseUrl}/click/${link.tracking_code}`;
                    
                    return (
                      <div key={link.id} className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{link.offers.name}</h4>
                          <Button variant="ghost" size="sm" onClick={() => copyTrackingLink(link.tracking_code)}>
                            <Copy className="h-4 w-4 mr-1" />
                            Copy Link
                          </Button>
                        </div>
                        <div className="p-2 bg-muted rounded text-sm font-mono truncate">
                          {trackingUrl}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Created: {new Date(link.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 text-center">
                  <p className="text-muted-foreground">You haven't generated any tracking links yet</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="performance" className="space-y-4">
          <div className="rounded-md border">
            <div className="p-4">
              <h3 className="text-lg font-semibold">Recent Clicks</h3>
            </div>
            <div className="border-t overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-2 text-left font-medium">Date</th>
                    <th className="p-2 text-left font-medium">Offer</th>
                    <th className="p-2 text-left font-medium">Tracking Code</th>
                    <th className="p-2 text-left font-medium">Location</th>
                    <th className="p-2 text-left font-medium">Device</th>
                  </tr>
                </thead>
                <tbody>
                  {clicks?.slice(0, 10).map(click => (
                    <tr key={click.id} className="border-b hover:bg-muted/50">
                      <td className="p-2">{new Date(click.created_at).toLocaleDateString()}</td>
                      <td className="p-2">
                        {offers?.find(o => o.id === click.offer_id)?.name || 'Unknown Offer'}
                      </td>
                      <td className="p-2 font-mono text-xs">{click.tracking_code}</td>
                      <td className="p-2">{click.geo || 'Unknown'}</td>
                      <td className="p-2">{click.device || 'Unknown'}</td>
                    </tr>
                  ))}
                  {(!clicks || clicks.length === 0) && (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-muted-foreground">No click data recorded yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="rounded-md border">
            <div className="p-4">
              <h3 className="text-lg font-semibold">Recent Conversions</h3>
            </div>
            <div className="border-t overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-2 text-left font-medium">Date</th>
                    <th className="p-2 text-left font-medium">Type</th>
                    <th className="p-2 text-left font-medium">Commission</th>
                    <th className="p-2 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {conversions?.slice(0, 10).map(conversion => (
                    <tr key={conversion.id} className="border-b hover:bg-muted/50">
                      <td className="p-2">{new Date(conversion.created_at).toLocaleDateString()}</td>
                      <td className="p-2 capitalize">{conversion.event_type}</td>
                      <td className="p-2">${conversion.commission?.toFixed(2) || '0.00'}</td>
                      <td className="p-2 capitalize">{conversion.status}</td>
                    </tr>
                  ))}
                  {(!conversions || conversions.length === 0) && (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-muted-foreground">No conversions recorded yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
