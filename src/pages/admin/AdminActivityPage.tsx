
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { 
  RefreshCw, 
  MousePointerClick, 
  CheckCircle2, 
  Activity,
  BarChart4,
  Clock 
} from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';

export default function AdminActivityPage() {
  // Fetch clicks
  const { data: clicks, isLoading: clicksLoading, refetch: refetchClicks } = useQuery({
    queryKey: ['admin-clicks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clicks')
        .select(`
          *,
          affiliate:users!affiliate_id(email),
          offers(name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as any[];
    },
  });

  // Fetch conversions
  const { data: conversions, isLoading: conversionsLoading, refetch: refetchConversions } = useQuery({
    queryKey: ['admin-conversions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversions')
        .select(`
          *,
          click:clicks!click_id(
            affiliate_id,
            offer_id,
            affiliate:users!affiliate_id(email),
            offer:offers!offer_id(name, advertiser_id),
            advertiser:offers!offer_id(advertiser:users!advertiser_id(email))
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as any[];
    },
  });
  
  const totalClicks = clicks?.length || 0;
  const totalConversions = conversions?.length || 0;
  
  const conversionRate = totalClicks > 0 
    ? ((totalConversions / totalClicks) * 100).toFixed(2)
    : '0.00';
    
  const totalRevenue = conversions?.reduce((sum, conversion) => sum + (conversion.revenue || 0), 0) || 0;
  
  const clickColumns: ColumnDef<any>[] = [
    {
      accessorKey: 'created_at',
      header: 'Time',
      cell: ({ row }) => {
        const date = new Date(row.original.created_at);
        return (
          <div className="whitespace-nowrap">
            {date.toLocaleDateString()} {date.toLocaleTimeString()}
          </div>
        );
      },
    },
    {
      accessorKey: 'click_id',
      header: 'Click ID',
      cell: ({ row }) => (
        <div className="font-mono text-xs">{row.original.click_id}</div>
      ),
    },
    {
      accessorKey: 'affiliate.email',
      header: 'Affiliate',
      cell: ({ row }) => row.original.affiliate?.email || 'N/A',
    },
    {
      accessorKey: 'offers.name',
      header: 'Offer',
      cell: ({ row }) => row.original.offers?.name || 'N/A',
    },
    {
      accessorKey: 'ip_address',
      header: 'IP Address',
      cell: ({ row }) => row.original.ip_address || 'N/A',
    },
    {
      accessorKey: 'geo',
      header: 'Country',
      cell: ({ row }) => row.original.geo || 'Unknown',
    },
    {
      accessorKey: 'device',
      header: 'Device',
      cell: ({ row }) => row.original.device || 'Unknown',
    },
  ];
  
  const conversionColumns: ColumnDef<any>[] = [
    {
      accessorKey: 'created_at',
      header: 'Time',
      cell: ({ row }) => {
        const date = new Date(row.original.created_at);
        return (
          <div className="whitespace-nowrap">
            {date.toLocaleDateString()} {date.toLocaleTimeString()}
          </div>
        );
      },
    },
    {
      accessorKey: 'click_id',
      header: 'Click ID',
      cell: ({ row }) => (
        <div className="font-mono text-xs">{row.original.click_id}</div>
      ),
    },
    {
      accessorKey: 'click.affiliate.email',
      header: 'Affiliate',
      cell: ({ row }) => {
        if (!row.original.click) return 'N/A';
        return row.original.click.affiliate?.email || 'N/A';
      },
    },
    {
      accessorKey: 'click.offer.name',
      header: 'Offer',
      cell: ({ row }) => {
        if (!row.original.click) return 'N/A';
        return row.original.click.offer?.name || 'N/A';
      },
    },
    {
      accessorKey: 'event_type',
      header: 'Event',
      cell: ({ row }) => (
        <div className="capitalize">{row.original.event_type}</div>
      ),
    },
    {
      accessorKey: 'revenue',
      header: 'Revenue',
      cell: ({ row }) => `$${(row.original.revenue || 0).toFixed(2)}`,
    },
    {
      accessorKey: 'commission',
      header: 'Commission',
      cell: ({ row }) => `$${(row.original.commission || 0).toFixed(2)}`,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <div className="capitalize">{row.original.status}</div>
      ),
    },
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activity Monitoring</h1>
          <p className="text-muted-foreground">
            Real-time platform activity tracking
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => {
            refetchClicks();
            refetchConversions();
          }}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
      
      <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clicks</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClicks}</div>
            <p className="text-xs text-muted-foreground">
              Past 24 hours
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalConversions}</div>
            <p className="text-xs text-muted-foreground">
              Past 24 hours
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <BarChart4 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              From {totalConversions} conversions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Clicks to conversions
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="clicks">
        <TabsList>
          <TabsTrigger value="clicks">Clicks</TabsTrigger>
          <TabsTrigger value="conversions">Conversions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="clicks" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Clicks</CardTitle>
              <CardDescription>
                Most recent click activity across the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable 
                columns={clickColumns} 
                data={clicks || []} 
                isLoading={clicksLoading}
                filterableColumns={[
                  { id: 'geo', title: 'Country', type: 'text' },
                  { id: 'device', title: 'Device', type: 'text' }
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="conversions" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Conversions</CardTitle>
              <CardDescription>
                Latest conversions recorded in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable 
                columns={conversionColumns} 
                data={conversions || []} 
                isLoading={conversionsLoading}
                filterableColumns={[
                  { id: 'event_type', title: 'Event Type', type: 'select', options: [
                    { label: 'Lead', value: 'lead' },
                    { label: 'Sale', value: 'sale' },
                    { label: 'Action', value: 'action' },
                  ]},
                  { id: 'status', title: 'Status', type: 'select', options: [
                    { label: 'Pending', value: 'pending' },
                    { label: 'Approved', value: 'approved' },
                    { label: 'Rejected', value: 'rejected' },
                  ]}
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
