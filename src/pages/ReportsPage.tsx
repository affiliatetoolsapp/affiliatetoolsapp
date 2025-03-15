import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { 
  LineChart, 
  Line, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  DownloadIcon, 
  FilterIcon,
  ChevronDown,
  Calendar as CalendarIcon
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval, parseISO } from 'date-fns';
import { DataTable } from '@/components/ui/data-table';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';

export default function ReportsPage() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState('7');
  const [groupBy, setGroupBy] = useState('daily');
  const [selectedType, setSelectedType] = useState('all');
  
  const isAdvertiser = user?.role === 'advertiser';
  
  // Calculate date range
  const endDate = new Date();
  const startDate = subDays(endDate, parseInt(dateRange));
  
  // Get clicks
  const { data: clicks, isLoading: isLoadingClicks } = useQuery({
    queryKey: ['report-clicks', user?.id, user?.role, dateRange],
    queryFn: async () => {
      if (!user) return [];
      
      try {
        if (isAdvertiser) {
          // For advertisers - get clicks for offers they created
          console.log('Fetching clicks for advertiser:', user.id);
          
          const { data, error } = await supabase
            .from('clicks')
            .select(`
              *,
              offers!inner(*)
            `)
            .gte('created_at', startOfDay(startDate).toISOString())
            .lte('created_at', endOfDay(endDate).toISOString())
            .eq('offers.advertiser_id', user.id);
          
          if (error) {
            console.error('Error fetching clicks for advertiser:', error);
            throw error;
          }
          
          console.log(`Found ${data?.length || 0} clicks for advertiser`);
          return data || [];
        } else {
          // For affiliates - get clicks for their tracking links
          console.log('Fetching clicks for affiliate:', user.id);
          
          const { data, error } = await supabase
            .from('clicks')
            .select(`
              *,
              offers(*)
            `)
            .gte('created_at', startOfDay(startDate).toISOString())
            .lte('created_at', endOfDay(endDate).toISOString())
            .eq('affiliate_id', user.id);
          
          if (error) {
            console.error('Error fetching clicks for affiliate:', error);
            throw error;
          }
          
          console.log(`Found ${data?.length || 0} clicks for affiliate`);
          return data || [];
        }
      } catch (error) {
        console.error('Error processing clicks:', error);
        return [];
      }
    },
    enabled: !!user,
  });
  
  // Get conversions
  const { data: conversions, isLoading: isLoadingConversions } = useQuery({
    queryKey: ['report-conversions', user?.id, user?.role, dateRange, selectedType],
    queryFn: async () => {
      if (!user) return [];
      
      try {
        // We need different approaches for advertisers vs affiliates
        console.log('Fetching conversions with filters:', {
          startDate: startOfDay(startDate).toISOString(),
          endDate: endOfDay(endDate).toISOString(),
          selectedType,
          isAdvertiser
        });
        
        let query;
        
        if (isAdvertiser) {
          // For advertisers - get conversions for their offers via click's offer_id
          query = supabase
            .from('conversions')
            .select(`
              *,
              click:clicks!inner(
                id, click_id, affiliate_id, offer_id, 
                tracking_code, created_at, ip_address, device, geo,
                offers!inner(id, name, advertiser_id, commission_type)
              )
            `)
            .gte('created_at', startOfDay(startDate).toISOString())
            .lte('created_at', endOfDay(endDate).toISOString())
            .eq('click.offers.advertiser_id', user.id);
        } else {
          // For affiliates - get conversions for their clicks
          query = supabase
            .from('conversions')
            .select(`
              *,
              click:clicks!inner(
                id, click_id, affiliate_id, offer_id, 
                tracking_code, created_at, ip_address, device, geo,
                offers(id, name, advertiser_id, commission_type)
              )
            `)
            .gte('created_at', startOfDay(startDate).toISOString())
            .lte('created_at', endOfDay(endDate).toISOString())
            .eq('click.affiliate_id', user.id);
        }
        
        if (selectedType !== 'all') {
          query = query.eq('event_type', selectedType);
        }
        
        const { data, error } = await query;
        
        if (error) {
          console.error('Error fetching conversions:', error);
          throw error;
        }
        
        console.log(`Found ${data?.length || 0} conversions`);
        return data || [];
      } catch (error) {
        console.error('Error processing conversions:', error);
        return [];
      }
    },
    enabled: !!user,
  });
  
  // Prepare data for charts - no change needed here
  const prepareChartData = () => {
    if (!clicks) return [];
    
    // Create an array of all days in the date range
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    // Initialize the data array with counts of 0
    const data = days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      return {
        date: dateStr,
        clicks: 0,
        conversions: 0,
        revenue: 0,
        commissions: 0,
      };
    });
    
    // Count clicks by day
    clicks.forEach(click => {
      const clickDate = format(parseISO(click.created_at), 'yyyy-MM-dd');
      const dataPoint = data.find(d => d.date === clickDate);
      if (dataPoint) {
        dataPoint.clicks += 1;
      }
    });
    
    // Count conversions and sum revenue/commissions by day
    if (conversions) {
      conversions.forEach(conv => {
        // Find associated click to get date
        const clickData = conv.click as any;
        if (clickData) {
          const clickDate = format(parseISO(clickData.created_at), 'yyyy-MM-dd');
          const dataPoint = data.find(d => d.date === clickDate);
          if (dataPoint) {
            dataPoint.conversions += 1;
            dataPoint.revenue += conv.revenue || 0;
            dataPoint.commissions += conv.commission || 0;
          }
        }
      });
    }
    
    // Format dates for display
    return data.map(item => ({
      ...item,
      date: format(new Date(item.date), 'MMM dd'),
      revenue: parseFloat(item.revenue.toFixed(2)),
      commissions: parseFloat(item.commissions.toFixed(2)),
    }));
  };
  
  const chartData = prepareChartData();
  
  // Calculate totals
  const totalClicks = clicks?.length || 0;
  const totalConversions = conversions?.length || 0;
  const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
  const totalRevenue = conversions?.reduce((sum, conv) => sum + (conv.revenue || 0), 0) || 0;
  const totalCommissions = conversions?.reduce((sum, conv) => sum + (conv.commission || 0), 0) || 0;
  
  const isLoading = isLoadingClicks || isLoadingConversions;

  // Define columns for clicks table
  const clickColumns: ColumnDef<any>[] = [
    {
      accessorKey: "click_id",
      header: "Click ID",
      cell: ({ row }) => (
        <div className="font-mono text-xs truncate max-w-[120px]" title={row.original.click_id}>
          {row.original.click_id.substring(0, 8)}...
        </div>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Date & Time",
      cell: ({ row }) => (
        <div className="whitespace-nowrap">
          {format(parseISO(row.original.created_at), "MMM dd, yyyy HH:mm")}
        </div>
      ),
    },
    {
      accessorKey: "ip_address",
      header: "IP Address",
      cell: ({ row }) => <div>{row.original.ip_address || "Unknown"}</div>,
    },
    {
      accessorKey: "geo",
      header: "Country",
      cell: ({ row }) => <div>{row.original.geo || "Unknown"}</div>,
    },
    {
      accessorKey: "device",
      header: "Device",
      cell: ({ row }) => <div className="capitalize">{row.original.device || "Unknown"}</div>,
    },
    {
      accessorKey: "browser",
      header: "Browser",
      cell: ({ row }) => {
        const userAgent = row.original.user_agent || "";
        let browser = "Unknown";
        
        if (userAgent.includes("Chrome")) browser = "Chrome";
        else if (userAgent.includes("Firefox")) browser = "Firefox";
        else if (userAgent.includes("Safari")) browser = "Safari";
        else if (userAgent.includes("Edge")) browser = "Edge";
        else if (userAgent.includes("MSIE") || userAgent.includes("Trident")) browser = "Internet Explorer";
        
        return <div>{browser}</div>;
      },
    },
    {
      accessorKey: "os",
      header: "OS",
      cell: ({ row }) => {
        const userAgent = row.original.user_agent || "";
        let os = "Unknown";
        
        if (userAgent.includes("Windows")) os = "Windows";
        else if (userAgent.includes("Mac")) os = "MacOS";
        else if (userAgent.includes("iPhone")) os = "iOS";
        else if (userAgent.includes("iPad")) os = "iPadOS";
        else if (userAgent.includes("Android")) os = "Android";
        else if (userAgent.includes("Linux")) os = "Linux";
        
        return <div>{os}</div>;
      },
    },
    {
      accessorKey: "offer",
      header: "Offer",
      cell: ({ row }) => {
        const offerName = row.original.offers?.name || "Unknown";
        return <div className="font-medium">{offerName}</div>;
      },
    },
    {
      accessorKey: "tracking_code",
      header: "Tracking Code",
      cell: ({ row }) => <div>{row.original.tracking_code || "N/A"}</div>,
    },
    {
      accessorKey: "conversions",
      header: "Conversions",
      cell: ({ row }) => {
        const count = conversions?.filter(c => c.click_id === row.original.click_id).length || 0;
        return <div className="text-center">{count}</div>;
      },
    },
  ];

  // Define columns for conversions table
  const conversionColumns: ColumnDef<any>[] = [
    {
      accessorKey: "id",
      header: "Conversion ID",
      cell: ({ row }) => (
        <div className="font-mono text-xs truncate max-w-[120px]" title={row.original.id}>
          {row.original.id.substring(0, 8)}...
        </div>
      ),
    },
    {
      accessorKey: "click_id",
      header: "Click ID",
      cell: ({ row }) => (
        <div className="font-mono text-xs truncate max-w-[120px]" title={row.original.click_id}>
          {row.original.click_id.substring(0, 8)}...
        </div>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Date & Time",
      cell: ({ row }) => (
        <div className="whitespace-nowrap">
          {format(parseISO(row.original.created_at), "MMM dd, yyyy HH:mm")}
        </div>
      ),
    },
    {
      accessorKey: "offer",
      header: "Offer",
      cell: ({ row }) => {
        const clickData = row.original.click as any;
        const offerName = clickData?.offers?.name || "Unknown";
        return <div className="font-medium">{offerName}</div>;
      },
    },
    {
      accessorKey: "event_type",
      header: "Type",
      cell: ({ row }) => (
        <div className="capitalize">{row.original.event_type}</div>
      ),
    },
    {
      accessorKey: "commission_type",
      header: "Commission Type",
      cell: ({ row }) => {
        const clickData = row.original.click as any;
        const commissionType = clickData?.offers?.commission_type || "Unknown";
        return <div>{commissionType}</div>;
      },
    },
    {
      accessorKey: "revenue",
      header: "Revenue",
      cell: ({ row }) => (
        <div>${(row.original.revenue || 0).toFixed(2)}</div>
      ),
    },
    {
      accessorKey: "commission",
      header: "Commission",
      cell: ({ row }) => (
        <div>${(row.original.commission || 0).toFixed(2)}</div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <div className="capitalize">{row.original.status}</div>
      ),
    },
  ];

  // Export data to CSV
  const exportToCSV = (dataType: 'clicks' | 'conversions') => {
    try {
      const data = dataType === 'clicks' ? clicks : conversions;
      if (!data || data.length === 0) {
        toast.error(`No ${dataType} data to export`);
        return;
      }
      
      let csvContent = '';
      let headers = [];
      let rows = [];
      
      if (dataType === 'clicks') {
        headers = ['Click ID', 'Date', 'IP Address', 'Country', 'Device', 'Browser', 'OS', 'Offer', 'Conversions'];
        
        rows = data.map(click => {
          const userAgent = click.user_agent || '';
          let browser = 'Unknown';
          let os = 'Unknown';
          
          if (userAgent.includes('Chrome')) browser = 'Chrome';
          else if (userAgent.includes('Firefox')) browser = 'Firefox';
          else if (userAgent.includes('Safari')) browser = 'Safari';
          else if (userAgent.includes('Edge')) browser = 'Edge';
          
          if (userAgent.includes('Windows')) os = 'Windows';
          else if (userAgent.includes('Mac')) os = 'MacOS';
          else if (userAgent.includes('iPhone')) os = 'iOS';
          else if (userAgent.includes('Android')) os = 'Android';
          
          const convCount = conversions?.filter(c => c.click_id === click.click_id).length || 0;
          
          return [
            click.click_id,
            format(parseISO(click.created_at), 'yyyy-MM-dd HH:mm:ss'),
            click.ip_address || 'Unknown',
            click.geo || 'Unknown',
            click.device || 'Unknown',
            browser,
            os,
            click.offers?.name || 'Unknown',
            convCount
          ];
        });
      } else {
        headers = ['Conversion ID', 'Click ID', 'Date', 'Offer', 'Type', 'Commission Type', 'Revenue', 'Commission', 'Status'];
        
        rows = data.map(conv => {
          const clickData = conv.click as any;
          return [
            conv.id,
            conv.click_id,
            format(parseISO(conv.created_at), 'yyyy-MM-dd HH:mm:ss'),
            clickData?.offers?.name || 'Unknown',
            conv.event_type,
            clickData?.offers?.commission_type || 'Unknown',
            (conv.revenue || 0).toFixed(2),
            (conv.commission || 0).toFixed(2),
            conv.status
          ];
        });
      }
      
      // Add headers
      csvContent += headers.join(',') + '\n';
      
      // Add rows
      rows.forEach(row => {
        csvContent += row.map(value => `"${value}"`).join(',') + '\n';
      });
      
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${dataType}_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`${dataType} data exported successfully`);
    } catch (error) {
      console.error(`Error exporting ${dataType}:`, error);
      toast.error(`Failed to export ${dataType} data`);
    }
  };
  
  if (!user) return null;
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Performance Reports</h1>
        <p className="text-muted-foreground">
          Track your {isAdvertiser ? 'offer' : 'affiliate'} performance and earnings
        </p>
      </div>
      
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <Select
            value={dateRange}
            onValueChange={setDateRange}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          
          <Select
            value={selectedType}
            onValueChange={setSelectedType}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Event Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="lead">Leads</SelectItem>
              <SelectItem value="sale">Sales</SelectItem>
              <SelectItem value="action">Actions</SelectItem>
              <SelectItem value="deposit">Deposits</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : totalClicks.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : totalConversions.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              CR: {isLoading ? '...' : conversionRate.toFixed(2)}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{isAdvertiser ? 'Revenue' : 'Advertiser Revenue'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${isLoading ? '...' : totalRevenue.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{isAdvertiser ? 'Commissions Paid' : 'Your Commissions'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${isLoading ? '...' : totalCommissions.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="clicks">Clicks</TabsTrigger>
          <TabsTrigger value="conversions">Conversions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trend</CardTitle>
              <CardDescription>
                {`${format(startDate, 'MMM dd, yyyy')} - ${format(endDate, 'MMM dd, yyyy')}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-[300px]">
                {isLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="clicks"
                        stroke="#8884d8"
                        activeDot={{ r: 8 }}
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="conversions"
                        stroke="#82ca9d"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey={isAdvertiser ? "revenue" : "commissions"}
                        stroke="#ff7300"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
          
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Conversion Breakdown</CardTitle>
                <CardDescription>By event type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {isLoading ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : conversions && conversions.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          {
                            name: 'Leads',
                            count: conversions.filter(c => c.event_type === 'lead').length,
                            amount: conversions
                              .filter(c => c.event_type === 'lead')
                              .reduce((sum, c) => sum + (c.commission || 0), 0)
                          },
                          {
                            name: 'Sales',
                            count: conversions.filter(c => c.event_type === 'sale').length,
                            amount: conversions
                              .filter(c => c.event_type === 'sale')
                              .reduce((sum, c) => sum + (c.commission || 0), 0)
                          },
                          {
                            name: 'Actions',
                            count: conversions.filter(c => c.event_type === 'action').length,
                            amount: conversions
                              .filter(c => c.event_type === 'action')
                              .reduce((sum, c) => sum + (c.commission || 0), 0)
                          },
                          {
                            name: 'Deposits',
                            count: conversions.filter(c => c.event_type === 'deposit').length,
                            amount: conversions
                              .filter(c => c.event_type === 'deposit')
                              .reduce((sum, c) => sum + (c.commission || 0), 0)
                          }
                        ]}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" name="Count" fill="#8884d8" />
                        <Bar dataKey="amount" name="Amount ($)" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      No conversion data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Key Metrics Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border rounded-md">
                    <div className="grid grid-cols-3 p-3 border-b bg-muted/50">
                      <div className="font-medium">Metric</div>
                      <div className="font-medium">This Period</div>
                      <div className="font-medium">Per Day Avg</div>
                    </div>
                    <div className="divide-y">
                      <div className="grid grid-cols-3 p-3">
                        <div>Clicks</div>
                        <div>{totalClicks}</div>
                        <div>{(totalClicks / parseInt(dateRange)).toFixed(1)}</div>
                      </div>
                      <div className="grid grid-cols-3 p-3">
                        <div>Conversions</div>
                        <div>{totalConversions}</div>
                        <div>{(totalConversions / parseInt(dateRange)).toFixed(1)}</div>
                      </div>
                      <div className="grid grid-cols-3 p-3">
                        <div>Conv. Rate</div>
                        <div>{conversionRate.toFixed(2)}%</div>
                        <div>-</div>
                      </div>
                      <div className="grid grid-cols-3 p-3">
                        <div>{isAdvertiser ? 'Revenue' : 'Earnings'}</div>
                        <div>${isAdvertiser ? totalRevenue.toFixed(2) : totalCommissions.toFixed(2)}</div>
                        <div>${((isAdvertiser ? totalRevenue : totalCommissions) / parseInt(dateRange)).toFixed(2)}</div>
                      </div>
                      <div className="grid grid-cols-3 p-3">
                        <div>EPC</div>
                        <div>${totalClicks ? (totalCommissions / totalClicks).toFixed(2) : '0.00'}</div>
                        <div>-</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="clicks">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Click Details</CardTitle>
                <CardDescription>
                  All traffic details for the selected period
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => exportToCSV('clicks')}
                disabled={!clicks || clicks.length === 0}
              >
                <DownloadIcon className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <DataTable 
                columns={clickColumns} 
                data={clicks || []} 
                isLoading={isLoadingClicks}
                emptyMessage="No click data for the selected period"
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="conversions">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Conversion Details</CardTitle>
                <CardDescription>
                  All conversion data for the selected period
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => exportToCSV('conversions')}
                disabled={!conversions || conversions.length === 0}
              >
                <DownloadIcon className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <DataTable 
                columns={conversionColumns} 
                data={conversions || []} 
                isLoading={isLoadingConversions}
                emptyMessage="No conversion data for the selected period"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
