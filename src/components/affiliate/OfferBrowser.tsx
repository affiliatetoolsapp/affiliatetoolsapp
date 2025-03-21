import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Offer, GeoCommission } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { toast } from '@/hooks/use-toast';
import {
  Search,
  DollarSign,
  Globe,
  AlertTriangle,
  Tag,
  Target,
  Award,
  Grid,
  Table as TableIcon
} from 'lucide-react';
import { formatGeoTargets } from '../affiliate/utils/offerUtils';
import OfferTable from '@/components/offers/OfferTable';
import { OffersFilter, FilterOptions } from '@/components/offers/OffersFilter';
import { useOfferFilters } from '@/hooks/useOfferFilters';

export default function OfferBrowser() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [offers, setOffers] = useState<Offer[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [filters, setFilters] = useState<FilterOptions>({
    niche: [],
    payoutMin: null,
    payoutMax: null,
    offerTypes: [],
    geos: [],
    trafficTypes: [],
    status: []
  });

  // Get all offers
  const { data: allOffers, isLoading: offersLoading } = useQuery({
    queryKey: ['all-offers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('offers')
        .select('*');

      if (error) throw error;
      
      // Transform data to match Offer type
      const transformedData = data.map(offer => {
        const geoCommissions = Array.isArray(offer.geo_commissions)
          ? offer.geo_commissions.map(gc => {
              const geoCommission = gc as { country: string; commission_amount: number; commission_percent: number };
              return {
                country: geoCommission.country || '',
                commission_amount: Number(geoCommission.commission_amount || 0),
                commission_percent: Number(geoCommission.commission_percent || 0)
              };
            })
          : [];

        return {
          ...offer,
          commission_amount: Number(offer.commission_amount || 0),
          commission_percent: Number(offer.commission_percent || 0),
          geo_commissions: geoCommissions
        } as unknown as Offer;
      });
      
      return transformedData;
    },
  });

  useEffect(() => {
    if (allOffers) {
      setOffers(allOffers as Offer[]);
    }
  }, [allOffers]);

  // Apply both search and filters to offers
  const filteredOffers = useOfferFilters(
    offers?.filter(offer =>
      offer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offer.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offer.niche?.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [],
    filters
  );

  // Get commission range if there are geo-specific commissions
  const getCommissionRange = (offer: Offer) => {
    if (!offer.geo_commissions || !Array.isArray(offer.geo_commissions) || offer.geo_commissions.length <= 1) {
      return null;
    }

    // Extract commission values based on commission type
    const amounts = offer.geo_commissions.map(gc => {
      const geoCommission = gc as unknown as { commission_amount: number; commission_percent: number };
      if (offer.commission_type === 'RevShare') {
        return geoCommission.commission_percent || 0;
      }
      return geoCommission.commission_amount || 0;
    }).filter(amount => !isNaN(amount));
    
    if (amounts.length === 0) return null;
    
    const min = Math.min(...amounts);
    const max = Math.max(...amounts);
    
    return { min, max };
  };

  // Get full commission type name
  const getFullCommissionType = (shortType: string): string => {
    if (!shortType || !shortType.startsWith('CP')) return shortType;
    
    // Extract the last character of the commission type (e.g., 'A' from 'CPA')
    const typeCode = shortType.slice(2);
    
    switch (typeCode) {
      case 'A': return 'CPA'; // Cost Per Action
      case 'L': return 'CPL'; // Cost Per Lead
      case 'S': return 'CPS'; // Cost Per Sale
      case 'I': return 'CPI'; // Cost Per Install
      case 'C': return 'CPC'; // Cost Per Click
      case 'M': return 'CPM'; // Cost Per Mille (Thousand)
      case 'O': return 'CPO'; // Cost Per Order
      case 'R': return 'CPR'; // Cost Per Registration
      default: return shortType;
    }
  };

  // View offer details - Updated to navigate to offer page
  const handleViewOfferDetails = (offerId: string) => {
    console.log("View offer details:", offerId);
    navigate(`/offers/${offerId}`);
  };

  // Apply to offer - Implemented with proper functionality
  const handleApplyToOffer = async (offerId: string) => {
    try {
      console.log("Applying to offer:", offerId);
      
      // Check if the user has already applied
      const { data: existingApplication, error: checkError } = await supabase
        .from('affiliate_offers')
        .select('*')
        .eq('offer_id', offerId)
        .eq('affiliate_id', user?.id)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }
      
      if (existingApplication) {
        toast({
          title: "Already applied",
          description: `You've already applied to this offer with status: ${existingApplication.status}`,
          variant: "default"
        });
        return;
      }
      
      // Submit application
      const { data, error } = await supabase
        .from('affiliate_offers')
        .insert({
          offer_id: offerId,
          affiliate_id: user?.id,
          status: 'pending',
          applied_at: new Date().toISOString(),
        });
      
      if (error) throw error;
      
      toast({
        title: "Application submitted",
        description: "Your application has been submitted and is pending review.",
        variant: "default"
      });
      
    } catch (error) {
      console.error("Error applying to offer:", error);
      toast({
        title: "Application failed",
        description: "There was an error submitting your application. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handle card click for offer details
  const handleOfferCardClick = (offerId: string) => {
    navigate(`/offers/${offerId}`);
  };

  // Card view for offers
  const renderOfferCard = (offer: Offer) => {
    const commissionRange = getCommissionRange(offer);
    const geoTargets = formatGeoTargets(offer);

    return (
      <Card key={offer.id} className="overflow-hidden">
        <CardHeader className="p-4">
          <div className="flex justify-between items-start">
            <CardTitle 
              className="text-lg flex items-center gap-2 cursor-pointer hover:text-primary"
              onClick={() => handleOfferCardClick(offer.id)}
            >
              {offer.is_featured && (
                <Badge className="mr-1">
                  <Award className="h-3 w-3 mr-1" />
                  Featured
                </Badge>
              )}
              {offer.name}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                <DollarSign className="h-3 w-3 mr-1" />
                {commissionRange
                  ? `${commissionRange.min}-${commissionRange.max} ${getFullCommissionType(offer.commission_type)}`
                  : `${offer.commission_amount} ${getFullCommissionType(offer.commission_type)}`}
              </Badge>
            </div>
          </div>
          <CardDescription className="line-clamp-2">{offer.description}</CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0 grid gap-2">
          {offer.offer_image && (
            <div 
              className="mb-3 rounded-md overflow-hidden h-32 bg-gray-100 cursor-pointer"
              onClick={() => handleOfferCardClick(offer.id)}
            >
              <img
                src={offer.offer_image}
                alt={offer.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
            {offer.niche && (
              <div className="text-sm flex items-center">
                <Tag className="h-4 w-4 mr-1 text-blue-500" />
                <span className="font-medium mr-1">Niche:</span>
                <Badge variant="outline" className="text-xs ml-1">
                  {offer.niche}
                </Badge>
              </div>
            )}

            {/* Geo targets display */}
            <div className="text-sm flex items-center">
              <Globe className="h-4 w-4 mr-1 text-indigo-500" />
              <span className="font-medium mr-1">Geo:</span>
              {geoTargets.length > 0 ? (
                <HoverCard openDelay={0} closeDelay={0}>
                  <HoverCardTrigger asChild>
                    <Badge variant="outline" className="text-xs cursor-pointer ml-1">
                      {geoTargets.length} {geoTargets.length === 1 ? 'country' : 'countries'}
                    </Badge>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-auto p-3 shadow-lg border border-gray-200 bg-white dark:bg-gray-800 z-[9999]">
                    <div className="font-medium mb-2">Targeted GEO's:</div>
                    <div className="flex flex-wrap gap-1 max-w-[300px]">
                      {geoTargets.map((geo, i) => (
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

            {/* Traffic Sources */}
            {offer.allowed_traffic_sources && Array.isArray(offer.allowed_traffic_sources) && offer.allowed_traffic_sources.length > 0 && (
              <div className="text-sm flex items-center">
                <Target className="h-4 w-4 mr-1 text-purple-500" />
                <span className="font-medium mr-1">Traffic:</span>
                <HoverCard openDelay={0} closeDelay={0}>
                  <HoverCardTrigger asChild>
                    <Badge variant="outline" className="text-xs cursor-pointer ml-1">
                      {offer.allowed_traffic_sources.length} {offer.allowed_traffic_sources.length === 1 ? 'source' : 'sources'}
                    </Badge>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-auto p-3 shadow-lg border border-gray-200 bg-white dark:bg-gray-800 z-[9999]">
                    <div className="font-medium mb-2">Traffic Sources:</div>
                    <div className="flex flex-wrap gap-1 max-w-[300px]">
                      {offer.allowed_traffic_sources.map((source, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {source}
                        </Badge>
                      ))}
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </div>
            )}

            {/* Restricted geos display */}
            {offer.restricted_geos && Array.isArray(offer.restricted_geos) && offer.restricted_geos.length > 0 && (
              <div className="text-sm flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1 text-amber-500" />
                <span className="font-medium mr-1">Restricted:</span>
                <HoverCard openDelay={0} closeDelay={0}>
                  <HoverCardTrigger asChild>
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 text-xs cursor-pointer ml-1">
                      {offer.restricted_geos.length} {offer.restricted_geos.length === 1 ? 'country' : 'countries'}
                    </Badge>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-auto p-3 shadow-lg border border-gray-200 bg-white dark:bg-gray-800 z-[9999]">
                    <div className="font-medium mb-2">Restricted GEO's:</div>
                    <div className="flex flex-wrap gap-1 max-w-[300px]">
                      {offer.restricted_geos.map((geo, i) => (
                        <Badge key={i} variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 text-xs">
                          {geo}
                        </Badge>
                      ))}
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </div>
            )}
          </div>

          <div className="mt-2 flex justify-end">
            <Button 
              variant="outline" 
              size="sm" 
              className="mr-2"
              onClick={() => handleViewOfferDetails(offer.id)}
            >
              View Details
            </Button>
            <Button 
              size="sm" 
              onClick={() => handleApplyToOffer(offer.id)}
            >
              Apply
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Browse Offers
        </h1>
        <p className="text-muted-foreground">
          Explore available affiliate offers
        </p>
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

      {offersLoading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredOffers?.length ? (
        <>
          {viewMode === 'grid' && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredOffers.map((offer) => renderOfferCard(offer))}
            </div>
          )}
          
          {viewMode === 'table' && (
            <OfferTable 
              offers={filteredOffers} 
              userRole="affiliate"
              onViewDetails={handleViewOfferDetails}
              onApply={handleApplyToOffer}
              onRowClick={handleViewOfferDetails}
            />
          )}
        </>
      ) : (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No offers found</p>
        </Card>
      )}
    </div>
  );
}

