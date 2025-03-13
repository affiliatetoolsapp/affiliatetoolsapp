
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Offer } from '@/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, PlusCircle, Tag, Store } from 'lucide-react';

export default function MarketplaceOverview() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null);
  
  // Get all active offers for the marketplace
  const { data: offers, isLoading } = useQuery({
    queryKey: ['marketplace-offers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .eq('status', 'active');
      
      if (error) throw error;
      return data as Offer[];
    },
    enabled: !!user,
  });
  
  // Extract unique niches for filtering
  const niches = offers ? [...new Set(offers.filter(o => o.niche).map(o => o.niche!))] : [];
  
  // Apply filters to offers
  const filteredOffers = offers?.filter(offer => {
    const matchesSearch = searchQuery === '' || 
      offer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (offer.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      (offer.niche?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
    
    const matchesNiche = !selectedNiche || offer.niche === selectedNiche;
    
    return matchesSearch && matchesNiche;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Marketplace</h1>
          <p className="text-muted-foreground">
            {user?.role === 'advertiser' 
              ? 'Browse all offers or create your own to attract affiliates' 
              : 'Browse and manage all offers in the marketplace'}
          </p>
        </div>
        
        {user?.role === 'advertiser' && (
          <Button asChild>
            <a href="/offers/create">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Offer
            </a>
          </Button>
        )}
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex-1 max-w-sm relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search all offers..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={selectedNiche || ''} onValueChange={(value) => setSelectedNiche(value || null)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filter by niche" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All niches</SelectItem>
              {niches.map((niche) => (
                <SelectItem key={niche} value={niche}>{niche}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Offers</TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
          {user?.role === 'advertiser' && (
            <TabsTrigger value="yours">Your Offers</TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="all">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredOffers?.length ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredOffers.map((offer) => (
                <Card key={offer.id} className="overflow-hidden">
                  <CardHeader className="p-4">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{offer.name}</CardTitle>
                    </div>
                    <CardDescription className="line-clamp-2">{offer.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 grid gap-2">
                    <div className="text-sm">
                      <span className="font-medium">Commission: </span>
                      {offer.commission_type === 'RevShare' 
                        ? `${offer.commission_percent}% Revenue Share` 
                        : `$${offer.commission_amount} per ${offer.commission_type.slice(2)}`}
                    </div>
                    
                    {offer.niche && (
                      <div className="text-sm flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        <span>{offer.niche}</span>
                      </div>
                    )}
                    
                    <div className="mt-4">
                      <Button variant="outline" size="sm" asChild>
                        <a href={`/offers/${offer.id}`}>
                          View Details
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No matching offers found</p>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="trending">
          <Card className="p-8 text-center">
            <Store className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">Trending data will be available soon</p>
          </Card>
        </TabsContent>
        
        {user?.role === 'advertiser' && (
          <TabsContent value="yours">
            {isLoading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredOffers?.filter(o => o.advertiser_id === user.id).length ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredOffers
                  .filter(o => o.advertiser_id === user.id)
                  .map((offer) => (
                    <Card key={offer.id} className="overflow-hidden">
                      <CardHeader className="p-4">
                        <CardTitle className="text-lg">{offer.name}</CardTitle>
                        <CardDescription className="line-clamp-2">{offer.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 grid gap-2">
                        <div className="text-sm">
                          <span className="font-medium">Commission: </span>
                          {offer.commission_type === 'RevShare' 
                            ? `${offer.commission_percent}% Revenue Share` 
                            : `$${offer.commission_amount} per ${offer.commission_type.slice(2)}`}
                        </div>
                        
                        {offer.niche && (
                          <div className="text-sm">
                            <span className="font-medium">Niche: </span>
                            {offer.niche}
                          </div>
                        )}
                        
                        <div className="mt-2 flex justify-end">
                          <Button variant="outline" size="sm" asChild>
                            <a href={`/offers/${offer.id}`}>Manage</a>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
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
        )}
      </Tabs>
    </div>
  );
}
