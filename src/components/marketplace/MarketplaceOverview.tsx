
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Award, TrendingUp } from 'lucide-react';

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
      return data;
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
      <div>
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
                <CardTitle className="text-lg">Performance Insights</CardTitle>
                <CardDescription>Understand how your offers compare</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  Analyze market trends and see how your offers are performing relative to others in your niche.
                </p>
                <Button className="mt-4" variant="outline">View Insights</Button>
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
                <Button className="mt-4" variant="outline">Browse Affiliates</Button>
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
                <Button className="mt-4" variant="outline">Get Recommendations</Button>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Featured Offers in the Marketplace</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {topOffers?.map((offer) => (
                <Card key={offer.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{offer.name}</CardTitle>
                      {offer.is_featured && (
                        <Badge className="ml-2">
                          <Award className="h-3 w-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="line-clamp-2">{offer.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Commission: </span>
                        {offer.commission_type === 'RevShare' 
                          ? `${offer.commission_percent}% RevShare` 
                          : `$${offer.commission_amount} per ${offer.commission_type.slice(2)}`}
                      </div>
                      {offer.niche && (
                        <div>
                          <span className="font-medium">Niche: </span>{offer.niche}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
