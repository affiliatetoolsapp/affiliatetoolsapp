
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { formatGeoTargets } from '@/components/affiliate/utils/offerUtils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Award, TrendingUp, Globe, Target, Users, DollarSign, Tag } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Offer } from '@/types';

export default function MarketplaceOverview() {
  const { user } = useAuth();
  
  // Fetch top performing offers (for advertisers to see successful campaigns in the marketplace)
  const { data: topOffers, isLoading } = useQuery({
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
    enabled: !!user && user.role === 'advertiser',
  });
  
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
          
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4 text-left">Featured Offers in the Marketplace</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {topOffers?.map((offer) => {
                const geoData = formatGeoTargets(offer);
                
                return (
                  <Card key={offer.id} className="overflow-hidden">
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
                      
                      {/* Display geo targeting info - Updated terminology from countries to GEO's */}
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
                              <HoverCard>
                                <HoverCardTrigger asChild>
                                  <Badge variant="outline" className="text-xs cursor-pointer">
                                    <Globe className="h-3 w-3 mr-1" />
                                    {geoData.length} GEO's
                                  </Badge>
                                </HoverCardTrigger>
                                <HoverCardContent className="w-auto p-2">
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
                      
                      {/* Display traffic sources */}
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
                        <Button size="sm">View Details</Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
