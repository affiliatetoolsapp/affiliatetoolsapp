import { useState, useEffect, useRef } from 'react';
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

type SortField = 'created_at' | 'name' | 'status';
type SortOrder = 'asc' | 'desc';
type FilterOption = 'all' | 'active' | 'inactive' | 'paused';
type ViewMode = 'grid' | 'table';

export default function OfferManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filterOption, setFilterOption] = useState<FilterOption>('all');
  const filterMenuRef = useRef<HTMLButtonElement>(null);
  const [offerToDelete, setOfferToDelete] = useState<string | null>(null);
  
  const isAdvertiser = user?.role === 'advertiser';
  
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
      
      console.log("Fetched offers:", data?.length);
      return data as Offer[];
    },
    enabled: !!user,
  });
  
  // Get pending applications count - now used more consistently across components
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
      await queryClient.invalidateQueries(['offers', user?.id, user?.role]);
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
      const { error } = await supabase
        .from('offers')
        .delete()
        .eq('id', offerToDelete);
      
      if (error) throw error;
      
      // Invalidate and refetch offers to update the UI
      await queryClient.invalidateQueries(['offers', user?.id, user?.role]);
      await refetch();
      
      toast({
        title: "Offer deleted",
        description: "The offer has been successfully deleted.",
        variant: "default"
      });
    } catch (error) {
      console.error("Error deleting offer:", error);
      toast({
        title: "Failed to delete offer",
        description: "There was an error deleting the offer. Please try again.",
        variant: "destructive"
      });
    } finally {
      setOfferToDelete(null); // Clear the offer to delete
    }
  };
  
  // Filter offers based on search query and filter option
  const filteredOffers = offers?.filter(offer => 
    offer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    offer.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    offer.niche?.toLowerCase().includes(searchQuery.toLowerCase())
  ).filter(offer => {
    if (filterOption === 'all') return true;
    return offer.status?.toLowerCase() === filterOption;
  });
  
  // Sort offers based on sort field and sort order
  const sortedOffers = filteredOffers?.sort((a, b) => {
    let comparison = 0;
    
    if (sortField === 'created_at') {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      comparison = dateA - dateB;
    } else if (sortField === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else if (sortField === 'status') {
      comparison = (a.status || '').localeCompare(b.status || '');
    }
    
    return sortOrder === 'asc' ? comparison : comparison * -1;
  });
  
  const filteredAndSortedOffers = sortedOffers;
  
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
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteOffer}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
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
          {/* Filter dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button ref={filterMenuRef} variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">{getFilterLabel()}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuItem 
                onClick={() => setFilterOption('all')}
                className={filterOption === 'all' ? "bg-accent" : ""}
              >
                All Offers
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setFilterOption('active')}
                className={filterOption === 'active' ? "bg-accent" : ""}
              >
                Active Only
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setFilterOption('inactive')}
                className={filterOption === 'inactive' ? "bg-accent" : ""}
              >
                Inactive Only
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setFilterOption('paused')}
                className={filterOption === 'paused' ? "bg-accent" : ""}
              >
                Paused Only
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Sort dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                {getSortIcon()}
                <span className="hidden sm:inline">Sort</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuItem 
                onClick={() => {
                  setSortField('created_at');
                  setSortOrder('desc');
                }}
                className={sortField === 'created_at' && sortOrder === 'desc' ? "bg-accent" : ""}
              >
                <CalendarClock className="mr-2 h-4 w-4" />
                Newest First
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => {
                  setSortField('created_at');
                  setSortOrder('asc');
                }}
                className={sortField === 'created_at' && sortOrder === 'asc' ? "bg-accent" : ""}
              >
                <CalendarClock className="mr-2 h-4 w-4" />
                Oldest First
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => {
                  setSortField('name');
                  setSortOrder('asc');
                }}
                className={sortField === 'name' && sortOrder === 'asc' ? "bg-accent" : ""}
              >
                <ArrowDownAZ className="mr-2 h-4 w-4" />
                Name (A-Z)
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => {
                  setSortField('name');
                  setSortOrder('desc');
                }}
                className={sortField === 'name' && sortOrder === 'desc' ? "bg-accent" : ""}
              >
                <ArrowUpAZ className="mr-2 h-4 w-4" />
                Name (Z-A)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => {
                  setSortField('status');
                  setSortOrder('asc');
                }}
                className={sortField === 'status' && sortOrder === 'asc' ? "bg-accent" : ""}
              >
                <SortAsc className="mr-2 h-4 w-4" />
                Status (A-Z)
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => {
                  setSortField('status');
                  setSortOrder('desc');
                }}
                className={sortField === 'status' && sortOrder === 'desc' ? "bg-accent" : ""}
              >
                <SortDesc className="mr-2 h-4 w-4" />
                Status (Z-A)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
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
                          {offer.geo_targets && offer.geo_targets.length > 0 ? (
                            <HoverCard openDelay={0} closeDelay={0}>
                              <HoverCardTrigger asChild>
                                <Badge variant="outline" className="text-xs cursor-pointer ml-1">
                                  {offer.geo_targets.length} {offer.geo_targets.length === 1 ? 'country' : 'countries'}
                                </Badge>
                              </HoverCardTrigger>
                              <HoverCardContent className="w-auto p-3 shadow-lg border border-gray-200 bg-white dark:bg-gray-800 z-[9999]">
                                <div className="font-medium mb-2">Targeted GEO's:</div>
                                <div className="flex flex-wrap gap-1 max-w-[300px]">
                                  {offer.geo_targets.map((geo, i) => (
                                    <Badge key={i} variant="outline" className="text-xs">
                                      {countryCodes[geo]?.flag} {geo}
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
                onStatusUpdate={handleStatusUpdate}
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
