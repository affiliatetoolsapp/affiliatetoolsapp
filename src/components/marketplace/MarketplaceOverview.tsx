import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { formatGeoTargets, getCountryFlag } from '@/components/affiliate/utils/offerUtils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  Award,
  TrendingUp,
  Globe,
  Target,
  Users,
  DollarSign,
  Tag,
  Grid,
  Table as TableIcon,
  Search,
  Filter
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Offer } from '@/types';
import { useNavigate } from 'react-router-dom';
import OfferTable from '@/components/offers/OfferTable';
import { OffersFilter, FilterOptions } from '@/components/offers/OffersFilter';
import { useOfferFilters } from '@/hooks/useOfferFilters';

export default function MarketplaceOverview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
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
  
  // Fetch both featured offers and advertiser's own offers
  const { data: topOffers, isLoading: featuredLoading } = useQuery({
    queryKey: ['top-offers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .eq('status', 'active')
        .order('is_featured', { ascending: false })
        .limit(6);
      
      if (error) throw error;
      
      // Transform data to match Offer type
      return (data || []).map(offer => ({
        ...offer,
        commission_amount: Number(offer.commission_amount) || 0,
        commission_percent: Number(offer.commission_percent) || 0,
        geo_commissions: Array.isArray(offer.geo_commissions) 
          ? offer.geo_commissions.map(gc => ({
              country: (gc as any).country || '',
              commission_amount: Number((gc as any).commission_amount) || 0,
              commission_percent: Number((gc as any).commission_percent) || 0
            }))
          : []
      })) as Offer[];
    },
    enabled: !!user,
  });
  
  // Fetch all of current advertiser's offers
  const { data: advertiserOffers, isLoading: advertiserOffersLoading } = useQuery({
    queryKey: ['advertiser-marketplace-offers', user?.id],
    queryFn: async () => {
      if (!user || user.role !== 'advertiser') return [];
      
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .eq('advertiser_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Transform data to match Offer type
      return (data || []).map(offer => ({
        ...offer,
        commission_amount: Number(offer.commission_amount) || 0,
        commission_percent: Number(offer.commission_percent) || 0,
        geo_commissions: Array.isArray(offer.geo_commissions) 
          ? offer.geo_commissions.map(gc => ({
              country: (gc as any).country || '',
              commission_amount: Number((gc as any).commission_amount) || 0,
              commission_percent: Number((gc as any).commission_percent) || 0
            }))
          : []
      })) as Offer[];
    },
    enabled: !!user && user.role === 'advertiser',
  });

  // Apply both search and filters to offers
  const filteredFeaturedOffers = useOfferFilters(
    topOffers?.filter(offer => 
      offer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offer.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offer.niche?.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [],
    filters
  );
  
  const filteredAdvertiserOffers = useOfferFilters(
    advertiserOffers?.filter(offer => 
      offer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offer.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offer.niche?.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [],
    filters
  );
  
  const isLoading = featuredLoading || advertiserOffersLoading;
  
  const handleViewOfferDetails = (offerId: string) => {
    navigate(`/offers/${offerId}`);
  };
  
  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
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
  
  // Get commission range if there are geo-specific commissions
  const getCommissionRange = (offer: Offer) => {
    if (!offer.geo_commissions || !Array.isArray(offer.geo_commissions) || offer.geo_commissions.length <= 1) {
      return null;
    }

    // Extract commission values based on commission type
    const amounts = offer.geo_commissions.map(gc => {
      if (offer.commission_type === 'RevShare') {
        return gc.commission_percent || 0;
      }
      return gc.commission_amount || 0;
    }).filter(amount => !isNaN(amount));
    
    if (amounts.length === 0) return null;
    
    const min = Math.min(...amounts);
    const max = Math.max(...amounts);
    
    return { min, max };
  };
  
  // Render an offer card
  const renderOfferCard = (offer: Offer) => {
    const geoData = formatGeoTargets(offer);
    const commissionRange = getCommissionRange(offer);
    
    return (
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
          </div>
          <CardDescription className="line-clamp-2 text-left">{offer.description}</CardDescription>
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
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                {commissionRange
                  ? `${commissionRange.min}-${commissionRange.max}`
                  : offer.commission_type === 'RevShare'
                    ? `${offer.commission_percent}%`
                    : `$${offer.commission_amount}`}
                {offer.commission_type !== 'RevShare' && (
                  <span className="ml-1">{getFullCommissionType(offer.commission_type)}</span>
                )}
              </Badge>
            </div>
          </div>
          
          {offer.niche && (
            <div className="flex items-center text-sm">
              <Tag className="h-4 w-4 mr-1 text-blue-500" />
              <span className="font-medium mr-1">Niche:</span>
              {offer.niche}
            </div>
          )}
          
          {/* Rest of the code remains the same */}
          {/* Display geo targeting info */}
          {geoData.length > 0 && (
            <div className="flex items-start text-sm">
              <Globe className="h-4 w-4 mr-1 text-indigo-500 mt-0.5" />
              <div>
                <span className="font-medium mr-1">Targeting:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {geoData.length <= 3 ? (
                    geoData.map((geo, i) => (
                      <Badge 
                        key={i} 
                        variant="outline" 
                        className="text-xs flex items-center gap-1 px-2 py-1 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <span className="inline-block text-base leading-none">{geo.flag}</span>
                        <span className="font-medium">{geo.code}</span>
                      </Badge>
                    ))
                  ) : (
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <Button 
                          variant="ghost" 
                          className="h-auto p-0 hover:bg-transparent"
                          onClick={(e) => {
                            // Prevent the click from propagating to parent elements
                            e.stopPropagation();
                          }}
                        >
                          <Badge 
                            variant="outline" 
                            className="text-xs ml-1 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            {geoData.length} {geoData.length === 1 ? 'country' : 'countries'}
                          </Badge>
                        </Button>
                      </HoverCardTrigger>
                      <HoverCardContent 
                        side="right" 
                        align="start" 
                        className="w-auto p-3 shadow-lg border border-gray-200 bg-white dark:bg-gray-800 z-[9999]"
                        sideOffset={10}
                      >
                        <div className="font-medium mb-2">Targeted GEO's:</div>
                        <div className="flex flex-wrap gap-2 max-w-[300px] max-h-[200px] overflow-y-auto">
                          {geoData.map((geo, i) => (
                            <Badge 
                              key={i} 
                              variant="outline" 
                              className="text-xs flex items-center gap-1 px-2 py-1 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                            >
                              <span className="inline-block text-base leading-none">{geo.flag}</span>
                              <span className="font-medium">{geo.code}</span>
                            </Badge>
                          ))}
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Updated Traffic Sources section with hover card */}
          {offer.allowed_traffic_sources && offer.allowed_traffic_sources.length > 0 && (
            <div className="flex items-center text-sm">
              <Target className="h-4 w-4 mr-1 text-purple-500" />
              <span className="font-medium mr-1">Traffic Sources:</span>
              <div className="flex flex-wrap gap-1">
                {offer.allowed_traffic_sources.map((source, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {source}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          <Separator className="my-2" />
          
          <div className="flex justify-end">
            <Button size="sm" onClick={() => handleViewOfferDetails(offer.id)}>View Details</Button>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="text-left">
        <h1 className="text-3xl font-bold tracking-tight">Marketplace Overview</h1>
        <p className="text-muted-foreground">
          Explore trending offers and find new opportunities for your business
        </p>
      </div>
      
      {user?.role === 'advertiser' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Performance Insights</CardTitle>
                <CardDescription>Understand how your offers compare</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  Analyze market trends and see how your offers are performing relative to others in your niche.
                </p>
                <Button className="mt-4 w-full sm:w-auto" variant="outline">View Insights</Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Affiliate Acquisition</CardTitle>
                <CardDescription>Find and recruit quality affiliates</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  Browse profiles of top-performing affiliates and invite them to promote your offers.
                </p>
                <Button className="mt-4 w-full sm:w-auto" variant="outline">Browse Affiliates</Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Offer Optimization</CardTitle>
                <CardDescription>Improve your offer performance</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  Get recommendations on how to make your offers more appealing to affiliates.
                </p>
                <Button className="mt-4 w-full sm:w-auto" variant="outline">Get Recommendations</Button>
              </CardContent>
            </Card>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-8 mb-4 gap-4 sm:gap-0">
            <h2 className="text-xl font-semibold">Marketplace Offers</h2>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:w-[300px]">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search offers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <OffersFilter
                  offers={[...(topOffers || []), ...(advertiserOffers || [])]}
                  onFilterChange={handleFilterChange}
                  className="hidden sm:flex"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'table' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('table')}
                >
                  <TableIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <Tabs defaultValue="featured" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="featured" className="flex-1">Featured Offers</TabsTrigger>
              <TabsTrigger value="myoffers" className="flex-1">My Offers</TabsTrigger>
            </TabsList>
            
            <TabsContent value="featured">
              {filteredFeaturedOffers?.length ? (
                viewMode === 'grid' ? (
                  // Updated grid layout to use 4 columns at large screens, matching OfferManagement
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredFeaturedOffers.map(offer => renderOfferCard(offer))}
                  </div>
                ) : (
                  <OfferTable 
                    offers={filteredFeaturedOffers} 
                    userRole={user?.role}
                    onViewDetails={handleViewOfferDetails}
                  />
                )
              ) : (
                <Card className="p-6 text-center">
                  <p className="text-muted-foreground">No featured offers available</p>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="myoffers">
              {filteredAdvertiserOffers?.length ? (
                viewMode === 'grid' ? (
                  // Updated grid layout to use 4 columns at large screens, matching OfferManagement
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredAdvertiserOffers.map(offer => renderOfferCard(offer))}
                  </div>
                ) : (
                  <OfferTable 
                    offers={filteredAdvertiserOffers} 
                    userRole={user?.role}
                    onViewDetails={handleViewOfferDetails}
                  />
                )
              ) : (
                <Card className="p-6 text-center">
                  <p className="text-muted-foreground">None of your offers are currently in the marketplace</p>
                  <Button className="mt-4" onClick={() => navigate('/offers/create')}>
                    Create an Offer
                  </Button>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
