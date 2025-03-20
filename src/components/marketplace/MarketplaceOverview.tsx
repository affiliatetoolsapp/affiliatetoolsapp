import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { formatGeoTargets } from '@/components/affiliate/utils/offerUtils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Award, TrendingUp, Globe, Target, Users, DollarSign, Tag, Grid, List, Search, Filter } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Offer } from '@/types';
import { useNavigate } from 'react-router-dom';

export default function MarketplaceOverview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  // Changed default to 'list'
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  
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
      
      // Ensure data is properly typed as Offer array
      return data as Offer[];
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
      
      return data as Offer[];
    },
    enabled: !!user && user.role === 'advertiser',
  });
  
  // Filter offers based on search query
  const filteredFeaturedOffers = topOffers?.filter(offer => 
    offer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    offer.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    offer.niche?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredAdvertiserOffers = advertiserOffers?.filter(offer => 
    offer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    offer.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    offer.niche?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const isLoading = featuredLoading || advertiserOffersLoading;
  
  const handleViewOfferDetails = (offerId: string) => {
    navigate(`/offers/${offerId}`);
  };
  
  // Render an offer card
  const renderOfferCard = (offer: Offer) => {
    const geoData = formatGeoTargets(offer);
    
    return (
      <Card key={offer.id} className="overflow-hidden hover:shadow-md transition-shadow duration-200">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg text-left">{offer.name}</CardTitle>
            {offer.is_featured && (
              <Badge className="ml-2">
                <Award className="h-3 w-3 mr-1" />
                Featured
              </Badge>
            )}
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
            {offer.commission_type === 'RevShare' 
              ? `${offer.commission_percent}% RevShare` 
              : `$${offer.commission_amount} per ${offer.commission_type.slice(2)}`}
          </div>
          
          {offer.niche && (
            <div className="flex items-center text-sm">
              <Tag className="h-4 w-4 mr-1 text-blue-500" />
              <span className="font-medium mr-1">Niche:</span>
              {offer.niche}
            </div>
          )}
          
          {/* Display geo targeting info */}
          {geoData.length > 0 && (
            <div className="flex items-start text-sm">
              <Globe className="h-4 w-4 mr-1 text-indigo-500 mt-0.5" />
              <div>
                <span className="font-medium mr-1">Targeting:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {geoData.length <= 3 ? (
                    geoData.map((geo, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {geo.flag} {geo.code}
                      </Badge>
                    ))
                  ) : (
                    <HoverCard openDelay={0} closeDelay={0}>
                      <HoverCardTrigger asChild>
                        <Badge variant="outline" className="text-xs cursor-pointer">
                          <Globe className="h-3 w-3 mr-1" />
                          {geoData.length} GEO's
                        </Badge>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-auto p-3 shadow-lg border border-gray-200 bg-white z-[9999]">
                        <div className="font-medium mb-2">Targeted GEO's:</div>
                        <div className="flex flex-wrap gap-1 max-w-[300px]">
                          {geoData.map((geo, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {geo.flag} {geo.code}
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
          
          {offer.allowed_traffic_sources && Array.isArray(offer.allowed_traffic_sources) && offer.allowed_traffic_sources.length > 0 && (
            <div className="flex items-center text-sm">
              <Target className="h-4 w-4 mr-1 text-purple-500" />
              <span className="font-medium mr-1">Traffic:</span>
              {offer.allowed_traffic_sources.length <= 2 
                ? offer.allowed_traffic_sources.join(', ') 
                : `${offer.allowed_traffic_sources.length} sources`}
            </div>
          )}
          
          {/* Additional offer details */}
          {offer.target_audience && (
            <div className="flex items-start text-sm mt-2">
              <Users className="h-4 w-4 mr-1 text-orange-500 mt-0.5" />
              <div>
                <span className="font-medium">Target Audience:</span>
                <p className="text-xs text-muted-foreground mt-0.5">{offer.target_audience}</p>
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
  
  // Render an offer in list view
  const renderOfferListItem = (offer: Offer) => {
    const geoData = formatGeoTargets(offer);
    const restrictedGeos = offer.restricted_geos || [];
    
    return (
      <div key={offer.id} className="flex border rounded-md p-4 mb-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-200">
        {offer.offer_image && (
          <div className="mr-4 w-20 h-20 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
            <img 
              src={offer.offer_image} 
              alt={offer.name} 
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium text-lg">{offer.name}</h3>
              {offer.description && <p className="text-sm text-gray-500 line-clamp-1">{offer.description}</p>}
            </div>
            <div className="flex items-center gap-2">
              {offer.is_featured && (
                <Badge>
                  <Award className="h-3 w-3 mr-1" />
                  Featured
                </Badge>
              )}
              <Badge variant="outline" className="flex items-center bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                <DollarSign className="h-3 w-3 mr-1" />
                {offer.commission_amount} 
                <Badge variant="outline" className="ml-1 py-0 px-1 text-xs">
                  {offer.commission_type.slice(2)}
                </Badge>
              </Badge>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-x-4 gap-y-2 mt-2">
            {offer.niche && (
              <div className="flex items-center text-sm">
                <Tag className="h-4 w-4 mr-1 text-blue-500" />
                <span className="font-medium mr-1">Niche:</span>
                <Badge variant="outline" className="text-xs ml-1">
                  {offer.niche}
                </Badge>
              </div>
            )}
            
            <div className="flex items-center text-sm">
              <Globe className="h-4 w-4 mr-1 text-indigo-500" />
              <span className="font-medium mr-1">Geo:</span>
              {geoData.length > 0 ? (
                <HoverCard openDelay={0} closeDelay={0}>
                  <HoverCardTrigger asChild>
                    <Badge variant="outline" className="text-xs cursor-pointer ml-1">
                      {geoData.length} {geoData.length === 1 ? 'country' : 'countries'}
                    </Badge>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-auto p-3 shadow-lg border border-gray-200 bg-white dark:bg-gray-800 z-[9999]">
                    <div className="font-medium mb-2">Targeted GEO's:</div>
                    <div className="flex flex-wrap gap-1 max-w-[300px]">
                      {geoData.map((geo, i) => (
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
            
            {offer.allowed_traffic_sources && Array.isArray(offer.allowed_traffic_sources) && offer.allowed_traffic_sources.length > 0 && (
              <div className="flex items-center text-sm">
                <Target className="h-4 w-4 mr-1 text-purple-500" />
                <span className="font-medium mr-1">Traffic:</span>
                {offer.allowed_traffic_sources.length <= 2 ? (
                  <div className="flex flex-wrap gap-1">
                    {offer.allowed_traffic_sources.map(source => (
                      <Badge key={source} variant="outline" className="text-xs">
                        {source}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <HoverCard openDelay={0} closeDelay={0}>
                    <HoverCardTrigger asChild>
                      <Badge variant="outline" className="text-xs cursor-pointer ml-1">
                        {offer.allowed_traffic_sources.length} sources
                      </Badge>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-auto p-3 shadow-lg border border-gray-200 bg-white dark:bg-gray-800 z-[9999]">
                      <div className="font-medium mb-2">Allowed Traffic Sources:</div>
                      <div className="flex flex-wrap gap-1 max-w-[300px]">
                        {offer.allowed_traffic_sources.map((source, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {source}
                          </Badge>
                        ))}
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                )}
              </div>
            )}
            
            {restrictedGeos.length > 0 && (
              <div className="flex items-center text-sm">
                <AlertTriangle className="h-4 w-4 mr-1 text-amber-500" />
                <span className="font-medium mr-1">Restricted:</span>
                <HoverCard openDelay={0} closeDelay={0}>
                  <HoverCardTrigger asChild>
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 text-xs cursor-pointer ml-1">
                      {restrictedGeos.length} {restrictedGeos.length === 1 ? 'country' : 'countries'}
                    </Badge>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-auto p-3 shadow-lg border border-gray-200 bg-white dark:bg-gray-800 z-[9999]">
                    <div className="font-medium mb-2">Restricted GEO's:</div>
                    <div className="flex flex-wrap gap-1 max-w-[300px]">
                      {restrictedGeos.map((geo, i) => (
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
        </div>
        
        <div className="ml-4 flex items-center">
          <Button size="sm" onClick={() => handleViewOfferDetails(offer.id)}>View</Button>
        </div>
      </div>
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-left">Performance Insights</CardTitle>
                <CardDescription className="text-left">Understand how your offers compare</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-left">
                  Analyze market trends and see how your offers are performing relative to others in your niche.
                </p>
                <Button className="mt-4" variant="outline">View Insights</Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-left">Affiliate Acquisition</CardTitle>
                <CardDescription className="text-left">Find and recruit quality affiliates</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-left">
                  Browse profiles of top-performing affiliates and invite them to promote your offers.
                </p>
                <Button className="mt-4" variant="outline">Browse Affiliates</Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-left">Offer Optimization</CardTitle>
                <CardDescription className="text-left">Improve your offer performance</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-left">
                  Get recommendations on how to make your offers more appealing to affiliates.
                </p>
                <Button className="mt-4" variant="outline">Get Recommendations</Button>
              </CardContent>
            </Card>
          </div>
          
          <div className="flex items-center justify-between mt-8 mb-4">
            <h2 className="text-xl font-semibold text-left">Marketplace Offers</h2>
            
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search" 
                  placeholder="Search offers..." 
                  className="pl-8 w-[240px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
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
          
          <Tabs defaultValue="featured">
            <TabsList>
              <TabsTrigger value="featured">Featured Offers</TabsTrigger>
              <TabsTrigger value="myoffers">My Offers in Marketplace</TabsTrigger>
            </TabsList>
            
            <TabsContent value="featured">
              {filteredFeaturedOffers?.length ? (
                viewMode === 'grid' ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredFeaturedOffers.map(offer => renderOfferCard(offer))}
                  </div>
                ) : (
                  <div>
                    {filteredFeaturedOffers.map(offer => renderOfferListItem(offer))}
                  </div>
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
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredAdvertiserOffers.map(offer => renderOfferCard(offer))}
                  </div>
                ) : (
                  <div>
                    {filteredAdvertiserOffers.map(offer => renderOfferListItem(offer))}
                  </div>
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
