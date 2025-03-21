import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase, deleteOfferCompletely } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Offer } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { 
  Search, 
  Filter, 
  PlusCircle, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Users, 
  Pause, 
  Play, 
  Grid, 
  SortAsc, 
  SortDesc,
  ArrowDownAZ,
  ArrowUpAZ,
  CalendarClock,
  Pencil,
  DollarSign,
  Globe,
  AlertTriangle,
  Tag,
  Target,
  Table as TableIcon
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AffiliateApprovals from '@/components/offers/AffiliateApprovals';
import countryCodes from '../offers/countryCodes';
import OfferTable from '@/components/offers/OfferTable';
import { formatGeoTargets } from '@/components/affiliate/utils/offerUtils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { OffersFilter, FilterOptions } from '@/components/offers/OffersFilter';
import { useOfferFilters } from '@/hooks/useOfferFilters';

type SortField = 'created_at' | 'name' | 'status';
type SortOrder = 'asc' | 'desc';
type FilterOption = 'all' | 'active' | 'inactive' | 'paused';
type ViewMode = 'grid' | 'table';

// Define the props interface
interface OfferManagementProps {
  onDeleteSuccess?: (offerName: string) => void;
  onDeleteError?: (message: string) => void;
}

export default function OfferManagement({ onDeleteSuccess, onDeleteError }: OfferManagementProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filterOption, setFilterOption] = useState<FilterOption>('all');
  const filterMenuRef = useRef<HTMLButtonElement>(null);
  const [offerToDelete, setOfferToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    niche: [],
    payoutMin: null,
    payoutMax: null,
    offerTypes: [],
    geos: [],
    trafficTypes: [],
    status: []
  });
  
  const isAdvertiser = user?.role === 'advertiser';
  
  // Add handleSort function
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };
  
  // Get all offers query
  const { data: offers, isLoading: offersLoading, refetch } = useQuery({
    queryKey: ['offers', user?.id, user?.role],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase.from('offers').select('*');
      
      // If user is an advertiser, only show their offers
      if (isAdvertiser) {
        query = query.eq('advertiser_id', user.id);
      }
      
      const { data, error } = await query;
      if (error) {
        console.error("Error fetching offers:", error);
        throw error;
      }
      
      // Transform the data to match Offer type
      return (data || []).map(offer => ({
        ...offer,
        commission_amount: offer.commission_amount || 0,
        commission_percent: offer.commission_percent || 0,
        geo_commissions: Array.isArray(offer.geo_commissions) 
          ? offer.geo_commissions.map(gc => ({
              country: (gc as any).country || '',
              commission_amount: (gc as any).commission_amount || 0,
              commission_percent: (gc as any).commission_percent || 0
            }))
          : []
      })) as Offer[];
    },
    enabled: !!user,
  });
  
  // Get pending applications count
  const { data: pendingApplicationsCount, refetch: refetchApplications } = useQuery({
    queryKey: ['pending-applications-count', user?.id],
    queryFn: async () => {
      if (!user || !isAdvertiser) return 0;
      
      // Get all pending applications first
      const { data, error } = await supabase
        .from('affiliate_offers')
        .select(`
          id, 
          offers!inner(advertiser_id)
        `)
        .eq('status', 'pending');
      
      if (error) {
        console.error("Error fetching pending applications count:", error);
        throw error;
      }
      
      // Filter for this advertiser's offers
      const filteredApplications = data.filter(app => 
        app.offers?.advertiser_id === user.id
      );
      
      console.log("Pending applications count:", filteredApplications.length);
      return filteredApplications.length;
    },
    enabled: !!user && isAdvertiser,
    refetchInterval: 30000,
  });
  
  // Function to handle status updates
  const handleStatusUpdate = async (offerId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('offers')
        .update({ status: newStatus })
        .eq('id', offerId);
      
      if (error) throw error;
      
      // Invalidate and refetch offers to update the UI
      // Fix: Use proper React Query v5 invalidateQueries syntax
      await queryClient.invalidateQueries({ queryKey: ['offers', user?.id, user?.role] });
      await refetch();
      
      toast({
        title: "Offer status updated",
        description: `Offer status updated to ${newStatus}`,
        variant: "default"
      });
    } catch (error) {
      console.error("Error updating offer status:", error);
      toast({
        title: "Failed to update status",
        description: "There was an error updating the offer status. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Function to handle offer deletion
  const handleDeleteOffer = (offerId: string) => {
    setOfferToDelete(offerId);
  };
  
  const confirmDeleteOffer = async () => {
    if (!offerToDelete) return;
    
    try {
      setIsDeleting(true);
      console.log("Attempting to delete offer ID:", offerToDelete);
      
      // Find the offer name before deleting
      const offerToDeleteDetails = offers?.find(offer => offer.id === offerToDelete);
      
      // Use the new helper function that handles all dependencies
      const { success, error } = await deleteOfferCompletely(offerToDelete);
      
      if (!success) {
        throw error;
      }
      
      // Invalidate and refetch offers to update the UI
      await queryClient.invalidateQueries({ queryKey: ['offers', user?.id, user?.role] });
      await refetch();
      
      // Use the callback prop if provided, otherwise use the toast directly
      if (onDeleteSuccess && offerToDeleteDetails) {
        onDeleteSuccess(offerToDeleteDetails.name);
      } else {
        toast({
          title: "Offer deleted",
          description: "The offer has been successfully deleted.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error("Error deleting offer:", error);
      
      // Use the callback prop if provided, otherwise use the toast directly
      if (onDeleteError) {
        onDeleteError(error instanceof Error ? error.message : "Unknown error");
      } else {
        toast({
          title: "Failed to delete offer",
          description: "There was an error deleting the offer. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      setOfferToDelete(null);
      setIsDeleting(false);
    }
  };
  
  // Apply search, sort, and filters to offers
  const filteredAndSortedOffers = useOfferFilters(
    offers?.filter(offer =>
      offer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offer.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offer.niche?.toLowerCase().includes(searchQuery.toLowerCase())
    )?.sort((a, b) => {
      if (sortField === 'created_at') {
        return sortOrder === 'asc'
          ? new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime()
          : new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
      }
      if (sortField === 'name') {
        return sortOrder === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }
      if (sortField === 'status') {
        return sortOrder === 'asc'
          ? (a.status || '').localeCompare(b.status || '')
          : (b.status || '').localeCompare(a.status || '');
      }
      return 0;
    }) || [],
    filters
  );
  
  const getFilterLabel = () => {
    switch (filterOption) {
      case 'all': return 'All Offers';
      case 'active': return 'Active Only';
      case 'inactive': return 'Inactive Only';
      case 'paused': return 'Paused Only';
      default: return 'Filter';
    }
  };
  
  const getSortIcon = () => {
    if (sortField === 'created_at') {
      return sortOrder === 'asc' ? <CalendarClock className="mr-2 h-4 w-4" /> : <CalendarClock className="mr-2 h-4 w-4" />;
    } else if (sortField === 'name') {
      return sortOrder === 'asc' ? <ArrowDownAZ className="mr-2 h-4 w-4" /> : <ArrowUpAZ className="mr-2 h-4 w-4" />;
    } else if (sortField === 'status') {
      return sortOrder === 'asc' ? <SortAsc className="mr-2 h-4 w-4" /> : <SortDesc className="mr-2 h-4 w-4" />;
    }
    return <CalendarClock className="mr-2 h-4 w-4" />;
  };

  const setActiveTab = (tab: string) => {
    // You can add any tab-specific logic here if needed
    console.log(`[OfferManagement] Active tab changed to: ${tab}`);
  };

  return (
    <div className="space-y-6">
      {/* Delete confirmation dialog */}
      <AlertDialog open={!!offerToDelete} onOpenChange={(open) => !open && setOfferToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this offer?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the offer and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteOffer}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <span className="animate-spin mr-2">&#9696;</span>
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
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
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative flex-1 sm:w-[300px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search" 
            placeholder="Search offers..." 
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                {sortField === 'created_at' && (sortOrder === 'asc' ? <CalendarClock className="h-4 w-4" /> : <CalendarClock className="h-4 w-4" />)}
                {sortField === 'name' && (sortOrder === 'asc' ? <ArrowDownAZ className="h-4 w-4" /> : <ArrowUpAZ className="h-4 w-4" />)}
                {sortField === 'status' && (sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleSort('created_at')}>
                <CalendarClock className="mr-2 h-4 w-4" />
                Date Created
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort('name')}>
                <ArrowDownAZ className="mr-2 h-4 w-4" />
                Name
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort('status')}>
                <SortAsc className="mr-2 h-4 w-4" />
                Status
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <OffersFilter
            offers={offers || []}
            onFilterChange={setFilters}
          />
          
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
              variant={viewMode === 'table' ? 'default' : 'ghost'} 
              size="sm" 
              className="rounded-l-none" 
              onClick={() => setViewMode('table')}
            >
              <TableIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      <Tabs defaultValue="offers" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="offers">My Offers</TabsTrigger>
          <TabsTrigger value="applications" onClick={() => refetchApplications()}>
            Pending Applications
            {pendingApplicationsCount > 0 ? (
              <Badge variant="secondary" className="ml-2">{pendingApplicationsCount}</Badge>
            ) : null}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="offers">
          {offersLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredAndSortedOffers?.length ? (
            viewMode === 'grid' ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredAndSortedOffers.map((offer) => (
                  <Card key={offer.id} className="overflow-hidden">
                    <CardHeader className="p-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-md">
                          <button 
                            onClick={() => navigate(`/offers/${offer.id}`)} 
                            className="hover:underline text-left"
                          >
                            {offer.name}
                          </button>
                        </CardTitle>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => navigate(`/offers/${offer.id}/edit`)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteOffer(offer.id)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleStatusUpdate(offer.id, offer.status === 'active' ? 'paused' : 'active')}>
                              {offer.status === 'active' ? (
                                <>
                                  <Pause className="mr-2 h-4 w-4" />
                                  Pause Offer
                                </>
                              ) : (
                                <>
                                  <Play className="mr-2 h-4 w-4" />
                                  Activate Offer
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/offers/${offer.id}/approve`)}>
                              <Users className="mr-2 h-4 w-4" />
                              View Applications
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <CardDescription className="line-clamp-2 text-xs">{offer.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 grid gap-1">
                      {offer.offer_image && (
                        <div 
                          className="mb-2 rounded-md overflow-hidden h-24 bg-gray-100 cursor-pointer"
                          onClick={() => navigate(`/offers/${offer.id}`)}
                        >
                          <img 
                            src={offer.offer_image} 
                            alt={offer.name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-1">
                        {offer.niche && (
                          <div className="text-xs flex items-center">
                            <Tag className="h-3.5 w-3.5 mr-1 text-blue-500" />
                            <span className="font-medium mr-1">Niche:</span>
                            <Badge variant="outline" className="text-xs ml-1">
                              {offer.niche}
                            </Badge>
                          </div>
                        )}
                        
                        {/* Geo targets display */}
                        <div className="text-xs flex items-center">
                          <Globe className="h-3.5 w-3.5 mr-1 text-indigo-500" />
                          <span className="font-medium mr-1">Geo:</span>
                          {offer.geo_targets ? (
                            <HoverCard openDelay={0} closeDelay={0}>
                              <HoverCardTrigger asChild>
                                <Badge variant="outline" className="text-xs cursor-pointer ml-1">
                                  {formatGeoTargets(offer).length} {formatGeoTargets(offer).length === 1 ? 'country' : 'countries'}
                                </Badge>
                              </HoverCardTrigger>
                              <HoverCardContent className="w-auto p-3 shadow-lg border border-gray-200 bg-white dark:bg-gray-800 z-[9999]">
                                <div className="font-medium mb-2">Targeted GEO's:</div>
                                <div className="flex flex-wrap gap-1 max-w-[300px]">
                                  {formatGeoTargets(offer).map((geo, i) => (
                                    <Badge key={i} variant="outline" className="text-xs">
                                      {geo.flag} {geo.code}
                                    </Badge>
                                  ))}
                                </div>
                              </HoverCardContent>
                            </HoverCard>
                          ) : (
                            <span className="text-muted-foreground ml-1">Global</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-2 flex justify-end">
                        <Badge variant="secondary">{offer.status}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <OfferTable 
                offers={filteredAndSortedOffers}
                userRole="advertiser"
                onViewDetails={(offerId) => navigate(`/offers/${offerId}`)}
                onEdit={(offerId) => navigate(`/offers/${offerId}/edit`)}
                onDelete={handleDeleteOffer}
              />
            )
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground mb-4">You don't have any offers yet</p>
              <Button asChild>
                <a href="/offers/create">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Your First Offer
                </a>
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
