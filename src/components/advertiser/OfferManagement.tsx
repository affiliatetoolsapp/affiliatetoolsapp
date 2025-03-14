import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Offer } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Search, Filter, PlusCircle, MoreVertical, Edit, Trash2, Users, Pause, Play, Grid, List, Globe, Shield, Target } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AffiliateApprovals from '@/components/offers/AffiliateApprovals';

export default function OfferManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode<'grid' | 'list'>('grid');
  
  // Get advertiser's offers
  const { data: offers, isLoading: offersLoading } = useQuery({
    queryKey: ['advertiser-offers', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .eq('advertiser_id', user.id);
      
      if (error) throw error;
      console.log("Advertiser offers:", data);
      return data as Offer[];
    },
    enabled: !!user && user.role === 'advertiser',
  });
  
  // Get pending applications count for badge display - Using the same query approach as other components
  const { data: pendingApplicationsCount, isLoading: applicationsLoading, refetch: refetchApplications } = useQuery({
    queryKey: ['pending-applications-count', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      
      try {
        console.log('[OfferManagement] Fetching pending applications count');
        
        // Direct query to count pending applications for this advertiser's offers
        const { count, error } = await supabase
          .from('affiliate_offers')
          .select(`
            id, 
            offers!inner(advertiser_id)
          `, { count: 'exact', head: true })
          .eq('status', 'pending')
          .eq('offers.advertiser_id', user.id);
        
        if (error) {
          console.error("[OfferManagement] Error counting applications:", error);
          throw error;
        }
        
        console.log("[OfferManagement] Pending applications count:", count);
        return count || 0;
      } catch (err) {
        console.error("[OfferManagement] Error in applications count query:", err);
        throw err;
      }
    },
    enabled: !!user && user.role === 'advertiser',
    refetchInterval: 30000, // Check every 30 seconds
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
  
  // Refresh applications when the applications tab is selected
  const [activeTab, setActiveTab] = useState('offers');
  
  useEffect(() => {
    if (activeTab === 'applications') {
      refetchApplications();
    }
  }, [activeTab, refetchApplications]);
  
  // Filter offers based on search query
  const filteredOffers = offers?.filter(offer => 
    offer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (offer.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
    (offer.niche?.toLowerCase().includes(searchQuery.toLowerCase()) || false)
  );
  
  // Mutation to update offer status
  const updateOfferStatus = useMutation({
    mutationFn: async ({ offerId, status }: { offerId: string, status: string }) => {
      const { error } = await supabase
        .from('offers')
        .update({ status })
        .eq('id', offerId);
      
      if (error) throw error;
      return { offerId, status };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['advertiser-offers', user?.id] });
      toast({
        title: 'Offer updated',
        description: `Offer status changed to ${data.status}`,
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update offer status',
      });
    }
  });
  
  // Handle offer status toggle
  const handleStatusUpdate = (offerId: string, newStatus: string) => {
    updateOfferStatus.mutate({ offerId, status: newStatus });
  };
  
  const handleViewOffer = (offerId: string) => {
    navigate(`/offers/${offerId}`);
  };
  
  const renderOffersTable = (offers: Offer[]) => (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Niche</TableHead>
            <TableHead>Commission</TableHead>
            <TableHead>Geo Targeting</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {offers.map((offer) => (
            <TableRow key={offer.id}>
              <TableCell className="font-medium">
                <button 
                  className="hover:underline text-left font-medium"
                  onClick={() => handleViewOffer(offer.id)}
                >
                  {offer.name}
                </button>
                {offer.is_featured && (
                  <Badge variant="outline" className="ml-2 bg-yellow-100 dark:bg-yellow-900">
                    Featured
                  </Badge>
                )}
              </TableCell>
              <TableCell>{offer.niche || '-'}</TableCell>
              <TableCell>
                {offer.commission_type === 'RevShare' 
                  ? `${offer.commission_percent}% RevShare` 
                  : `$${offer.commission_amount} per ${offer.commission_type.slice(2)}`}
              </TableCell>
              <TableCell>
                {offer.geo_targets && Array.isArray(offer.geo_targets) && offer.geo_targets.length > 0 ? (
                  <div className="flex items-center">
                    <Globe className="h-4 w-4 mr-1" />
                    {offer.geo_targets.length} {offer.geo_targets.length === 1 ? 'country' : 'countries'}
                  </div>
                ) : (
                  <span className="text-muted-foreground">No targeting</span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={offer.status === 'active' ? 'default' : 'secondary'}>
                  {offer.status}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleViewOffer(offer.id)}>
                    Manage
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewOffer(offer.id)}>
                        <Users className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate(`/offers/${offer.id}/edit`)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Offer
                      </DropdownMenuItem>
                      {offer.status === 'active' ? (
                        <DropdownMenuItem onClick={() => handleStatusUpdate(offer.id, 'paused')}>
                          <Pause className="h-4 w-4 mr-2" />
                          Pause Offer
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => handleStatusUpdate(offer.id, 'active')}>
                          <Play className="h-4 w-4 mr-2" />
                          Activate Offer
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => handleStatusUpdate(offer.id, 'stopped')}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Stop Offer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            My Offers
          </h1>
          <p className="text-muted-foreground">
            Manage your offers and affiliate applications
          </p>
        </div>
        
        <Button onClick={() => navigate('/offers/create')}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Offer
        </Button>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search" 
            placeholder="Search offers..." 
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
          
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
      
      <Tabs defaultValue="offers" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="offers">My Offers</TabsTrigger>
          <TabsTrigger value="applications" onClick={() => refetchApplications()}>
            Pending Applications
            {pendingApplicationsCount ? (
              <Badge variant="secondary" className="ml-2">{pendingApplicationsCount}</Badge>
            ) : null}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="offers">
          {offersLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredOffers?.length ? (
            viewMode === 'grid' ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredOffers.map((offer) => (
                  <Card key={offer.id} className="overflow-hidden">
                    <CardHeader className="p-4">
                      <div className="flex justify-between">
                        <CardTitle className="text-lg">
                          <button 
                            className="hover:underline text-left"
                            onClick={() => handleViewOffer(offer.id)}
                          >
                            {offer.name}
                          </button>
                        </CardTitle>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewOffer(offer.id)}>
                              <Users className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/offers/${offer.id}/edit`)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Offer
                            </DropdownMenuItem>
                            {offer.status === 'active' ? (
                              <DropdownMenuItem onClick={() => handleStatusUpdate(offer.id, 'paused')}>
                                <Pause className="h-4 w-4 mr-2" />
                                Pause Offer
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleStatusUpdate(offer.id, 'active')}>
                                <Play className="h-4 w-4 mr-2" />
                                Activate Offer
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleStatusUpdate(offer.id, 'stopped')}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Stop Offer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <CardDescription className="line-clamp-2">{offer.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 grid gap-2">
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
                      
                      {/* Display geo targeting info */}
                      {offer.geo_targets && Array.isArray(offer.geo_targets) && offer.geo_targets.length > 0 && (
                        <div className="text-sm flex items-center">
                          <Globe className="h-3.5 w-3.5 mr-1 text-blue-500" />
                          <span className="font-medium mr-1">Targeting: </span> 
                          {offer.geo_targets.length <= 3 
                            ? offer.geo_targets.join(', ') 
                            : `${offer.geo_targets.length} countries`}
                        </div>
                      )}
                      
                      {/* Display geo restrictions */}
                      {offer.restricted_geos && Array.isArray(offer.restricted_geos) && offer.restricted_geos.length > 0 && (
                        <div className="text-sm flex items-center">
                          <Shield className="h-3.5 w-3.5 mr-1 text-red-500" />
                          <span className="font-medium mr-1">Restricted: </span>
                          {offer.restricted_geos.length <= 3 
                            ? offer.restricted_geos.join(', ') 
                            : `${offer.restricted_geos.length} countries`}
                        </div>
                      )}
                      
                      {/* Display traffic sources */}
                      {offer.allowed_traffic_sources && Array.isArray(offer.allowed_traffic_sources) && offer.allowed_traffic_sources.length > 0 && (
                        <div className="text-sm flex items-center">
                          <Target className="h-3.5 w-3.5 mr-1 text-green-500" />
                          <span className="font-medium mr-1">Traffic: </span>
                          {offer.allowed_traffic_sources.length <= 2 
                            ? offer.allowed_traffic_sources.join(', ') 
                            : `${offer.allowed_traffic_sources.length} sources`}
                        </div>
                      )}
                      
                      <div className="text-sm">
                        <span className="font-medium">Status: </span>
                        <Badge variant={offer.status === 'active' ? 'default' : 'secondary'}>
                          {offer.status}
                        </Badge>
                      </div>
                      <div className="mt-2 flex justify-end">
                        <Button variant="outline" size="sm" onClick={() => handleViewOffer(offer.id)}>
                          Manage
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              renderOffersTable(filteredOffers)
            )
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground mb-4">You don't have any offers yet</p>
              <Button onClick={() => navigate('/offers/create')}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Your First Offer
              </Button>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="applications">
          <AffiliateApprovals />
        </TabsContent>
      </Tabs>
    </div>
  );
}
