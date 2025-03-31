import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Search, Building2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

type User = {
  id: string;
  email: string;
  status: string;
  created_at: string;
  company_name: string | null;
  first_name: string | null;
  last_name: string | null;
  country: string | null;
  role: string;
};

type Offer = {
  id: string;
  status: string;
};

type Conversion = {
  commission: number;
  created_at: string;
};

type Click = {
  id: string;
  created_at: string;
};

type UserWithRelations = User & {
  offers: Offer[];
  conversions: Conversion[];
  clicks: Click[];
};

type Advertiser = {
  id: string;
  email: string;
  status: string;
  created_at: string;
  company_name: string | null;
  first_name: string | null;
  last_name: string | null;
  country: string | null;
  activeOffers: number;
  totalSpent: number;
  conversionRate: string;
};

export function AdminAdvertisersPage() {
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch total advertisers count
  const { data: totalAdvertisers, isLoading: loadingTotal } = useQuery({
    queryKey: ['advertisers-total'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'advertiser');
      
      if (error) throw error;
      return count || 0;
    },
  });

  // Fetch active advertisers (those with active offers)
  const { data: activeAdvertisers, isLoading: loadingActive } = useQuery({
    queryKey: ['advertisers-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('offers')
        .select('advertiser_id')
        .eq('status', 'active');
      
      if (error) throw error;
      
      // Get unique advertiser IDs with active offers
      const uniqueAdvertisers = new Set(data?.map(offer => offer.advertiser_id));
      return uniqueAdvertisers.size;
    },
  });

  // Calculate total spent from all conversions
  const { data: totalSpent, isLoading: loadingSpent } = useQuery({
    queryKey: ['advertisers-spent'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversions')
        .select('commission');
      
      if (error) throw error;
      
      return (data || []).reduce((total, conv) => total + (conv.commission || 0), 0);
    },
  });

  // Fetch advertisers list with their stats
  const { data: advertisers, isLoading: loadingAdvertisers } = useQuery<Advertiser[]>({
    queryKey: ['advertisers-list'],
    queryFn: async () => {
      console.log('Fetching advertisers...');
      // First get all advertisers
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'advertiser')
        .order('created_at', { ascending: false });
      
      if (usersError) {
        console.error('Error fetching advertisers:', usersError);
        throw usersError;
      }
      
      if (!users) return [];

      // Get all offers, conversions, and clicks in separate queries
      const { data: allOffers } = await supabase
        .from('offers')
        .select('*');

      const { data: allConversions } = await supabase
        .from('conversions')
        .select('*');

      const { data: allClicks } = await supabase
        .from('clicks')
        .select('*');

      console.log('Raw data:', { users, allOffers, allConversions, allClicks });

      return users.map((user: any) => {
        // Filter data for this user
        const userOffers = (allOffers || []).filter(offer => offer.advertiser_id === user.id);
        const userConversions = (allConversions || []).filter(conv => conv.advertiser_id === user.id);
        const userClicks = (allClicks || []).filter(click => click.advertiser_id === user.id);

        const activeOffers = userOffers.filter(offer => offer.status === 'active').length;
        const totalSpent = userConversions.reduce((sum, conv) => sum + (conv.commission || 0), 0);

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentClicks = userClicks.filter(
          click => new Date(click.created_at) > thirtyDaysAgo
        ).length;

        const recentConversions = userConversions.filter(
          conv => new Date(conv.created_at) > thirtyDaysAgo
        ).length;

        const conversionRate = recentClicks > 0 
          ? ((recentConversions / recentClicks) * 100).toFixed(1)
          : '0.0';

        return {
          id: user.id,
          email: user.email,
          status: user.status || 'inactive',
          created_at: user.created_at,
          company_name: user.company_name,
          first_name: user.first_name,
          last_name: user.last_name,
          country: user.country,
          activeOffers,
          totalSpent,
          conversionRate
        };
      });
    },
  });

  const isLoading = loadingTotal || loadingActive || loadingSpent || loadingAdvertisers;
  console.log('Component state:', {
    isLoading,
    advertisersCount: advertisers?.length,
    searchQuery,
    filteredCount: advertisers?.filter(advertiser => 
      (advertiser.email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (advertiser.company_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (advertiser.first_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (advertiser.last_name?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    ).length
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Advertisers Management</h1>
        <Button>
          <Building2 className="mr-2 h-4 w-4" />
          Add New Advertiser
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Advertiser Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 bg-card rounded-lg border">
              <h3 className="text-sm font-medium text-muted-foreground">Total Advertisers</h3>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <p className="text-2xl font-bold">{totalAdvertisers}</p>
              )}
            </div>
            <div className="p-4 bg-card rounded-lg border">
              <h3 className="text-sm font-medium text-muted-foreground">Active Advertisers</h3>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <p className="text-2xl font-bold">{activeAdvertisers}</p>
              )}
            </div>
            <div className="p-4 bg-card rounded-lg border">
              <h3 className="text-sm font-medium text-muted-foreground">Total Spent</h3>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <p className="text-2xl font-bold">{formatCurrency(totalSpent || 0)}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Advertiser List</h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search advertisers..."
                  className="pl-8 w-[300px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-sm font-medium text-muted-foreground">Advertiser</TableHead>
                  <TableHead className="text-sm font-medium text-muted-foreground">Status</TableHead>
                  <TableHead className="text-sm font-medium text-muted-foreground">Total Spent</TableHead>
                  <TableHead className="text-sm font-medium text-muted-foreground">Active Offers</TableHead>
                  <TableHead className="text-sm font-medium text-muted-foreground">Conv. Rate (30d)</TableHead>
                  <TableHead className="text-sm font-medium text-muted-foreground">Country</TableHead>
                  <TableHead className="text-sm font-medium text-muted-foreground">Joined</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : advertisers?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-4 text-muted-foreground">
                      No advertisers found
                    </TableCell>
                  </TableRow>
                ) : advertisers?.filter(advertiser => 
                    (advertiser.email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                    (advertiser.company_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                    (advertiser.first_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                    (advertiser.last_name?.toLowerCase() || '').includes(searchQuery.toLowerCase())
                  ).map((advertiser) => (
                  <TableRow key={advertiser.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {advertiser.company_name || advertiser.email}
                        </span>
                        {advertiser.company_name && (
                          <span className="text-sm text-muted-foreground">
                            {advertiser.email}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        advertiser.status === 'active' 
                          ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20' 
                          : 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20'
                      }`}>
                        {advertiser.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(advertiser.totalSpent)}</TableCell>
                    <TableCell>{advertiser.activeOffers}</TableCell>
                    <TableCell>{advertiser.conversionRate}%</TableCell>
                    <TableCell>{advertiser.country || '-'}</TableCell>
                    <TableCell>{new Date(advertiser.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuItem>Edit Profile</DropdownMenuItem>
                          <DropdownMenuItem>View Offers</DropdownMenuItem>
                          {advertiser.status === 'active' ? (
                            <DropdownMenuItem className="text-red-600">Suspend</DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem className="text-green-600">Activate</DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 