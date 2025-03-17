
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Offer } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ColumnDef } from '@tanstack/react-table';
import { 
  RefreshCw, 
  PlusCircle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Tag,
  Download
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminOffersPage() {
  const navigate = useNavigate();
  
  const { data: offers, isLoading, refetch } = useQuery({
    queryKey: ['admin-offers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('offers')
        .select('*, advertiser:users!advertiser_id(email, contact_name, company_name)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as (Offer & { advertiser: { email: string, contact_name: string, company_name: string } })[];
    },
  });

  const activeOffers = offers?.filter(offer => offer.status === 'active') || [];
  const pendingOffers = offers?.filter(offer => offer.status === 'pending') || [];
  const pausedOffers = offers?.filter(offer => offer.status === 'paused') || [];
  
  const offerColumns: ColumnDef<any>[] = [
    {
      accessorKey: 'name',
      header: 'Offer Name',
      cell: ({ row }) => (
        <div className="font-medium">{row.original.name}</div>
      ),
    },
    {
      accessorKey: 'advertiser.company_name',
      header: 'Advertiser',
      cell: ({ row }) => row.original.advertiser?.company_name || 'N/A',
    },
    {
      accessorKey: 'commission_type',
      header: 'Commission',
      cell: ({ row }) => {
        const offer = row.original;
        return (
          <div>
            {offer.commission_type === 'RevShare' 
              ? `${offer.commission_percent}%` 
              : `$${offer.commission_amount}`}
            <span className="text-xs ml-1 text-muted-foreground">
              ({offer.commission_type})
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge className={
            status === 'active' 
              ? 'bg-green-100 text-green-800' 
              : status === 'paused' 
                ? 'bg-yellow-100 text-yellow-800' 
                : 'bg-gray-100 text-gray-800'
          }>
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Created',
      cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString(),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button size="sm" variant="outline" onClick={() => navigate(`/offers/${row.original.id}`)}>
            View
          </Button>
          {row.original.status === 'active' ? (
            <Button size="sm" variant="outline" className="border-yellow-500 text-yellow-500 hover:bg-yellow-50">
              Pause
            </Button>
          ) : (
            <Button size="sm" variant="outline" className="border-green-500 text-green-500 hover:bg-green-50">
              Activate
            </Button>
          )}
        </div>
      ),
    },
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Offers Management</h1>
          <p className="text-muted-foreground">
            Monitor and manage all offers on the platform
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => navigate('/offers/create')}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Create Offer
          </Button>
        </div>
      </div>
      
      <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Offers</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{offers?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeOffers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paused</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pausedOffers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOffers.length}</div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Offers</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="paused">Paused</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <DataTable 
                columns={offerColumns} 
                data={offers || []} 
                isLoading={isLoading}
                filterableColumns={[
                  { id: 'status', title: 'Status', type: 'select', options: [
                    { label: 'Active', value: 'active' },
                    { label: 'Paused', value: 'paused' },
                    { label: 'Pending', value: 'pending' },
                  ]}
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="active" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <DataTable 
                columns={offerColumns} 
                data={activeOffers} 
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="paused" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <DataTable 
                columns={offerColumns} 
                data={pausedOffers} 
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="pending" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <DataTable 
                columns={offerColumns} 
                data={pendingOffers} 
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
