
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Offer, AffiliateOffer } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Search, Filter, PlusCircle, MoreVertical, Edit, Trash2, Users } from 'lucide-react';

export default function OfferManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Get advertiser's offers
  const { data: offers, isLoading: offersLoading } = useQuery({
    queryKey: ['advertiser-offers', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .eq('advertiser_id', user.id);
      
      if (error) throw error;
      return data as Offer[];
    },
    enabled: !!user && user.role === 'advertiser',
  });
  
  // Get affiliate applications for advertiser's offers
  const { data: applications, isLoading: applicationsLoading } = useQuery({
    queryKey: ['affiliate-applications', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('affiliate_offers')
        .select(`
          *,
          offer:offers(*),
          affiliate:users!affiliate_id(*)
        `)
        .eq('status', 'pending')
        .in('offer_id', offers?.map(o => o.id) || []);
      
      if (error) throw error;
      return data;
    },
    enabled: !!offers && offers.length > 0,
  });
  
  // Filter offers based on search query
  const filteredOffers = offers?.filter(offer => 
    offer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (offer.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
    (offer.niche?.toLowerCase().includes(searchQuery.toLowerCase()) || false)
  );
  
  // Handle application approval/rejection
  const handleApplicationAction = async (applicationId: string, action: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('affiliate_offers')
        .update({
          status: action,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', applicationId);
      
      if (error) throw error;
      
      toast({
        title: action === 'approved' ? 'Affiliate Approved' : 'Affiliate Rejected',
        description: action === 'approved' 
          ? 'Affiliate has been approved and can now promote your offer'
          : 'Affiliate application has been rejected'
      });
      
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update application status',
      });
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            My Offers
          </h1>
          <p className="text-muted-foreground">
            Manage your offers and affiliate applications
          </p>
        </div>
        
        <Button onClick={() => navigate('/offers/create')}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Offer
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
      </div>
      
      <Tabs defaultValue="offers">
        <TabsList>
          <TabsTrigger value="offers">My Offers</TabsTrigger>
          <TabsTrigger value="applications">Pending Applications</TabsTrigger>
        </TabsList>
        
        <TabsContent value="offers">
          {offersLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredOffers?.length ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredOffers.map((offer) => (
                <Card key={offer.id} className="overflow-hidden">
                  <CardHeader className="p-4">
                    <div className="flex justify-between">
                      <CardTitle className="text-lg">
                        <a href={`/offers/${offer.id}`} className="hover:underline">
                          {offer.name}
                        </a>
                      </CardTitle>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/offers/${offer.id}/edit`)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Offer
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Offer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
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
                      <Badge variant={offer.status === 'active' ? 'default' : 'secondary'}>
                        {offer.status}
                      </Badge>
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
              <Button onClick={() => navigate('/offers/create')}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Your First Offer
              </Button>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="applications">
          {applicationsLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : applications?.length ? (
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-3 text-left font-medium">Affiliate</th>
                      <th className="p-3 text-left font-medium">Offer</th>
                      <th className="p-3 text-left font-medium">Traffic Source</th>
                      <th className="p-3 text-left font-medium">Applied On</th>
                      <th className="p-3 text-left font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app: any) => (
                      <tr key={app.id} className="border-b hover:bg-muted/50">
                        <td className="p-3">
                          {app.affiliate.contact_name || app.affiliate.email}
                        </td>
                        <td className="p-3">{app.offer.name}</td>
                        <td className="p-3">{app.traffic_source || 'Not specified'}</td>
                        <td className="p-3">
                          {new Date(app.applied_at).toLocaleDateString()}
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleApplicationAction(app.id, 'approved')}
                            >
                              Approve
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-destructive"
                              onClick={() => handleApplicationAction(app.id, 'rejected')}
                            >
                              Reject
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No pending applications</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
