import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase, deleteOfferCompletely } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Offer } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Search, 
  Filter, 
  PlusCircle, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Pause, 
  Play, 
  Grid, 
  SortAsc, 
  SortDesc,
  ArrowDownAZ,
  ArrowUpAZ,
  Globe,
  Table as TableIcon,
  Award,
  Target,
  Users,
  DollarSign,
  Tag
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatGeoTargets, getCountryFlag } from '@/components/affiliate/utils/offerUtils';
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
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type SortField = 'created_at' | 'name' | 'status' | 'advertiser';
type SortOrder = 'asc' | 'desc';
type FilterOption = 'all' | 'active' | 'inactive' | 'paused';
type ViewMode = 'grid' | 'table';

interface UserMetadata {
  display_name?: string;
}

interface DatabaseUser {
  id: string;
  email: string;
  metadata?: UserMetadata;
}

interface GeoCommission {
  geo: string;
  amount: string;
}

interface DatabaseOffer {
  id: string;
  name: string;
  status: string;
  description?: string;
  niche?: string;
  commission_type: string;
  commission_amount?: number;
  commission_percent?: number;
  geo_targets?: any[];
  geo_commissions?: any[];
  allowed_traffic_sources?: string[];
  restricted_geos?: string[];
  offer_image?: string;
  created_at: string;
  advertiser_id?: string;
  is_featured?: boolean;
  url?: string;
  marketing_materials?: string[];
  target_audience?: string;
  restrictions?: string;
  conversion_requirements?: string;
}

type OfferWithAdvertiser = Omit<Offer, 'advertiser'> & {
  advertiser: {
    id: string;
    email: string;
    name: string;
  };
};

export function AdminOffersPage() {
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
  const [offers, setOffers] = useState<OfferWithAdvertiser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Add debug logging for user role
  useEffect(() => {
    const checkUserRole = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      console.log('Current user:', authUser);
      console.log('User metadata:', authUser?.user_metadata);
      
      // Check if user is admin
      if (authUser?.email !== 'admin@affiliatetools.app') {
        navigate('/');
      }
    };
    checkUserRole();
  }, [user, navigate]);
  
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
  useEffect(() => {
    const fetchOffers = async () => {
      setIsLoading(true);
      try {
        const { data: offersData, error: offersError } = await supabase
          .from('offers')
          .select('*');

        if (offersError) throw offersError;

        // Type guard for offers data
        if (!Array.isArray(offersData)) {
          throw new Error('Invalid offers data format');
        }

        const offers = offersData as DatabaseOffer[];

        // Fetch advertisers for each unique advertiser_id
        const advertiserIds = [...new Set(offers.map(o => o.advertiser_id).filter(Boolean))];
        const advertisersMap = new Map<string, { id: string; email: string; name: string }>();

        for (const id of advertiserIds) {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, email, metadata')
            .eq('id', id)
            .single();

          if (!userError && userData && typeof userData === 'object' && 'id' in userData && 'email' in userData) {
            const user = userData as DatabaseUser;
            advertisersMap.set(user.id, {
              id: user.id,
              email: user.email,
              name: user.metadata?.display_name || user.email
            });
          }
        }

        // Transform offers data with type assertions
        const transformedOffers = offers.map(offer => {
          const geoCommissions = Array.isArray(offer.geo_commissions) 
            ? offer.geo_commissions.map(gc => ({
                geo: (gc as any).geo || '',
                amount: (gc as any).amount || '0'
              }))
            : [];

          const transformed = {
            ...offer,
            commission_amount: offer.commission_amount?.toString() || '0',
            commission_percent: offer.commission_percent?.toString() || '0',
            payout_amount: '0', // Default value since it's not in the database yet
            geo_targets: Array.isArray(offer.geo_targets) ? offer.geo_targets : [],
            geo_commissions: geoCommissions,
            advertiser: advertisersMap.get(offer.advertiser_id || '') || {
              id: offer.advertiser_id || '',
              email: 'Unknown',
              name: 'Unknown'
            }
          };
          return transformed as unknown as OfferWithAdvertiser;
        });

        setOffers(transformedOffers);
      } catch (error) {
        console.error('Error fetching offers:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOffers();
  }, [supabase]);
  
  // Function to handle status updates
  const handleStatusUpdate = async (offerId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('offers')
        .update({ status: newStatus })
        .eq('id', offerId);
      
      if (error) throw error;
      
      await queryClient.invalidateQueries({ queryKey: ['admin-offers'] });
      
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
      offer.advertiser.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      filterOption === 'all' || 
      offer.status === filterOption;
    
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    if (sortField === 'advertiser') {
      return sortOrder === 'asc' 
        ? (a.advertiser.name || '').localeCompare(b.advertiser.name || '')
        : (b.advertiser.name || '').localeCompare(a.advertiser.name || '');
    }
    
    if (sortField === 'created_at') {
      return sortOrder === 'asc'
        ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    
    if (sortField === 'name') {
      return sortOrder === 'asc'
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    }
    
    if (sortField === 'status') {
      return sortOrder === 'asc'
        ? a.status.localeCompare(b.status)
        : b.status.localeCompare(a.status);
    }
    
    return 0;
  });

  return (
    <div className="h-full flex flex-col p-6">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
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

      {/* Overview Cards */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Offers Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="p-4 bg-card rounded-lg border">
              <h3 className="text-sm font-medium text-muted-foreground">Total Offers</h3>
              <p className="text-2xl font-bold">{offers?.length || 0}</p>
            </div>
            <div className="p-4 bg-card rounded-lg border">
              <h3 className="text-sm font-medium text-muted-foreground">Active Offers</h3>
              <p className="text-2xl font-bold">{offers?.filter(o => o.status === 'active').length || 0}</p>
            </div>
            <div className="p-4 bg-card rounded-lg border">
              <h3 className="text-sm font-medium text-muted-foreground">Paused Offers</h3>
              <p className="text-2xl font-bold">{offers?.filter(o => o.status === 'paused').length || 0}</p>
            </div>
            <div className="p-4 bg-card rounded-lg border">
              <h3 className="text-sm font-medium text-muted-foreground">Total Advertisers</h3>
              <p className="text-2xl font-bold">{new Set(offers?.map(o => o.advertiser.id)).size || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Offers List with View Toggle */}
      <Card className="flex-1 min-h-0">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Offers</CardTitle>
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
        <CardContent className="flex-1 overflow-y-auto p-0">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : viewMode === 'table' ? (
            <div className="relative">
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
                      <TableCell>{offer.advertiser.name}</TableCell>
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
                              <p className="text-sm text-muted-foreground">
                                {offer.geo_targets?.join(', ')}
                              </p>
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      </TableCell>
                      <TableCell>
                        {new Date(offer.created_at || '').toLocaleDateString()}
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
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {filteredOffers?.map((offer) => (
                <Card key={offer.id} className="overflow-hidden hover:shadow-md transition-shadow duration-200">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg text-left flex items-center gap-2">
                        {offer.is_featured && (
                          <Badge className="mr-1">
                            <Award className="h-3 w-3 mr-1" />
                            Featured
                          </Badge>
                        )}
                        {offer.name}
                      </CardTitle>
                      <Badge variant={
                        offer.status === 'active' ? 'default' :
                        offer.status === 'paused' ? 'secondary' :
                        'destructive'
                      }>
                        {offer.status}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2 text-left">
                      {offer.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {offer.offer_image && (
                      <div className="mb-3 rounded-md overflow-hidden h-32 bg-gray-100">
                        <img 
                          src={offer.offer_image} 
                          alt={offer.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    <div className="flex items-center text-sm">
                      <DollarSign className="h-4 w-4 mr-1 text-green-500" />
                      <span className="font-medium mr-1">Commission:</span>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                        {offer.commission_type === 'fixed' 
                          ? `$${offer.commission_amount}`
                          : `${offer.commission_percent}%`
                        }
                      </Badge>
                    </div>
                    
                    {offer.niche && (
                      <div className="flex items-center text-sm">
                        <Tag className="h-4 w-4 mr-1 text-blue-500" />
                        <span className="font-medium mr-1">Niche:</span>
                        {offer.niche}
                      </div>
                    )}
                    
                    <div className="flex items-center text-sm">
                      <Globe className="h-4 w-4 mr-1 text-indigo-500" />
                      <span className="font-medium mr-1">Targeting:</span>
                      <span>{offer.geo_targets?.length || 0} countries</span>
                    </div>

                    <div className="flex items-center text-sm">
                      <Users className="h-4 w-4 mr-1 text-purple-500" />
                      <span className="font-medium mr-1">Advertiser:</span>
                      {offer.advertiser.name}
                    </div>

                    <Separator className="my-2" />

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => navigate(`/admin/offers/${offer.id}/edit`)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleStatusUpdate(offer.id, offer.status === 'active' ? 'paused' : 'active')}>
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
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteOffer(offer.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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