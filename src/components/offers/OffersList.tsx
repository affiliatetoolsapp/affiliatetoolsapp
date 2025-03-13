
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Offer } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search, Filter } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AffiliateApprovals from './AffiliateApprovals';

export default function OffersList() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  
  const isAdvertiser = user?.role === 'advertiser';
  
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
      if (error) throw error;
      return data as Offer[];
    },
    enabled: !!user,
  });
  
  const filteredOffers = offers?.filter(offer => 
    offer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    offer.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    offer.niche?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
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
            <TabsTrigger value="applications">Affiliate Applications</TabsTrigger>
          </TabsList>
          
          <TabsContent value="active">
            {isLoading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredOffers?.length ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredOffers.map((offer) => (
                  <Card key={offer.id} className="overflow-hidden">
                    <CardHeader className="p-4">
                      <CardTitle className="text-lg">
                        <a href={`/offers/${offer.id}`} className="hover:underline">
                          {offer.name}
                        </a>
                      </CardTitle>
                      <CardDescription className="line-clamp-2">{offer.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 grid gap-2">
                      <div className="text-sm">
                        <span className="font-medium">Commission: </span>
                        {offer.commission_type === 'RevShare' 
                          ? `${offer.commission_percent}% RevShare` 
                          : `$${offer.commission_amount} per ${offer.commission_type.slice(2)}`}
                      </div>
                      {offer.niche && (
                        <div className="text-sm">
                          <span className="font-medium">Niche: </span>{offer.niche}
                        </div>
                      )}
                      <div className="text-sm">
                        <span className="font-medium">Status: </span>
                        <span className="capitalize">{offer.status}</span>
                      </div>
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
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredOffers.map((offer) => (
                <Card key={offer.id} className="overflow-hidden">
                  <CardHeader className="p-4">
                    <CardTitle className="text-lg">{offer.name}</CardTitle>
                    <CardDescription className="line-clamp-2">{offer.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 grid gap-2">
                    <div className="text-sm">
                      <span className="font-medium">Commission: </span>
                      {offer.commission_type === 'RevShare' 
                        ? `${offer.commission_percent}% RevShare` 
                        : `$${offer.commission_amount} per ${offer.commission_type.slice(2)}`}
                    </div>
                    {offer.niche && (
                      <div className="text-sm">
                        <span className="font-medium">Niche: </span>{offer.niche}
                      </div>
                    )}
                    {/* Application button will be added in the Find Offers tab of the Affiliate Dashboard */}
                  </CardContent>
                </Card>
              ))}
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
