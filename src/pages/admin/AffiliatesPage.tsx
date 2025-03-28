import { useState } from 'react';
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { MoreHorizontal, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminAffiliates } from '@/hooks/useAdminAffiliates';
import { formatCurrency } from '@/lib/utils';
import { CreateAffiliateDialog } from '@/components/admin/CreateAffiliateDialog';

export function AdminAffiliatesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const { stats, affiliates, refetch } = useAdminAffiliates();

  console.log('Stats data:', stats.data);
  console.log('Affiliates data:', affiliates.data);
  console.log('Loading states:', { stats: stats.isLoading, affiliates: affiliates.isLoading });
  console.log('Error states:', { stats: stats.error, affiliates: affiliates.error });

  if (stats.isLoading || affiliates.isLoading) {
    return <div>Loading...</div>;
  }

  if (stats.error || affiliates.error) {
    console.error('Stats error:', stats.error);
    console.error('Affiliates error:', affiliates.error);
    return <div>Error loading affiliates data. Please try again.</div>;
  }

  const filteredAffiliates = affiliates.data?.filter(affiliate => {
    if (!searchQuery) {
      // Filter by tab first
      if (activeTab === 'active') {
        return affiliate.has_activity;
      }
      return true;
    }
    
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = (
      affiliate.email.toLowerCase().includes(searchLower) ||
      (affiliate.company_name?.toLowerCase().includes(searchLower) || false) ||
      (affiliate.contact_name?.toLowerCase().includes(searchLower) || false)
    );
    
    // Apply tab filter after search
    if (activeTab === 'active') {
      return matchesSearch && affiliate.has_activity;
    }
    return matchesSearch;
  }) || [];

  console.log('Filtered affiliates:', filteredAffiliates);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Affiliates Management</h1>
        <CreateAffiliateDialog onSuccess={refetch} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Affiliate Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 bg-card rounded-lg border">
              <h3 className="text-sm font-medium text-muted-foreground">Total Affiliates</h3>
              <p className="text-2xl font-bold">{stats.data?.totalAffiliates.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-card rounded-lg border">
              <h3 className="text-sm font-medium text-muted-foreground">Active Affiliates</h3>
              <p className="text-2xl font-bold">{stats.data?.activeAffiliates.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-card rounded-lg border">
              <h3 className="text-sm font-medium text-muted-foreground">Total Earnings</h3>
              <p className="text-2xl font-bold">{formatCurrency(stats.data?.totalEarnings || 0)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <CardTitle>Affiliate List ({filteredAffiliates.length})</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search affiliates..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">All Affiliates</TabsTrigger>
                <TabsTrigger value="active">Active Affiliates</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            {filteredAffiliates.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                {searchQuery ? 'No affiliates found matching your search.' : 'No affiliates found.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Total Earnings</TableHead>
                      <TableHead>Active Offers</TableHead>
                      <TableHead>Conversion Rate</TableHead>
                      <TableHead>Joined Date</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAffiliates.map((affiliate) => (
                      <TableRow key={affiliate.id}>
                        <TableCell>{affiliate.contact_name || affiliate.company_name || 'N/A'}</TableCell>
                        <TableCell>{affiliate.email}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            affiliate.status === 'active' ? 'bg-green-100 text-green-800' : 
                            affiliate.status === 'suspended' ? 'bg-red-100 text-red-800' : 
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {affiliate.status ? (affiliate.status.charAt(0).toUpperCase() + affiliate.status.slice(1)) : 'Pending'}
                          </span>
                        </TableCell>
                        <TableCell>{formatCurrency(affiliate.total_earnings)}</TableCell>
                        <TableCell>{affiliate.active_offers}</TableCell>
                        <TableCell>{affiliate.conversion_rate.toFixed(2)}%</TableCell>
                        <TableCell>{new Date(affiliate.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>View Details</DropdownMenuItem>
                              <DropdownMenuItem>Edit</DropdownMenuItem>
                              <DropdownMenuItem>
                                {affiliate.status === 'active' ? 'Suspend' : 'Activate'}
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 