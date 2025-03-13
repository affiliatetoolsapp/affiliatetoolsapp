
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AffiliateOffer, Offer } from '@/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, ExternalLink, Link as LinkIcon } from 'lucide-react';

export default function AffiliateOffers() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Get approved offers for this affiliate
  const { data: approvedOffers, isLoading } = useQuery({
    queryKey: ['affiliate-approved-offers', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('affiliate_offers')
        .select('*, offer:offers(*)')
        .eq('affiliate_id', user.id)
        .eq('status', 'approved');
      
      if (error) throw error;
      return data as (AffiliateOffer & { offer: Offer })[];
    },
    enabled: !!user && user.role === 'affiliate',
  });
  
  // Filter offers based on search query
  const filteredOffers = approvedOffers?.filter(item => 
    item.offer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.offer.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.offer.niche?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Offers</h1>
        <p className="text-muted-foreground">
          Manage your approved offers and tracking links
        </p>
      </div>
      
      <div className="flex items-center space-x-2 max-w-sm">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search" 
            placeholder="Search your offers..." 
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active Offers</TabsTrigger>
          <TabsTrigger value="links">My Tracking Links</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredOffers?.length ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredOffers.map((affiliateOffer) => (
                <Card key={affiliateOffer.id} className="overflow-hidden">
                  <CardHeader className="p-4">
                    <CardTitle className="text-lg">{affiliateOffer.offer.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {affiliateOffer.offer.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 grid gap-2">
                    <div className="text-sm">
                      <span className="font-medium">Commission: </span>
                      {affiliateOffer.offer.commission_type === 'RevShare' 
                        ? `${affiliateOffer.offer.commission_percent}% Revenue Share` 
                        : `$${affiliateOffer.offer.commission_amount} per ${affiliateOffer.offer.commission_type.slice(2)}`}
                    </div>
                    
                    {affiliateOffer.offer.niche && (
                      <div className="text-sm">
                        <span className="font-medium">Niche: </span>
                        {affiliateOffer.offer.niche}
                      </div>
                    )}
                    
                    <div className="text-sm">
                      <span className="font-medium">Your Traffic Source: </span>
                      {affiliateOffer.traffic_source}
                    </div>
                    
                    <div className="mt-4 flex justify-between">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => window.open(affiliateOffer.offer.url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                      
                      <Button
                        size="sm"
                        onClick={() => {
                          window.location.href = `/links?offer=${affiliateOffer.offer_id}`;
                        }}
                      >
                        <LinkIcon className="h-4 w-4 mr-2" />
                        Generate Links
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground mb-4">You don't have any approved offers yet</p>
              <Button 
                onClick={() => {
                  window.location.href = '/marketplace';
                }}
              >
                Browse Marketplace
              </Button>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="links">
          <Card className="p-6">
            <p className="mb-4">To view and generate tracking links for specific offers, please select an offer from the Active Offers tab.</p>
            <Button
              onClick={() => {
                window.location.href = '/links';
              }}
            >
              Go to Links Page
            </Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
