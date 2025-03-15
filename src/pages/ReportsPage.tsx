
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
import { DownloadIcon, FilterIcon } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval } from 'date-fns';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  
  // Get clicks with proper filtering based on user role
  const { data: clicks, isLoading: isLoadingClicks } = useQuery({
    queryKey: ['report-clicks', user?.id, user?.role, dateRange],
    queryFn: async () => {
      if (!user) return [];
      
      try {
        console.log(`Fetching clicks for ${user.role} with ID ${user.id} from ${startDate} to ${endDate}`);
        
        let query = supabase
          .from('clicks')
          .select(`
            *,
            offer:offers(id, name, commission_type)
          `)
          .gte('created_at', startOfDay(startDate).toISOString())
          .lte('created_at', endOfDay(endDate).toISOString());
        
        if (isAdvertiser) {
          // For advertisers, get clicks for their offers
          const { data: offers, error: offersError } = await supabase
            .from('offers')
            .select('id')
            .eq('advertiser_id', user.id);
          
          if (offersError) {
            console.error('Error fetching offers:', offersError);
            toast.error('Failed to fetch offers data');
            return [];
          }
          
          if (offers && offers.length > 0) {
            const offerIds = offers.map(o => o.id);
            console.log('Advertiser offer IDs:', offerIds);
            query = query.in('offer_id', offerIds);
          } else {
            console.log('No offers found for advertiser');
            return [];
          }
        } else {
          // For affiliates
          console.log('Filtering clicks for affiliate ID:', user.id);
          query = query.eq('affiliate_id', user.id);
        }
        
        const { data, error } = await query.order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching clicks:', error);
          toast.error('Failed to fetch clicks data');
          return [];
        }
        
        console.log(`Retrieved ${data?.length || 0} clicks`);
        return data || [];
      } catch (error) {
        console.error('Unexpected error fetching clicks:', error);
        toast.error('An unexpected error occurred while fetching clicks');
        return [];
      }
    },
    enabled: !!user,
  });
  
  // Get conversions with proper filtering based on user role
  const { data: conversions, isLoading: isLoadingConversions } = useQuery({
    queryKey: ['report-conversions', user?.id, user?.role, dateRange, selectedType],
    queryFn: async () => {
      if (!user) return [];
      
      try {
        console.log(`Fetching conversions for ${user.role} with ID ${user.id}`);
        
        let query;
        
        if (isAdvertiser) {
          // For advertisers, get conversions for their offers via clicks
          const { data: offers, error: offersError } = await supabase
            .from('offers')
            .select('id')
            .eq('advertiser_id', user.id);
            
          if (offersError) {
            console.error('Error fetching offers for conversions:', offersError);
            toast.error('Failed to fetch offers data for conversions');
            return [];
          }
          
          if (!offers || offers.length === 0) {
            console.log('No offers found for advertiser when fetching conversions');
            return [];
          }
          
          const offerIds = offers.map(o => o.id);
          console.log('Advertiser offer IDs for conversions:', offerIds);
          
          // First get clicks for these offers
          const { data: offerClicks, error: clicksError } = await supabase
            .from('clicks')
            .select('click_id')
            .in('offer_id', offerIds)
            .gte('created_at', startOfDay(startDate).toISOString())
            .lte('created_at', endOfDay(endDate).toISOString());
            
          if (clicksError) {
            console.error('Error fetching clicks for conversions:', clicksError);
            toast.error('Failed to fetch click data for conversions');
            return [];
          }
          
          if (!offerClicks || offerClicks.length === 0) {
            console.log('No clicks found for advertiser offers');
            return [];
          }
          
          const clickIds = offerClicks.map(click => click.click_id);
          console.log(`Found ${clickIds.length} clicks for conversions`);
          
          // Then get conversions for these clicks
          query = supabase
            .from('conversions')
            .select(`
              *,
              click:clicks(
                click_id, 
                created_at, 
                device, 
                geo, 
                ip_address, 
                user_agent, 
                offer_id,
                offer:offers(name, commission_type)
              )
            `)
            .in('click_id', clickIds);
        } else {
          // For affiliates, get conversions for their clicks
          const { data: affiliateClicks, error: clicksError } = await supabase
            .from('clicks')
            .select('click_id')
            .eq('affiliate_id', user.id)
            .gte('created_at', startOfDay(startDate).toISOString())
            .lte('created_at', endOfDay(endDate).toISOString());
          
          if (clicksError) {
            console.error('Error fetching affiliate clicks:', clicksError);
            toast.error('Failed to fetch affiliate click data');
            return [];
          }
          
          if (!affiliateClicks || affiliateClicks.length === 0) {
            console.log('No clicks found for affiliate');
            return [];
          }
          
          const clickIds = affiliateClicks.map(click => click.click_id);
          console.log(`Found ${clickIds.length} clicks for affiliate conversions`);
          
          query = supabase
            .from('conversions')
            .select(`
              *,
              click:clicks(
                click_id, 
                created_at, 
                device, 
                geo, 
                ip_address, 
                user_agent, 
                offer_id,
                offer:offers(name, commission_type)
              )
            `)
            .in('click_id', clickIds);
        }
          
        if (selectedType !== 'all') {
          console.log('Filtering conversions by event type:', selectedType);
          query = query.eq('event_type', selectedType);
        }
        
        const { data, error } = await query.order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching conversions:', error);
          toast.error('Failed to fetch conversion data');
          return [];
        }
        
        console.log(`Retrieved ${data?.length || 0} conversions`);
        return data || [];
      } catch (error) {
        console.error('Unexpected error fetching conversions:', error);
        toast.error('An unexpected error occurred while fetching conversions');
        return [];
      }
    },
    enabled: !!user,
  });
  
  // Get browser and OS from user agent
  const parseUserAgent = (userAgent: string) => {
    if (!userAgent) return { browser: 'Unknown', os: 'Unknown' };
    
    // Very simple parsing - in a real app, you might want to use a library
    const browser = 
      userAgent.includes('Firefox') ? 'Firefox' :
      userAgent.includes('Chrome') ? 'Chrome' :
      userAgent.includes('Safari') ? 'Safari' :
      userAgent.includes('Edge') ? 'Edge' :
      userAgent.includes('MSIE') || userAgent.includes('Trident') ? 'Internet Explorer' :
      'Other';
      
    const os = 
      userAgent.includes('Windows') ? 'Windows' :
      userAgent.includes('Mac') ? 'MacOS' :
      userAgent.includes('Linux') ? 'Linux' :
      userAgent.includes('Android') ? 'Android' :
      userAgent.includes('iPhone') || userAgent.includes('iPad') ? 'iOS' :
      'Other';
      
    return { browser, os };
  };
  
  // Prepare data for charts
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
      const clickDate = format(new Date(click.created_at), 'yyyy-MM-dd');
      const dataPoint = data.find(d => d.date === clickDate);
      if (dataPoint) {
        dataPoint.clicks += 1;
      }
    });
    
    // Count conversions and sum revenue/commissions by day
    if (conversions) {
      conversions.forEach(conv => {
        const convDate = format(new Date(conv.created_at), 'yyyy-MM-dd');
        const dataPoint = data.find(d => d.date === convDate);
        if (dataPoint) {
          dataPoint.conversions += 1;
          dataPoint.revenue += conv.revenue || 0;
          dataPoint.commissions += conv.commission || 0;
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
  
  const downloadCSV = (type: 'clicks' | 'conversions') => {
    const data = type === 'clicks' ? clicks : conversions;
    if (!data || data.length === 0) {
      toast.error(`No ${type} data to export`);
      return;
    }
    
    let csvContent = '';
    
    if (type === 'clicks') {
      // Headers for clicks
      csvContent = 'Click ID,Date & Time,IP Address,Country,Device,Browser,OS,Offer\n';
      
      // Data rows for clicks
      data.forEach(click => {
        const { browser, os } = parseUserAgent(click.user_agent);
        const row = [
          click.click_id,
          new Date(click.created_at).toISOString(),
          click.ip_address || 'Unknown',
          click.geo || 'Unknown',
          click.device || 'Unknown',
          browser,
          os,
          click.offer?.name || 'Unknown'
        ].map(value => `"${value}"`).join(',');
        csvContent += row + '\n';
      });
    } else {
      // Headers for conversions
      csvContent = 'Date & Time,Click ID,Offer,Event Type,Commission Type,Country,Device,Revenue,Commission,Status\n';
      
      // Data rows for conversions
      data.forEach(conv => {
        const row = [
          new Date(conv.created_at).toISOString(),
          conv.click_id || 'Unknown',
          conv.click?.offer?.name || 'Unknown',
          conv.event_type || 'Unknown',
          conv.click?.offer?.commission_type || 'Unknown',
          conv.click?.geo || 'Unknown',
          conv.click?.device || 'Unknown',
          conv.revenue || '0.00',
          conv.commission || '0.00',
          conv.status || 'Unknown'
        ].map(value => `"${value}"`).join(',');
        csvContent += row + '\n';
      });
    }
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${type}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`${type} data exported successfully`);
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
              <SelectItem value="click">Clicks</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
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
        <TabsList className="grid w-full grid-cols-3">
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
              <Button variant="outline" onClick={() => downloadCSV('clicks')}>
                <DownloadIcon className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingClicks ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : clicks && clicks.length > 0 ? (
                <div className="rounded-md border">
                  <div className="w-full overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Click ID</TableHead>
                          <TableHead>Date & Time</TableHead>
                          <TableHead>IP Address</TableHead>
                          <TableHead>Country</TableHead>
                          <TableHead>Device</TableHead>
                          <TableHead>Browser</TableHead>
                          <TableHead>OS</TableHead>
                          <TableHead>Offer</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {clicks.map(click => {
                          const { browser, os } = parseUserAgent(click.user_agent || '');
                          return (
                            <TableRow key={click.id}>
                              <TableCell className="font-mono text-xs">{click.click_id ? click.click_id.slice(0, 8) + '...' : 'Unknown'}</TableCell>
                              <TableCell>{format(new Date(click.created_at), 'MMM dd, yyyy HH:mm')}</TableCell>
                              <TableCell>{click.ip_address || 'Unknown'}</TableCell>
                              <TableCell>{click.geo || 'Unknown'}</TableCell>
                              <TableCell>{click.device || 'Unknown'}</TableCell>
                              <TableCell>{browser}</TableCell>
                              <TableCell>{os}</TableCell>
                              <TableCell>
                                {click.offer?.name || (click.offer_id ? click.offer_id.slice(0, 8) + '...' : 'Unknown')}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  {clicks.length > 25 && (
                    <div className="p-2 text-center">
                      <Button variant="link" size="sm">
                        View all {clicks.length} clicks
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 border rounded-md">
                  <p className="text-muted-foreground">No click data for the selected period</p>
                </div>
              )}
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
              <Button variant="outline" onClick={() => downloadCSV('conversions')}>
                <DownloadIcon className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingConversions ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : conversions && conversions.length > 0 ? (
                <div className="rounded-md border">
                  <div className="w-full overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date & Time</TableHead>
                          <TableHead>Click ID</TableHead>
                          <TableHead>Offer</TableHead>
                          <TableHead>Event Type</TableHead>
                          <TableHead>Commission Type</TableHead>
                          <TableHead>Country</TableHead>
                          <TableHead>Device</TableHead>
                          <TableHead>Revenue</TableHead>
                          <TableHead>Commission</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {conversions.map(conv => (
                          <TableRow key={conv.id}>
                            <TableCell>{format(new Date(conv.created_at), 'MMM dd, yyyy HH:mm')}</TableCell>
                            <TableCell className="font-mono text-xs">
                              {conv.click_id ? conv.click_id.slice(0, 8) + '...' : 'Unknown'}
                            </TableCell>
                            <TableCell>
                              {conv.click?.offer?.name || 'Unknown'}
                            </TableCell>
                            <TableCell className="capitalize">{conv.event_type}</TableCell>
                            <TableCell>{conv.click?.offer?.commission_type || 'Unknown'}</TableCell>
                            <TableCell>{conv.click?.geo || 'Unknown'}</TableCell>
                            <TableCell>{conv.click?.device || 'Unknown'}</TableCell>
                            <TableCell>${conv.revenue?.toFixed(2) || '0.00'}</TableCell>
                            <TableCell>${conv.commission?.toFixed(2) || '0.00'}</TableCell>
                            <TableCell className="capitalize">{conv.status}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {conversions.length > 25 && (
                    <div className="p-2 text-center">
                      <Button variant="link" size="sm">
                        View all {conversions.length} conversions
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 border rounded-md">
                  <p className="text-muted-foreground">No conversion data for the selected period</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
