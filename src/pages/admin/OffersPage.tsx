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
  Tag,
  MoreHorizontal,
  Plus,
  Loader2,
  Image
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
import { formatCurrency } from '@/lib/utils';

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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Offers Management</h1>
        <Button onClick={() => navigate('/admin/offers/create')}>
          <Plus className="mr-2 h-4 w-4" />
          Create New Offer
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Offers</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search offers..."
                  className="pl-8 w-[300px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[400px]">Offer</TableHead>
                  <TableHead>Niche</TableHead>
                  <TableHead>Payout</TableHead>
                  <TableHead>Targeting</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filteredOffers?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                      No offers found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOffers?.map((offer) => (
                    <TableRow key={offer.id} className="group">
                      <TableCell>
                        <div className="flex items-start gap-3">
                          {offer.offer_image ? (
                            <img 
                              src={offer.offer_image} 
                              alt={offer.name}
                              className="w-16 h-16 object-cover rounded-md"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center">
                              <Image className="w-8 h-8 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="font-medium">{offer.name}</span>
                            <span className="text-sm text-muted-foreground line-clamp-2">
                              {offer.description}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Tag className="h-4 w-4 text-[#3B82F6]" />
                          <span className="text-sm">{offer.niche}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-1">
                            <span className="text-[#10B981] text-sm font-medium">
                              ${Number(offer.commission_amount).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-sm text-muted-foreground">
                              CPA
                            </span>
                          </div>
                          <Badge variant="outline" className="w-fit text-xs bg-[#EFF6FF] text-[#3B82F6] border-[#93C5FD]">
                            Bi-weekly
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1.5">
                          <HoverCard>
                            <HoverCardTrigger asChild>
                              <div className="flex items-center gap-1.5 cursor-pointer">
                                <Globe className="h-4 w-4 text-[#3B82F6]" />
                                <span className="text-sm">{offer.geo_targets?.length || 0} country</span>
                              </div>
                            </HoverCardTrigger>
                            <HoverCardContent align="start" className="w-[280px] p-3">
                              <div className="flex flex-col gap-2">
                                <h4 className="font-medium">Allowed Countries</h4>
                                <div className="flex flex-wrap gap-1">
                                  {offer.geo_targets?.map((geo: string) => (
                                    <div key={geo} className="flex items-center gap-1 bg-muted rounded-md px-2 py-1">
                                      <span className="text-xs">{getCountryFlag(geo)}</span>
                                      <span className="text-xs">{geo}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </HoverCardContent>
                          </HoverCard>

                          <HoverCard>
                            <HoverCardTrigger asChild>
                              <div className="flex items-center gap-1.5 cursor-pointer">
                                <Target className="h-4 w-4 text-[#8B5CF6]" />
                                <span className="text-sm">{offer.allowed_traffic_sources?.length || 0} source</span>
                              </div>
                            </HoverCardTrigger>
                            <HoverCardContent align="start" className="w-[280px] p-3">
                              <div className="flex flex-col gap-2">
                                <h4 className="font-medium">Allowed Traffic Sources</h4>
                                <div className="flex flex-wrap gap-1">
                                  {offer.allowed_traffic_sources?.map((source: string) => (
                                    <Badge key={source} variant="secondary" className="text-xs">
                                      {source}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </HoverCardContent>
                          </HoverCard>

                          {offer.restricted_geos?.length > 0 && (
                            <HoverCard>
                              <HoverCardTrigger asChild>
                                <div className="flex items-center gap-1.5 cursor-pointer">
                                  <Badge variant="destructive" className="w-fit text-xs bg-[#FEE2E2] text-[#EF4444] border-none">
                                    {offer.restricted_geos.length} restricted
                                  </Badge>
                                </div>
                              </HoverCardTrigger>
                              <HoverCardContent align="start" className="w-[280px] p-3">
                                <div className="flex flex-col gap-2">
                                  <h4 className="font-medium">Restricted Countries</h4>
                                  <div className="flex flex-wrap gap-1">
                                    {offer.restricted_geos?.map((geo: string) => (
                                      <div key={geo} className="flex items-center gap-1 bg-muted rounded-md px-2 py-1">
                                        <span className="text-xs">{getCountryFlag(geo)}</span>
                                        <span className="text-xs">{geo}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </HoverCardContent>
                            </HoverCard>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={offer.status === 'active' ? 'default' : 'secondary'}
                          className={
                            offer.status === 'active' 
                              ? 'text-[#10B981] bg-transparent hover:bg-transparent'
                              : 'text-[#F59E0B] bg-transparent hover:bg-transparent'
                          }
                        >
                          {offer.status === 'active' ? 'Active' : 'Paused'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 hover:bg-transparent"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[160px]">
                            <DropdownMenuItem onClick={() => navigate(`/admin/offers/${offer.id}`)}>
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/admin/offers/${offer.id}/edit`)}>
                              Edit Offer
                            </DropdownMenuItem>
                            {offer.status === 'active' ? (
                              <DropdownMenuItem 
                                className="text-[#F59E0B]"
                                onClick={() => handleStatusUpdate(offer.id, 'paused')}
                              >
                                Pause Offer
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem 
                                className="text-[#10B981]"
                                onClick={() => handleStatusUpdate(offer.id, 'active')}
                              >
                                Activate Offer
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              className="text-[#EF4444]"
                              onClick={() => handleDeleteOffer(offer.id)}
                            >
                              Delete Offer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
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