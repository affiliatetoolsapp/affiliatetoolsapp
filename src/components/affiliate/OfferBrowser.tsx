import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Offer } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import {
  Search,
  DollarSign,
  Globe,
  AlertTriangle,
  Tag,
  Target
} from 'lucide-react';
import countryCodes from '../offers/countryCodes';

export default function OfferBrowser() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [offers, setOffers] = useState<Offer[]>([]);

  // Get all offers
  const { data: allOffers, isLoading: offersLoading } = useQuery({
    queryKey: ['all-offers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('offers')
        .select('*');

      if (error) throw error;
      console.log("All offers:", data);
      return data as Offer[];
    },
  });

  useEffect(() => {
    if (allOffers) {
      setOffers(allOffers);
    }
  }, [allOffers]);

  // Filter offers based on search term
  const filteredOffers = offers?.filter(offer =>
    offer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    offer.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    offer.niche?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format geo targets for display
  const formatGeoTargets = (offer: Offer) => {
    if (!offer.geo_targets || !Array.isArray(offer.geo_targets) || offer.geo_targets.length === 0) {
      return [];
    }

    return offer.geo_targets.map(code => {
      const country = countryCodes.find(c => c.code === code);
      return {
        code,
        flag: country?.flag || '🌐',
        name: country?.name || code
      };
    });
  };

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

      {offersLoading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredOffers?.length ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredOffers.map((offer) => {
            const commissionRange = getCommissionRange(offer);
            const geoTargets = formatGeoTargets(offer);

            return (
              <Card key={offer.id} className="overflow-hidden">
                <CardHeader className="p-4">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{offer.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="flex items-center bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                        <DollarSign className="h-3 w-3 mr-1" />
                        {commissionRange
                          ? `$${commissionRange.min}-$${commissionRange.max}`
                          : `$${offer.commission_amount}`}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {offer.commission_type}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription className="line-clamp-2">{offer.description}</CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0 grid gap-2">
                  {offer.offer_image && (
                    <div className="mb-3 rounded-md overflow-hidden h-32 bg-gray-100">
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
                    <Button variant="outline" size="sm">
                      Apply
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No offers found</p>
        </Card>
      )}
    </div>
  );
}
