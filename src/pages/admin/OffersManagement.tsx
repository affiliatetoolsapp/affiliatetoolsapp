
import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { deleteOfferCompletely } from '@/utils/offerDeletion';
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
import { transformOffersData } from '@/utils/offerTransformations';

type SortField = 'created_at' | 'name' | 'status' | 'advertiser';
type SortOrder = 'asc' | 'desc';
type FilterOption = 'all' | 'active' | 'inactive' | 'paused';
type ViewMode = 'grid' | 'table';

export function OffersManagement() {
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
  
  // Add handleSort function
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };
  
  // Get all offers query with advertiser information
  const { data: offersData, isLoading: offersLoading, refetch } = useQuery({
    queryKey: ['admin-offers'],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('offers')
        .select(`
          *,
          advertiser:advertiser_id (
            id,
            name,
            email
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching offers:", error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!user,
  });
  
  // Transform the database data to match our type definitions
  const offers = offersData ? transformOffersData(offersData) : [];
  
  // Function to handle status updates
  const handleStatusUpdate = async (offerId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('offers')
        .update({ status: newStatus })
        .eq('id', offerId);
      
      if (error) throw error;
      
      await queryClient.invalidateQueries({ queryKey: ['admin-offers'] });
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
      
      // Use the helper function that handles all dependencies
      const { success, error } = await deleteOfferCompletely(offerToDelete);
      
      if (!success) {
        throw error;
      }
      
      // Invalidate and refetch offers to update the UI
      await queryClient.invalidateQueries({ queryKey: ['admin-offers'] });
      await refetch();
      
      toast({
        title: "Offer deleted",
        description: "The offer has been successfully deleted.",
        variant: "default"
      });
    } catch (error) {
      console.error("Error deleting offer:", error);
      toast({
        title: "Error deleting offer",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setOfferToDelete(null);
    }
  };

  // Filter and sort offers
  const filteredOffers = offers?.filter(offer => {
    const matchesSearch = 
      offer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (offer.advertiser?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
    
    const matchesStatus = 
      filterOption === 'all' || 
      offer.status === filterOption;
    
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    if (sortField === 'advertiser') {
      return sortOrder === 'asc' 
        ? (a.advertiser?.name || '').localeCompare(b.advertiser?.name || '')
        : (b.advertiser?.name || '').localeCompare(a.advertiser?.name || '');
    }
    
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
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Offers Management</h1>
          <p className="text-muted-foreground">
            Manage all offers across all advertisers
          </p>
        </div>
        <Button onClick={() => navigate('/admin/offers/create')}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create New Offer
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Offers</CardTitle>
              <CardDescription>
                View and manage offers from all advertisers
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search offers..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" ref={filterMenuRef}>
                    <Filter className="mr-2 h-4 w-4" />
                    {filterOption === 'all' ? 'All Status' : filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setFilterOption('all')}>
                    All Status
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterOption('active')}>
                    Active
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterOption('paused')}>
                    Paused
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterOption('inactive')}>
                    Inactive
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="outline"
                onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
              >
                {viewMode === 'table' ? (
                  <Grid className="h-4 w-4" />
                ) : (
                  <TableIcon className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {offersLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center">
                      Name
                      {sortField === 'name' && (
                        sortOrder === 'asc' ? <ArrowUpAZ className="ml-2 h-4 w-4" /> : <ArrowDownAZ className="ml-2 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('advertiser')}
                  >
                    <div className="flex items-center">
                      Advertiser
                      {sortField === 'advertiser' && (
                        sortOrder === 'asc' ? <ArrowUpAZ className="ml-2 h-4 w-4" /> : <ArrowDownAZ className="ml-2 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Payout</TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center">
                      Status
                      {sortField === 'status' && (
                        sortOrder === 'asc' ? <ArrowUpAZ className="ml-2 h-4 w-4" /> : <ArrowDownAZ className="ml-2 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Geo Targets</TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('created_at')}
                  >
                    <div className="flex items-center">
                      Created
                      {sortField === 'created_at' && (
                        sortOrder === 'asc' ? <SortAsc className="ml-2 h-4 w-4" /> : <SortDesc className="ml-2 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOffers?.map((offer) => (
                  <TableRow key={offer.id}>
                    <TableCell className="font-medium">{offer.name}</TableCell>
                    <TableCell>{offer.advertiser?.name || 'Unknown'}</TableCell>
                    <TableCell>
                      {offer.commission_type === 'fixed' 
                        ? `$${offer.commission_amount}`
                        : `${offer.commission_percent}%`
                      }
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        offer.status === 'active' ? 'default' :
                        offer.status === 'paused' ? 'secondary' :
                        'destructive'
                      }>
                        {offer.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <HoverCard>
                        <HoverCardTrigger>
                          <Button variant="ghost" size="sm">
                            <Globe className="h-4 w-4 mr-2" />
                            {offer.geo_targets?.length || 0} countries
                          </Button>
                        </HoverCardTrigger>
                        <HoverCardContent>
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold">Geo Targets</h4>
                            <div className="text-sm text-muted-foreground">
                              {offer.geo_targets?.map(code => (
                                <div key={code} className="flex items-center gap-1">
                                  <span>{code}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    </TableCell>
                    <TableCell>
                      {offer.created_at ? new Date(offer.created_at).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/admin/offers/${offer.id}/edit`)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusUpdate(offer.id, offer.status === 'active' ? 'paused' : 'active')}>
                            {offer.status === 'active' ? (
                              <>
                                <Pause className="mr-2 h-4 w-4" />
                                Pause
                              </>
                            ) : (
                              <>
                                <Play className="mr-2 h-4 w-4" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleDeleteOffer(offer.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!offerToDelete} onOpenChange={() => setOfferToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the offer
              and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteOffer}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 

// Export for lazy loading
export default OffersManagement;
