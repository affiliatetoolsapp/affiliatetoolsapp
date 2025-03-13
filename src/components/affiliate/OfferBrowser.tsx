import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Offer } from '@/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Check, ChevronsUpDown, Search, Star, TrendingUp, Tag, ExternalLink, List, Grid } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { LoadingState } from '@/components/LoadingState';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function OfferBrowser() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [trafficSource, setTrafficSource] = useState('');
  const [notes, setNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [nicheFilter, setNicheFilter] = useState('');
  const [commissionTypeFilter, setCommissionTypeFilter] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'highest_payout' | 'trending'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Get all offers available for applications
  const { data: availableOffers, isLoading: offersLoading } = useQuery({
    queryKey: ['available-offers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .eq('status', 'active');
      
      if (error) throw error;
      return data as Offer[];
    },
    enabled: !!user && user.role === 'affiliate',
  });
  
  // Get affiliate's existing applications
  const { data: existingApplications } = useQuery({
    queryKey: ['affiliate-applications', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('affiliate_offers')
        .select('offer_id, status')
        .eq('affiliate_id', user.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user && user.role === 'affiliate',
  });
  
  // Apply for offer mutation
  const applyForOfferMutation = useMutation({
    mutationFn: async (offerId: string) => {
      if (!user) throw new Error("User not authenticated");
      
      // Get the advertiser ID from the offer
      const { data: offerData, error: offerError } = await supabase
        .from('offers')
        .select('advertiser_id')
        .eq('id', offerId)
        .single();
      
      if (offerError) throw offerError;
      
      if (!offerData.advertiser_id) {
        throw new Error("Offer has no advertiser assigned");
      }
      
      const { data, error } = await supabase
        .from('affiliate_offers')
        .insert({
          affiliate_id: user.id,
          offer_id: offerId,
          traffic_source: trafficSource,
          notes: notes,
          applied_at: new Date().toISOString(),
          status: 'pending'
        })
        .select();
      
      if (error) throw error;
      
      console.log("Application submitted:", data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliate-applications', user?.id] });
      toast({
        title: "Application Submitted",
        description: "Your application has been submitted successfully",
      });
      setOpen(false);
      setTrafficSource('');
      setNotes('');
    },
    onError: (error: any) => {
      console.error("Error submitting application:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to submit application",
      });
    }
  });
  
  // Get all commission types
  const commissionTypes = availableOffers ? 
    [...new Set(availableOffers.map(offer => offer.commission_type))] : [];
  
  // Filter and sort offers based on user selections
  const filteredOffers = availableOffers?.filter(offer => {
    const searchMatch = offer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (offer.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
    const nicheMatch = nicheFilter === '' || offer.niche === nicheFilter;
    const commissionTypeMatch = commissionTypeFilter === '' || offer.commission_type === commissionTypeFilter;
    return searchMatch && nicheMatch && commissionTypeMatch;
  }).sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    } else if (sortBy === 'highest_payout') {
      if (a.commission_type === 'RevShare' && b.commission_type === 'RevShare') {
        return (b.commission_percent || 0) - (a.commission_percent || 0);
      } else if (a.commission_type !== 'RevShare' && b.commission_type !== 'RevShare') {
        return (b.commission_amount || 0) - (a.commission_amount || 0);
      } else if (a.commission_type === 'RevShare') {
        // Arbitrary comparison between RevShare and fixed amounts
        return 1;
      } else {
        return -1;
      }
    }
    // For trending, we would need real metrics, for now we use is_featured as a proxy
    return b.is_featured ? 1 : -1;
  });
  
  // Get unique list of niches
  const niches = [...new Set(availableOffers?.map(offer => offer.niche).filter(Boolean))];
  
  // Get featured offers
  const featuredOffers = availableOffers?.filter(offer => offer.is_featured) || [];
  
  // Check if affiliate has already applied for an offer
  const hasApplied = (offerId: string) => {
    return existingApplications?.some(app => app.offer_id === offerId);
  };
  
  // Application status for an offer
  const getApplicationStatus = (offerId: string) => {
    const application = existingApplications?.find(app => app.offer_id === offerId);
    return application?.status || null;
  };
  
  const renderOfferCard = (offer: Offer) => (
    <Card key={offer.id} className={cn("overflow-hidden", 
      offer.is_featured ? "border-2 border-yellow-400 dark:border-yellow-500" : "")}>
      {offer.is_featured && (
        <div className="bg-yellow-400 dark:bg-yellow-600 px-2 py-0.5 text-xs font-semibold text-black dark:text-white flex items-center justify-center">
          <Star className="h-3 w-3 mr-1" />
          Featured Offer
        </div>
      )}
      <CardHeader className="p-4">
        <CardTitle className="text-lg">{offer.name}</CardTitle>
        <CardDescription className="line-clamp-2">
          {offer.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0 grid gap-2">
        <div className="text-sm">
          <span className="font-medium">Commission: </span>
          {offer.commission_type === 'RevShare' 
            ? `${offer.commission_percent}% Revenue Share` 
            : `$${offer.commission_amount} per ${offer.commission_type.slice(2)}`}
        </div>
        
        {offer.niche && (
          <div className="text-sm flex items-center space-x-1">
            <Tag className="h-3 w-3" />
            <span>{offer.niche}</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => window.open(offer.url, '_blank')}
          className="flex items-center"
        >
          <ExternalLink className="h-3 w-3 mr-1" />
          Preview
        </Button>
        
        {hasApplied(offer.id) ? (
          <Badge variant={
            getApplicationStatus(offer.id) === 'approved' ? 'default' : 
            getApplicationStatus(offer.id) === 'rejected' ? 'destructive' : 
            'secondary'
          }>
            {getApplicationStatus(offer.id) === 'approved' ? 'Approved' :
             getApplicationStatus(offer.id) === 'rejected' ? 'Rejected' :
             'Pending'}
          </Badge>
        ) : (
          <Dialog open={open && selectedOffer?.id === offer.id} onOpenChange={(value) => {
            setOpen(value);
            if (!value) setSelectedOffer(null);
          }}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => setSelectedOffer(offer)}>
                Apply Now
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Apply for {selectedOffer?.name}</DialogTitle>
                <DialogDescription>
                  Enter your traffic sources and any notes for the advertiser
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="traffic">Traffic Source</Label>
                  <Input 
                    id="traffic" 
                    value={trafficSource} 
                    onChange={(e) => setTrafficSource(e.target.value)} 
                    placeholder="e.g., Social Media, Email Marketing" 
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea 
                    id="notes" 
                    placeholder="Any additional information you want to share with the advertiser" 
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="secondary"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  onClick={() => {
                    if (selectedOffer) {
                      applyForOfferMutation.mutate(selectedOffer.id);
                    }
                  }}
                >
                  Submit Application
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardFooter>
    </Card>
  );
  
  const renderOffersTable = (offers: Offer[]) => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Niche</TableHead>
            <TableHead>Commission</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {offers.map((offer) => (
            <TableRow key={offer.id}>
              <TableCell className="font-medium">
                {offer.name}
                {offer.is_featured && (
                  <Badge variant="outline" className="ml-2 bg-yellow-100 dark:bg-yellow-900">
                    <Star className="h-3 w-3 mr-1 text-yellow-500" />
                    Featured
                  </Badge>
                )}
              </TableCell>
              <TableCell>{offer.niche || '-'}</TableCell>
              <TableCell>
                {offer.commission_type === 'RevShare' 
                  ? `${offer.commission_percent}% Revenue Share` 
                  : `$${offer.commission_amount} per ${offer.commission_type.slice(2)}`}
              </TableCell>
              <TableCell>
                {hasApplied(offer.id) ? (
                  <Badge variant={
                    getApplicationStatus(offer.id) === 'approved' ? 'default' : 
                    getApplicationStatus(offer.id) === 'rejected' ? 'destructive' : 
                    'secondary'
                  }>
                    {getApplicationStatus(offer.id) === 'approved' ? 'Approved' :
                     getApplicationStatus(offer.id) === 'rejected' ? 'Rejected' :
                     'Pending'}
                  </Badge>
                ) : (
                  <Badge variant="outline">Not Applied</Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => window.open(offer.url, '_blank')}
                  >
                    Preview
                  </Button>
                  
                  {!hasApplied(offer.id) && (
                    <Dialog open={open && selectedOffer?.id === offer.id} onOpenChange={(value) => {
                      setOpen(value);
                      if (!value) setSelectedOffer(null);
                    }}>
                      <DialogTrigger asChild>
                        <Button size="sm" onClick={() => setSelectedOffer(offer)}>
                          Apply
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        {/* Same dialog content as in the card view */}
                        <DialogHeader>
                          <DialogTitle>Apply for {selectedOffer?.name}</DialogTitle>
                          <DialogDescription>
                            Enter your traffic sources and any notes for the advertiser
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="traffic-list">Traffic Source</Label>
                            <Input 
                              id="traffic-list" 
                              value={trafficSource} 
                              onChange={(e) => setTrafficSource(e.target.value)} 
                              placeholder="e.g., Social Media, Email Marketing" 
                            />
                          </div>
                          
                          <div className="grid gap-2">
                            <Label htmlFor="notes-list">Additional Notes</Label>
                            <Textarea 
                              id="notes-list" 
                              placeholder="Any additional information you want to share with the advertiser" 
                              rows={3}
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                            />
                          </div>
                        </div>
                        
                        <DialogFooter>
                          <Button 
                            type="button" 
                            variant="secondary"
                            onClick={() => setOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit"
                            onClick={() => {
                              if (selectedOffer) {
                                applyForOfferMutation.mutate(selectedOffer.id);
                              }
                            }}
                          >
                            Submit Application
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Marketplace</h1>
        <p className="text-muted-foreground">
          Browse available offers and apply to become an affiliate
        </p>
      </div>
      
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Offers</TabsTrigger>
          <TabsTrigger value="featured">Featured</TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
          <TabsTrigger value="my-applications">My Applications</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search" 
                placeholder="Search offers..." 
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={open} className="justify-between">
                    {nicheFilter ? nicheFilter : "Filter by Niche"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command>
                    <CommandInput placeholder="Search niche..." />
                    <CommandList>
                      <CommandItem
                        onSelect={() => {
                          setNicheFilter("");
                        }}
                      >
                        All Niches
                      </CommandItem>
                      <CommandSeparator />
                      {niches.map((niche) => (
                        <CommandItem
                          key={niche}
                          onSelect={() => {
                            setNicheFilter(niche);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              nicheFilter === niche ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {niche}
                        </CommandItem>
                      ))}
                      {niches.length === 0 && (
                        <CommandEmpty>No niches found.</CommandEmpty>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="justify-between">
                    {commissionTypeFilter ? commissionTypeFilter : "Commission Type"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command>
                    <CommandList>
                      <CommandItem onSelect={() => setCommissionTypeFilter("")}>
                        All Types
                      </CommandItem>
                      <CommandSeparator />
                      {commissionTypes.map((type) => (
                        <CommandItem
                          key={type}
                          onSelect={() => setCommissionTypeFilter(type)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              commissionTypeFilter === type ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {type}
                        </CommandItem>
                      ))}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="justify-between">
                    {sortBy === 'newest' ? 'Newest' : 
                     sortBy === 'highest_payout' ? 'Highest Payout' : 
                     'Trending'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command>
                    <CommandList>
                      <CommandItem onSelect={() => setSortBy('newest')}>
                        <Check className={cn("mr-2 h-4 w-4", sortBy === 'newest' ? "opacity-100" : "opacity-0")} />
                        Newest
                      </CommandItem>
                      <CommandItem onSelect={() => setSortBy('highest_payout')}>
                        <Check className={cn("mr-2 h-4 w-4", sortBy === 'highest_payout' ? "opacity-100" : "opacity-0")} />
                        Highest Payout
                      </CommandItem>
                      <CommandItem onSelect={() => setSortBy('trending')}>
                        <Check className={cn("mr-2 h-4 w-4", sortBy === 'trending' ? "opacity-100" : "opacity-0")} />
                        Trending
                      </CommandItem>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              
              <div className="flex items-center border rounded-md">
                <Button 
                  variant={viewMode === 'grid' ? 'default' : 'ghost'} 
                  size="sm" 
                  className="rounded-r-none" 
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button 
                  variant={viewMode === 'list' ? 'default' : 'ghost'} 
                  size="sm" 
                  className="rounded-l-none" 
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          {offersLoading ? (
            <LoadingState />
          ) : filteredOffers?.length ? (
            viewMode === 'grid' ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredOffers.map((offer) => renderOfferCard(offer))}
              </div>
            ) : (
              renderOffersTable(filteredOffers)
            )
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No offers found</p>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="featured">
          {offersLoading ? (
            <LoadingState />
          ) : featuredOffers?.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {featuredOffers.map((offer) => renderOfferCard(offer))}
              </div>
            ) : (
              renderOffersTable(featuredOffers)
            )
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No featured offers available</p>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="trending">
          <Card className="p-8 text-center">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-2">Trending offers data will be available soon</p>
            <p className="text-xs text-muted-foreground">This feature is coming in the next update</p>
          </Card>
        </TabsContent>
        
        <TabsContent value="my-applications">
          {offersLoading || !existingApplications ? (
            <LoadingState />
          ) : existingApplications.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {availableOffers
                  ?.filter(offer => existingApplications.some(app => app.offer_id === offer.id))
                  .map((offer) => renderOfferCard(offer))}
              </div>
            ) : (
              renderOffersTable(availableOffers?.filter(offer => 
                existingApplications.some(app => app.offer_id === offer.id)) || [])
            )
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">You haven't applied to any offers yet</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
