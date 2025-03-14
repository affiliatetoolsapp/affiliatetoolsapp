import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Offer } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search, Filter, List, Grid } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Link } from 'react-router-dom';

export default function OfferManagement() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const { data: offers, isLoading } = useQuery({
    queryKey: ['offers', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .eq('advertiser_id', user.id);
      
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
  
  // Get pending applications count - Simplified query consistent with other components
  const { data: pendingApplicationsCount, isLoading: applicationsLoading, refetch: refetchApplications } = useQuery({
    queryKey: ['pending-applications-count', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      
      try {
        console.log('[OfferManagement] Fetching pending applications count');
        
        // Get all affiliate offers with pending status
        const { data, error } = await supabase
          .from('affiliate_offers')
          .select(`
            id, 
            offer_id,
            offers(advertiser_id)
          `)
          .eq('status', 'pending');
        
        if (error) {
          console.error("[OfferManagement] Error fetching applications:", error);
          throw error;
        }
        
        // Filter for offers owned by this advertiser
        const advertiserApplications = data?.filter(app => 
          app.offers?.advertiser_id === user.id
        ) || [];
        
        console.log("[OfferManagement] Pending applications data:", data);
        console.log("[OfferManagement] Filtered applications count:", advertiserApplications.length);
        
        return advertiserApplications.length;
      } catch (err) {
        console.error("[OfferManagement] Error in applications count query:", err);
        throw err;
      }
    },
    enabled: !!user && user.role === 'advertiser',
    refetchInterval: 30000, // Check every 30 seconds
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Offers</h1>
          <p className="text-muted-foreground">
            Manage your offers and track affiliate applications
          </p>
        </div>
        <Button asChild>
          <Link to="/offers/create">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Offer
          </Link>
        </Button>
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
        <Button variant="outline" size="icon" onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
          {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
        </Button>
      </div>
      
      {applicationsLoading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {filteredOffers?.length ? (
            viewMode === 'grid' ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredOffers.map((offer) => (
                  <Card key={offer.id} className="overflow-hidden">
                    <CardHeader className="p-4">
                      <CardTitle className="text-lg">
                        <Link to={`/offers/${offer.id}`} className="hover:underline">
                          {offer.name}
                        </Link>
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
                          <Link to={`/offers/${offer.id}`}>Manage</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Niche</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOffers.map((offer) => (
                      <TableRow key={offer.id}>
                        <TableCell>
                          <Link to={`/offers/${offer.id}`} className="hover:underline">
                            {offer.name}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {offer.commission_type === 'RevShare' 
                            ? `${offer.commission_percent}% RevShare` 
                            : `$${offer.commission_amount} per ${offer.commission_type.slice(2)}`}
                        </TableCell>
                        <TableCell>{offer.niche}</TableCell>
                        <TableCell className="capitalize">{offer.status}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/offers/${offer.id}`}>Manage</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground mb-4">You haven't created any offers yet</p>
              <Button asChild>
                <Link to="/offers/create">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Your First Offer
                </Link>
              </Button>
            </Card>
          )}
          
          {pendingApplicationsCount > 0 && (
            <div className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Pending Affiliate Applications</CardTitle>
                  <CardDescription>
                    You have {pendingApplicationsCount} pending affiliate applications.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild>
                    <Link to="/offers/approve">
                      View Applications <Badge className="ml-2">{pendingApplicationsCount}</Badge>
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
