import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { formatGeoTargets } from '@/components/affiliate/utils/offerUtils';
import { Offer } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search, Filter, DollarSign, Globe, AlertTriangle, Tag, Target } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import AffiliateApprovals from './AffiliateApprovals';

export default function OffersList() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  
  const isAdvertiser = user?.role === 'advertiser';
  
  // Get all offers query
  const { data: offers, isLoading } = useQuery({
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
  const { data: pendingApplicationsCount } = useQuery({
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
  
  // Filter offers based on search query
  const filteredOffers = offers?.filter(offer => 
    offer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    offer.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    offer.niche?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get commission range if there are geo-specific commissions
  const getCommissionRange = (offer: Offer) => {
    if (!offer.geo_commissions || !Array.isArray(offer.geo_commissions) || offer.geo_commissions.length <= 1) {
      return null;
    }

    // Fix: Safely extract amount values from each geo_commission object
    const amounts = offer.geo_commissions.map(gc => {
      // Handle different possible types of geo_commission
      if (typeof gc === 'object' && gc !== null) {
        const amount = (gc as any).amount;
        return typeof amount === 'string' ? parseFloat(amount) : typeof amount === 'number' ? amount : 0;
      }
      return 0;
    }).filter(amount => !isNaN(amount));
    
    if (amounts.length === 0) return null;
    
    const min = Math.min(...amounts);
    const max = Math.max(...amounts);
    
    return { min, max };
  };

  const handleOfferClick = (offerId: string) => {
    console.log("Navigating to offer:", offerId);
    navigate(`/offers/${offerId}`);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isAdvertiser ? 'My Offers' : 'Available Offers'}
          </h1>
          <p className="text-muted-foreground">
            {isAdvertiser 
              ? 'Manage your offers and affiliate applications' 
              : 'Browse and apply to available offers'}
          </p>
        </div>
        
        {isAdvertiser && (
          <Button asChild>
            <a href="/offers/create">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Offer
            </a>
          </Button>
        )}
      </div>
      
      <div className="flex items-center space-x-2">
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
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>
      
      {isAdvertiser ? (
        <Tabs defaultValue="active">
          <TabsList>
            <TabsTrigger value="active">Active Offers</TabsTrigger>
            <TabsTrigger value="applications">
              Affiliate Applications
              {pendingApplicationsCount ? (
                <span className="ml-2 px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                  {pendingApplicationsCount}
                </span>
              ) : null}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="active">
            {isLoading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredOffers?.length ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredOffers.map((offer) => {
                  const commissionRange = getCommissionRange(offer);
                  return (
                  <Card key={offer.id} className="overflow-hidden">
                    <CardHeader className="p-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-md">
                          <button 
                            onClick={() => handleOfferClick(offer.id)} 
                            className="hover:text-primary text-left"
                          >
                            {offer.name}
                          </button>
                        </CardTitle>
                        <Badge variant="outline" className="flex items-center bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                          <DollarSign className="h-3 w-3 mr-1" />
                          {commissionRange
                            ? `${commissionRange.min}-${commissionRange.max}`
                            : offer.commission_amount}
                          <Badge variant="outline" className="ml-1 py-0 px-1 text-xs">
                            {offer.commission_type}
                          </Badge>
                        </Badge>
                      </div>
                      <CardDescription className="line-clamp-2 text-xs">{offer.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 grid gap-1">
                      {offer.offer_image && (
                        <div 
                          className="mb-2 rounded-md overflow-hidden h-24 bg-gray-100 cursor-pointer"
                          onClick={() => handleOfferClick(offer.id)}
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
                          {formatGeoTargets(offer).length > 0 ? (
                            <HoverCard openDelay={0} closeDelay={0}>
                              <HoverCardTrigger asChild>
                                <Badge 
                                  variant="outline" 
                                  className="text-xs cursor-pointer ml-1"
                                >
                                  {formatGeoTargets(offer).length} {formatGeoTargets(offer).length === 1 ? 'country' : 'countries'}
                                </Badge>
                              </HoverCardTrigger>
                              <HoverCardContent 
                                className="w-auto p-3 shadow-lg border border-gray-200 bg-white dark:bg-gray-800 z-[9999]" 
                                sideOffset={5}
                                align="start"
                                side="right"
                              >
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
                        
                        {/* Traffic sources */}
                        {offer.allowed_traffic_sources && Array.isArray(offer.allowed_traffic_sources) && offer.allowed_traffic_sources.length > 0 && (
                          <div className="text-xs flex items-center">
                            <Target className="h-3.5 w-3.5 mr-1 text-purple-500" />
                            <span className="font-medium mr-1">Traffic:</span>
                            <HoverCard openDelay={0} closeDelay={0}>
                              <HoverCardTrigger asChild>
                                <Badge 
                                  variant="outline" 
                                  className="text-xs cursor-pointer ml-1"
                                >
                                  {offer.allowed_traffic_sources.length} {offer.allowed_traffic_sources.length === 1 ? 'source' : 'sources'}
                                </Badge>
                              </HoverCardTrigger>
                              <HoverCardContent 
                                className="w-auto p-3 shadow-lg border border-gray-200 bg-white dark:bg-gray-800 z-[9999]" 
                                sideOffset={5}
                                align="start"
                                side="right"
                              >
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
                        {offer.restricted_geos && offer.restricted_geos.length > 0 && (
                          <div className="text-xs flex items-center">
                            <AlertTriangle className="h-3.5 w-3.5 mr-1 text-amber-500" />
                            <span className="font-medium mr-1">Restricted:</span>
                            <HoverCard openDelay={0} closeDelay={0}>
                              <HoverCardTrigger asChild>
                                <Badge 
                                  variant="outline" 
                                  className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 text-xs cursor-pointer ml-1"
                                >
                                  {offer.restricted_geos.length} {offer.restricted_geos.length === 1 ? 'country' : 'countries'}
                                </Badge>
                              </HoverCardTrigger>
                              <HoverCardContent 
                                className="w-auto p-3 shadow-lg border border-gray-200 bg-white dark:bg-gray-800 z-[9999]" 
                                sideOffset={5}
                                align="start"
                                side="right"
                              >
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
                        <Button variant="outline" size="sm" onClick={() => handleOfferClick(offer.id)}>
                          Manage
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  );
                })}
              </div>
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
      ) : (
        <div>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredOffers?.length ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredOffers.map((offer) => {
                const commissionRange = getCommissionRange(offer);
                return (
                <Card key={offer.id} className="overflow-hidden">
                  <CardHeader className="p-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-md">
                        <button 
                          onClick={() => handleOfferClick(offer.id)} 
                          className="hover:text-primary text-left"
                        >
                          {offer.name}
                        </button>
                      </CardTitle>
                      <Badge variant="outline" className="flex items-center bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                        <DollarSign className="h-3 w-3 mr-1" />
                        {commissionRange
                          ? `${commissionRange.min}-${commissionRange.max}`
                          : offer.commission_amount}
                        <Badge variant="outline" className="ml-1 py-0 px-1 text-xs">
                          {offer.commission_type}
                        </Badge>
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2 text-xs">{offer.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 grid gap-1">
                    {offer.offer_image && (
                      <div 
                        className="mb-2 rounded-md overflow-hidden h-24 bg-gray-100 cursor-pointer"
                        onClick={() => handleOfferClick(offer.id)}
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
                        {formatGeoTargets(offer).length > 0 ? (
                          <HoverCard openDelay={0} closeDelay={0}>
                            <HoverCardTrigger asChild>
                              <Badge 
                                variant="outline" 
                                className="text-xs cursor-pointer ml-1"
                              >
                                {formatGeoTargets(offer).length} {formatGeoTargets(offer).length === 1 ? 'country' : 'countries'}
                              </Badge>
                            </HoverCardTrigger>
                            <HoverCardContent 
                              className="w-auto p-3 shadow-lg border border-gray-200 bg-white dark:bg-gray-800 z-[9999]" 
                              sideOffset={5}
                              align="start"
                              side="right"
                            >
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
                  </CardContent>
                </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No matching offers found</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

