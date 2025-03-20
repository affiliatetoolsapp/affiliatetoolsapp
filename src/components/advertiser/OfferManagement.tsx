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
  List, 
  SortAsc, 
  SortDesc,
  ArrowDownAZ,
  ArrowUpAZ,
  CalendarClock,
  Pencil
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AffiliateApprovals from '@/components/offers/AffiliateApprovals';

type SortField = 'created_at' | 'name' | 'status';
type SortOrder = 'asc' | 'desc';
type FilterOption = 'all' | 'active' | 'inactive' | 'paused';

export default function OfferManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filterOption, setFilterOption] = useState<FilterOption>('all');
  const filterMenuRef = useRef<HTMLButtonElement>(null);
  
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
  
  // Get pending applications directly with a proper query that filters by this advertiser
  const { data: pendingApplicationsCount = 0, isLoading: applicationsLoading, refetch: refetchApplications } = useQuery({
    queryKey: ['pending-applications-count', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      
      try {
        console.log('[OfferManagement] Fetching pending applications count for advertiser:', user.id);
        
        // Get pending applications count directly with a database filter
        const { data, count, error } = await supabase
          .from('affiliate_offers')
          .select('id, offers!inner(advertiser_id)', { count: 'exact' })
          .eq('status', 'pending')
          .eq('offers.advertiser_id', user.id);
        
        if (error) {
          console.error("[OfferManagement] Error fetching applications count:", error);
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
  
  // Filter offers based on search term, sort options, and filter options
  const filteredAndSortedOffers = offers?.filter(offer => {
    // First apply text search filter
    const matchesSearch = 
      offer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offer.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offer.niche?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Then apply status filter
    const matchesFilter = 
      filterOption === 'all' ||
      (filterOption === 'active' && offer.status === 'active') ||
      (filterOption === 'inactive' && offer.status === 'inactive') ||
      (filterOption === 'paused' && offer.status === 'paused');
    
    return matchesSearch && matchesFilter;
  })
  .sort((a, b) => {
    // Sort based on selected field and order
    if (sortField === 'created_at') {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
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
  
  // Mutation to update offer status
  const updateOfferStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: 'active' | 'inactive' }) => {
      console.log(`Updating offer ${id} to status: ${status}`);
      
      const { data, error } = await supabase
        .from('offers')
        .update({ status })
        .eq('id', id)
        .select();
      
      if (error) {
        console.error('Error updating offer status:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      // Invalidate queries to refetch offers
      queryClient.invalidateQueries({ queryKey: ['advertiser-offers', user?.id] });
      toast({
        title: 'Offer Status Updated',
        description: 'The offer status has been updated successfully',
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
  
  const handleStatusUpdate = (offerId: string, newStatus: 'active' | 'inactive') => {
    updateOfferStatus.mutate({ id: offerId, status: newStatus });
  };
  
  const renderOffersTable = () => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Offer</TableHead>
            <TableHead>Niche</TableHead>
            <TableHead>Commission</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredAndSortedOffers?.map((offer) => (
            <TableRow key={offer.id}>
              <TableCell className="font-medium">{offer.name}</TableCell>
              <TableCell>{offer.niche || '-'}</TableCell>
              <TableCell>
                {offer.commission_type === 'RevShare' 
                  ? `${offer.commission_percent}% RevShare` 
                  : `$${offer.commission_amount} per ${offer.commission_type.slice(2)}`}
              </TableCell>
              <TableCell className="capitalize">{offer.status}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate(`/offers/${offer.id}`)}>
                      <Edit className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate(`/offers/${offer.id}/edit`)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Offer
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusUpdate(offer.id, offer.status === 'active' ? 'inactive' : 'active')}>
                    {offer.status === 'active' ? (
                      <>
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Activate
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);
  
  // Get sort icon based on current sort configuration
  const getSortIcon = () => {
    if (sortField === 'created_at') {
      return sortOrder === 'desc' ? <CalendarClock className="h-4 w-4" /> : <CalendarClock className="h-4 w-4" />;
    }
    if (sortField === 'name') {
      return sortOrder === 'asc' ? <ArrowDownAZ className="h-4 w-4" /> : <ArrowUpAZ className="h-4 w-4" />;
    }
    return sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />;
  };
  
  // Get filter label based on current filter
  const getFilterLabel = () => {
    switch (filterOption) {
      case 'active': return 'Active Only';
      case 'inactive': return 'Inactive Only';
      case 'paused': return 'Paused Only';
      default: return 'All Offers';
    }
  };
  
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
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredAndSortedOffers.map((offer) => (
                  <Card key={offer.id} className="overflow-hidden">
                    <CardHeader className="p-4">
                      <CardTitle className="text-lg">{offer.name}</CardTitle>
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
                      <div className="text-sm">
                        <span className="font-medium">Status: </span> 
                        <span className="capitalize">{offer.status}</span>
                      </div>
                      <div className="mt-2 flex justify-end">
                        <Button variant="outline" size="sm" onClick={() => navigate(`/offers/${offer.id}`)}>
                          Manage
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              renderOffersTable()
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
