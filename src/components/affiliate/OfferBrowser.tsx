import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Offer, AffiliateOffer } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { formatGeoTargets } from './utils/offerUtils';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowUpRight, Clock, Eye, Filter, Grid, List, MapPin, Search, Trash2, Award, Tag, Target, DollarSign, Globe, AlertTriangle } from 'lucide-react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import OfferDetailView from './OfferDetailView';

export default function OfferBrowser() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentNiche, setCurrentNiche] = useState<string | null>(null);
  const navigate = useNavigate();
  const [displayMode, setDisplayMode] = useState<'grid' | 'list'>('list'); // Changed default to 'list'
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [trafficSource, setTrafficSource] = useState('');
  const [applicationNotes, setApplicationNotes] = useState('');
  const [showOfferDetail, setShowOfferDetail] = useState(false);
  const [currentOfferId, setCurrentOfferId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch all active offers
  const { data: offers, isLoading: offersLoading } = useQuery({
    queryKey: ['marketplace-offers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .eq('status', 'active');
      
      if (error) {
        console.error('Error fetching offers:', error);
        throw error;
      }
      
      console.log('Fetched offers:', data);
      return data as Offer[];
    },
  });

  // Fetch user's applications
  const { data: applications, isLoading: applicationsLoading } = useQuery({
    queryKey: ['affiliate-applications', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('affiliate_offers')
        .select('*, offers(*)')
        .eq('affiliate_id', user.id);
      
      if (error) throw error;
      console.log('Fetched applications:', data);
      return data as AffiliateOffer[];
    },
    enabled: !!user,
  });

  // Apply to offer mutation
  const applyToOffer = useMutation({
    mutationFn: async ({
      offerId,
      affiliateId,
      source,
      notes
    }: {
      offerId: string;
      affiliateId: string;
      source: string;
      notes: string;
    }) => {
      const { data, error } = await supabase
        .from('affiliate_offers')
        .insert({
          offer_id: offerId,
          affiliate_id: affiliateId,
          traffic_source: source,
          notes: notes,
          status: 'pending',
          applied_at: new Date().toISOString()
        })
        .select();
      
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliate-applications'] });
      toast({
        title: 'Application Submitted',
        description: 'Your application has been submitted successfully',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to submit application',
      });
      console.error(error);
    }
  });

  // Cancel application mutation
  const cancelApplication = useMutation({
    mutationFn: async (applicationId: string) => {
      const { error } = await supabase
        .from('affiliate_offers')
        .delete()
        .eq('id', applicationId);
      
      if (error) throw error;
      return applicationId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliate-applications'] });
      toast({
        title: 'Application Cancelled',
        description: 'Your application has been successfully cancelled',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to cancel application. Please try again.',
      });
      console.error(error);
    }
  });

  // Handle apply to offer
  const handleApply = () => {
    if (!user || !selectedOffer) return;
    
    applyToOffer.mutate({
      offerId: selectedOffer.id,
      affiliateId: user.id,
      source: trafficSource,
      notes: applicationNotes
    });
    
    setSelectedOffer(null);
    setTrafficSource('');
    setApplicationNotes('');
  };

  // Handle cancel application
  const handleCancelApplication = (applicationId: string) => {
    cancelApplication.mutate(applicationId);
  };

  // View offer details
  const handleViewOffer = (offer: Offer) => {
    setCurrentOfferId(offer.id);
    setShowOfferDetail(true);
  };

  // Get unique niches
  const niches = [...new Set(offers?.map(offer => offer.niche).filter(Boolean))];
  
  // Filter offers
  const filteredOffers = offers?.filter(offer => {
    const matchesSearch = 
      offer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (offer.description && offer.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (offer.niche && offer.niche.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesNiche = currentNiche ? offer.niche === currentNiche : true;
    
    return matchesSearch && matchesNiche;
  });

  // Check application status for an offer
  const getApplicationStatus = (offerId: string) => {
    if (!applications) return null;
    
    const application = applications.find(app => app.offer_id === offerId);
    return application ? { status: application.status, id: application.id } : null;
  };

  
  // Format restricted geos for display - keep this
  const formatRestrictedGeos = (offer: Offer) => {
    if (!offer.restricted_geos || !Array.isArray(offer.restricted_geos) || offer.restricted_geos.length === 0) {
      return null;
    }
    
    return offer.restricted_geos;
  };

  // Back from offer detail
  const handleBackFromDetail = () => {
    setShowOfferDetail(false);
    setCurrentOfferId(null);
  };

  // Loading state
  if (offersLoading || applicationsLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show offer detail view if an offer is selected
  if (showOfferDetail && currentOfferId) {
    const offer = offers?.find(o => o.id === currentOfferId);
    if (!offer) return null;
    
    const applicationStatus = getApplicationStatus(currentOfferId)?.status || null;
    
    return (
      <OfferDetailView 
        offer={offer} 
        applicationStatus={applicationStatus} 
        onBack={handleBackFromDetail} 
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search offers..."
            className="pl-8 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-2">
          <Tabs defaultValue="all" className="w-full md:w-auto">
            <TabsList>
              <TabsTrigger value="all" onClick={() => setCurrentNiche(null)}>
                All Offers
              </TabsTrigger>
              <TabsTrigger value="filter">
                <Filter className="h-4 w-4 mr-1" />
                Filter by Niche
              </TabsTrigger>
            </TabsList>
            <TabsContent value="filter" className="absolute z-10 mt-2 bg-background shadow rounded-md p-2 border w-48">
              <div className="space-y-1">
                {niches.map(niche => (
                  <Button
                    key={niche}
                    variant={currentNiche === niche ? "default" : "ghost"}
                    className="w-full justify-start text-left"
                    onClick={() => setCurrentNiche(niche)}
                  >
                    {niche}
                  </Button>
                ))}
              </div>
            </TabsContent>
          </Tabs>
          <div className="border rounded-md flex">
            <Button
              variant={displayMode === 'grid' ? 'default' : 'ghost'}
              size="icon"
              className="rounded-r-none"
              onClick={() => setDisplayMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={displayMode === 'list' ? 'default' : 'ghost'}
              size="icon"
              className="rounded-l-none"
              onClick={() => setDisplayMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {filteredOffers?.length === 0 && (
        <div className="text-center p-12 border rounded-md">
          <p className="text-muted-foreground">No offers match your search criteria.</p>
        </div>
      )}

      {displayMode === 'grid' ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredOffers?.map(offer => {
            const application = getApplicationStatus(offer.id);
            const geoData = formatGeoTargets(offer);
            const restrictedGeos = formatRestrictedGeos(offer);
            
            return (
              <Card key={offer.id} className="overflow-hidden">
                <CardHeader className="p-4">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{offer.name}</CardTitle>
                    {offer.is_featured && (
                      <Badge variant="secondary" className="flex items-center">
                        <Award className="h-3 w-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="line-clamp-2">{offer.description}</CardDescription>
                </CardHeader>
                
                <CardContent className="p-4 pt-0 space-y-3">
                  <div className="text-sm flex items-center">
                    <DollarSign className="h-4 w-4 mr-1 text-green-500" />
                    <span className="font-medium mr-1">Commission:</span>
                    {offer.commission_type === 'RevShare' 
                      ? `${offer.commission_percent}% Revenue Share` 
                      : `$${offer.commission_amount} per ${offer.commission_type.slice(2)}`}
                  </div>
                  
                  {offer.niche && (
                    <div className="text-sm flex items-center">
                      <Tag className="h-4 w-4 mr-1 text-blue-500" />
                      <span className="font-medium mr-1">Niche:</span>
                      {offer.niche}
                    </div>
                  )}
                  
                  {/* Targeted Geos Section - Updated with type-safe approach */}
                  <div className="text-sm">
                    <div className="flex items-center mb-1">
                      <Globe className="h-4 w-4 mr-1 text-indigo-500" />
                      <span className="font-medium">Targeted Geos:</span>
                    </div>
                    <div className="flex flex-wrap gap-1 ml-5 mt-1">
                      {geoData.length <= 3 ? (
                        // If 3 or fewer countries, show them all
                        geoData.map((geo, i) => (
                          <Badge key={i} variant="outline" className="flex items-center">
                            {geo.flag} {geo.code}
                          </Badge>
                        ))
                      ) : (
                        // If more than 3 countries, show globe icon with hover
                        <HoverCard>
                          <HoverCardTrigger asChild>
                            <Badge variant="outline" className="text-xs cursor-pointer">
                              <Globe className="h-3 w-3 mr-1" />
                              {geoData.length} countries
                            </Badge>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-auto max-w-[300px]">
                            <div className="font-medium mb-2">Targeted Countries:</div>
                            <div className="flex flex-wrap gap-1">
                              {geoData.map((geo, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {geo.flag} {geo.code}
                                </Badge>
                              ))}
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      )}
                    </div>
                  </div>
                  
                  {/* Restricted Geos Section - Keep existing code */}
                  {restrictedGeos && restrictedGeos.length > 0 && (
                    <div className="text-sm">
                      <div className="flex items-center mb-1">
                        <AlertTriangle className="h-4 w-4 mr-1 text-amber-500" />
                        <span className="font-medium">Restricted Geos:</span>
                      </div>
                      <div className="flex flex-wrap gap-1 ml-5 mt-1">
                        {restrictedGeos.map((geo, index) => (
                          <Badge key={`${geo}-${index}`} variant="outline" className="flex items-center bg-red-50 text-red-700 border-red-200">
                            <MapPin className="h-3 w-3 mr-1" />
                            {geo}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Traffic Sources - Keep existing code */}
                  {offer.allowed_traffic_sources && Array.isArray(offer.allowed_traffic_sources) && offer.allowed_traffic_sources.length > 0 && (
                    <div className="text-sm">
                      <div className="flex items-center">
                        <Target className="h-4 w-4 mr-1 text-purple-500" />
                        <span className="font-medium">Allowed Traffic:</span>
                      </div>
                      <div className="flex flex-wrap gap-1 ml-5 mt-1">
                        {offer.allowed_traffic_sources.map(source => (
                          <Badge key={source} variant="outline">{source}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
                
                <CardFooter className="p-4 pt-0 flex flex-col gap-2">
                  {application?.status === 'approved' ? (
                    <div className="w-full space-y-2">
                      <Button 
                        className="w-full" 
                        onClick={() => navigate(`/offers/${offer.id}`)}
                      >
                        View Offer
                      </Button>
                    </div>
                  ) : application?.status === 'pending' ? (
                    <div className="w-full space-y-2">
                      <div className="flex justify-between items-center w-full">
                        <Badge variant="outline" className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          Application Pending
                        </Badge>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Cancel Application</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to cancel your application for "{offer.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>No, keep it</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleCancelApplication(application.id)}>
                                Yes, cancel application
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        onClick={() => handleViewOffer(offer)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  ) : application?.status === 'rejected' ? (
                    <div className="w-full space-y-2">
                      <Button variant="outline" className="w-full" disabled>
                        Application Rejected
                      </Button>
                      <Button 
                        variant="secondary" 
                        className="w-full" 
                        onClick={() => handleViewOffer(offer)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  ) : (
                    <div className="w-full flex flex-col gap-2">
                      <Button 
                        variant="secondary" 
                        className="w-full" 
                        onClick={() => handleViewOffer(offer)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button className="w-full">Apply to Promote</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Apply to Promote: {offer.name}</DialogTitle>
                            <DialogDescription>
                              Tell the advertiser how you plan to promote their offer
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="traffic-source">Traffic Source</Label>
                              <Input
                                id="traffic-source"
                                placeholder="e.g., Email, Social Media, Blog"
                                value={trafficSource}
                                onChange={(e) => setTrafficSource(e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="notes">Additional Notes (Optional)</Label>
                              <Input
                                id="notes"
                                placeholder="Tell the advertiser more about your promotion plan"
                                value={applicationNotes}
                                onChange={(e) => setApplicationNotes(e.target.value)}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button 
                              onClick={() => {
                                setSelectedOffer(offer);
                                handleApply();
                              }}
                              disabled={!trafficSource || applyToOffer.isPending}
                            >
                              {applyToOffer.isPending ? 'Submitting...' : 'Submit Application'}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-3 font-medium">Offer</th>
                <th className="text-left p-3 font-medium">Niche</th>
                <th className="text-left p-3 font-medium">Commission</th>
                <th className="text-left p-3 font-medium hide-on-mobile">Geo Targeting</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredOffers?.map(offer => {
                const application = getApplicationStatus(offer.id);
                const geoData = formatGeoTargets(offer);
                const restrictedGeos = formatRestrictedGeos(offer);
                
                return (
                  <tr key={offer.id} className="hover:bg-muted/50">
                    <td className="p-3">
                      <div className="font-medium">{offer.name}</div>
                      <div className="text-sm text-muted-foreground line-clamp-1">{offer.description}</div>
                    </td>
                    <td className="p-3">{offer.niche || '-'}</td>
                    <td className="p-3">
                      {offer.commission_type === 'RevShare' 
                        ? `${offer.commission_percent}% Revenue Share` 
                        : `$${offer.commission_amount} per ${offer.commission_type.slice(2)}`}
                    </td>
                    <td className="p-3 hide-on-mobile">
                      <div className="flex flex-col gap-1">
                        <div className="text-xs font-medium">Targeted:</div>
                        <div className="flex flex-wrap gap-1">
                          {geoData.length <= 3 ? (
                            geoData.map((geo, index) => (
                              <Badge key={index} variant="outline" className="flex items-center">
                                {geo.flag} {geo.code}
                              </Badge>
                            ))
                          ) : (
                            <HoverCard>
                              <HoverCardTrigger asChild>
                                <Badge variant="outline" className="text-xs cursor-pointer">
                                  <Globe className="h-3 w-3 mr-1" />
                                  {geoData.length} countries
                                </Badge>
                              </HoverCardTrigger>
                              <HoverCardContent className="w-auto max-w-[300px]">
                                <div className="font-medium mb-2">Targeted Countries:</div>
                                <div className="flex flex-wrap gap-1">
                                  {geoData.map((geo, i) => (
                                    <Badge key={i} variant="outline" className="text-xs">
                                      {geo.flag} {geo.code}
                                    </Badge>
                                  ))}
                                </div>
                              </HoverCardContent>
                            </HoverCard>
                          )}
                        </div>
                        
                        {restrictedGeos && restrictedGeos.length > 0 && (
                          <>
                            <div className="text-xs font-medium mt-1 text-amber-700">Restricted:</div>
                            <div className="flex flex-wrap gap-1">
                              {restrictedGeos.slice(0, 2).map((geo, index) => (
                                <Badge key={`${geo}-${index}`} variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                  {geo}
                                </Badge>
                              ))}
                              {restrictedGeos.length > 2 && (
                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                  +{restrictedGeos.length - 2} more
                                </Badge>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      {application?.status === 'approved' ? (
                        <Badge variant="default">Approved</Badge>
                      ) : application?.status === 'pending' ? (
                        <Badge variant="outline">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      ) : application?.status === 'rejected' ? (
                        <Badge variant="destructive">Rejected</Badge>
                      ) : (
                        <Badge variant="outline">Not Applied</Badge>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewOffer(offer)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        
                        {application?.status === 'pending' && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-1" />
                                Cancel
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Cancel Application</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to cancel your application for "{offer.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>No, keep it</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleCancelApplication(application.id)}>
                                  Yes, cancel application
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                        
                        {!application && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm">Apply</Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Apply to Promote: {offer.name}</DialogTitle>
                                <DialogDescription>
                                  Tell the advertiser how you plan to promote their offer
                                </DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                  <Label htmlFor="traffic-source">Traffic Source</Label>
                                  <Input
                                    id="traffic-source"
                                    placeholder="e.g., Email, Social Media, Blog"
                                    value={trafficSource}
                                    onChange={(e) => setTrafficSource(e.target.value)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="notes">Additional Notes (Optional)</Label>
                                  <Input
                                    id="notes"
                                    placeholder="Tell the advertiser more about your promotion plan"
                                    value={applicationNotes}
                                    onChange={(e) => setApplicationNotes(e.target.value)}
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button 
                                  onClick={() => {
                                    setSelectedOffer(offer);
                                    handleApply();
                                  }}
                                  disabled={!trafficSource || applyToOffer.isPending}
                                >
                                  {applyToOffer.isPending ? 'Submitting...' : 'Submit Application'}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Fixed the style tag here - removing the jsx property */}
      <style>
        {`
        @media (max-width: 768px) {
          .hide-on-mobile {
            display: none;
          }
        }
        `}
      </style>
    </div>
  );
}
