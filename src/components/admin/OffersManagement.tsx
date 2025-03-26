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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  
  // Get all offers query - admin can see all offers
  const { data: offers, isLoading: offersLoading, refetch } = useQuery({
    queryKey: ['admin-offers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('offers')
        .select('*');
      
      if (error) {
        console.error("Error fetching offers:", error);
        throw error;
      }

      console.log("Raw offers data:", data);
      
      // Transform the data to match Offer type
      return (data || []).map(offer => {
        console.log("Processing offer:", offer);
        return {
          id: offer.id,
          name: offer.name,
          status: offer.status,
          description: offer.description,
          niche: offer.niche,
          commission_type: offer.commission_type,
          commission_amount: Number(offer.commission_amount) || 0,
          commission_percent: Number(offer.commission_percent) || 0,
          geo_targets: offer.geo_targets,
          geo_commissions: Array.isArray(offer.geo_commissions) 
            ? offer.geo_commissions.map(gc => ({
                country: (gc as any).country || '',
                commission_amount: Number((gc as any).commission_amount) || 0,
                commission_percent: Number((gc as any).commission_percent) || 0
              }))
            : [],
          allowed_traffic_sources: offer.allowed_traffic_sources,
          restricted_geos: offer.restricted_geos,
          offer_image: offer.offer_image,
          created_at: offer.created_at,
          advertiser_id: offer.advertiser_id,
          is_featured: offer.is_featured,
          url: offer.url,
          marketing_materials: offer.marketing_materials,
          target_audience: offer.target_audience,
          restrictions: offer.restrictions,
          conversion_requirements: offer.conversion_requirements,
          featured_until: offer.featured_until,
          updated_at: offer.updated_at
        };
      }) as Offer[];
    },
    enabled: !!user,
  });
  
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
        title: "Error updating offer status",
        description: "There was a problem updating the offer status. Please try again.",
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
    
    setIsDeleting(true);
    try {
      await deleteOfferCompletely(offerToDelete);
      
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
        description: "There was a problem deleting the offer. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setOfferToDelete(null);
    }
  };

  const getFilterLabel = () => {
    switch (filterOption) {
      case 'active':
        return 'Active';
      case 'inactive':
        return 'Inactive';
      case 'paused':
        return 'Paused';
      default:
        return 'All';
    }
  };

  const getSortIcon = () => {
    if (sortOrder === 'asc') return <ArrowUpAZ className="h-4 w-4" />;
    return <ArrowDownAZ className="h-4 w-4" />;
  };

  const filteredOffers = offers?.filter((offer) => {
    const matchesSearch = 
      offer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offer.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offer.niche?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterOption === 'all' || offer.status === filterOption;
    return matchesSearch && matchesStatus;
  });

  const sortedOffers = [...(filteredOffers || [])].sort((a, b) => {
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

  if (offersLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Offers Management</h1>
        <div className="flex items-center gap-4">
          <Input
            placeholder="Search offers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64"
          />
          <Select value={filterOption} onValueChange={(value: typeof filterOption) => setFilterOption(value)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => navigate('/offers/create')}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Offer
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Offer Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Commission
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Niche
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Geo Targets
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created At
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedOffers?.map((offer) => (
              <tr key={offer.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{offer.name}</div>
                  <div className="text-sm text-gray-500 line-clamp-2">{offer.description}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-gray-900">
                      {offer.commission_amount}
                      <Badge variant="outline" className="ml-1">
                        {offer.commission_type}
                      </Badge>
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {offer.niche && (
                    <Badge variant="outline" className="flex items-center">
                      <Tag className="h-3.5 w-3.5 mr-1" />
                      {offer.niche}
                    </Badge>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge variant="outline" className="flex items-center">
                    <Globe className="h-3.5 w-3.5 mr-1" />
                    {offer.geo_targets?.length || 0} {offer.geo_targets?.length === 1 ? 'country' : 'countries'}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge 
                    variant={offer.status === 'active' ? 'default' : 'secondary'}
                    className={offer.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                  >
                    {offer.status}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(offer.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex space-x-2">
                    <Button
                      variant={offer.status === 'active' ? 'destructive' : 'default'}
                      size="sm"
                      onClick={() => handleStatusUpdate(offer.id, offer.status === 'active' ? 'inactive' : 'active')}
                    >
                      {offer.status === 'active' ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/offers/${offer.id}/edit`)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteOffer(offer.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AlertDialog open={!!offerToDelete} onOpenChange={() => setOfferToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Offer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this offer? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteOffer}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 