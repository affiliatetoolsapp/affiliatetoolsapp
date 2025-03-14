
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
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval, parseISO } from 'date-fns';

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
      
      let query = supabase
        .from('clicks')
        .select('*')
        .gte('created_at', startOfDay(startDate).toISOString())
        .lte('created_at', endOfDay(endDate).toISOString());
      
      if (isAdvertiser) {
        // For advertisers, get clicks for their offers
        const { data: offers } = await supabase
          .from('offers')
          .select('id')
          .eq('advertiser_id', user.id);
        
        if (offers && offers.length > 0) {
          const offerIds = offers.map(o => o.id);
          query = query.in('offer_id', offerIds);
        } else {
          return [];
        }
      } else if (user.role === 'affiliate') {
        // For affiliates
        query = query.eq('affiliate_id', user.id);
      }
      
      const { data, error } = await query;
      if (error) {
        console.error("Error fetching clicks:", error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!user,
  });
  
  // Get conversions
  const { data: conversions, isLoading: isLoadingConversions } = useQuery({
    queryKey: ['report-conversions', user?.id, user?.role, dateRange, clicks],
    queryFn: async () => {
      if (!user || !clicks || clicks.length === 0) return [];
      
      const clickIds = clicks.map(click => click.click_id);
      
      let query = supabase
        .from('conversions')
        .select('*')
        .in('click_id', clickIds);
        
      if (selectedType !== 'all') {
        query = query.eq('event_type', selectedType);
      }
      
      const { data, error } = await query;
      if (error) {
        console.error("Error fetching conversions:", error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!user && !!clicks && clicks.length > 0,
  });
  
  // Get offers for additional details
  const { data: offers, isLoading: isLoadingOffers } = useQuery({
    queryKey: ['report-offers', user?.id, user?.role],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase.from('offers').select('*');
      
      if (isAdvertiser) {
        query = query.eq('advertiser_id', user.id);
      } else if (user.role === 'affiliate') {
        const { data: affiliateOffers } = await supabase
          .from('affiliate_offers')
          .select('offer_id')
          .eq('affiliate_id', user.id)
          .eq('status', 'approved');
        
        if (affiliateOffers && affiliateOffers.length > 0) {
          const offerIds = affiliateOffers.map(o => o.offer_id);
          query = query.in('id', offerIds);
        } else {
          return [];
        }
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
  
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
        const click = clicks.find(c => c.click_id === conv.click_id);
        if (click) {
          const clickDate = format(parseISO(click.created_at), 'yyyy-MM-dd');
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
  
  const isLoading = isLoadingClicks || isLoadingConversions || isLoadingOffers;
  
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
        
        <Button variant="outline">
          <DownloadIcon className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
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
            <CardHeader>
              <CardTitle>Click Details</CardTitle>
              <CardDescription>
                All traffic details for the selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : clicks && clicks.length > 0 ? (
                <div className="rounded-md border">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="p-2 text-left font-medium">Date</th>
                          <th className="p-2 text-left font-medium">Offer</th>
                          <th className="p-2 text-left font-medium">GEO</th>
                          <th className="p-2 text-left font-medium">Device</th>
                          <th className="p-2 text-left font-medium">Conversions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clicks.slice(0, 10).map(click => {
                          const clickConversions = conversions?.filter(
                            c => c.click_id === click.click_id
                          ).length || 0;
                          
                          return (
                            <tr key={click.id} className="border-b hover:bg-muted/50">
                              <td className="p-2">
                                {format(new Date(click.created_at), 'MMM dd, yyyy HH:mm')}
                              </td>
                              <td className="p-2">
                                {click.offer_id.slice(0, 8)}...
                              </td>
                              <td className="p-2">{click.geo || 'Unknown'}</td>
                              <td className="p-2">{click.device || 'Unknown'}</td>
                              <td className="p-2">{clickConversions}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {clicks.length > 10 && (
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
            <CardHeader>
              <CardTitle>Conversion Details</CardTitle>
              <CardDescription>
                All conversion data for the selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : conversions && conversions.length > 0 ? (
                <div className="rounded-md border">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="p-2 text-left font-medium">Date</th>
                          <th className="p-2 text-left font-medium">Type</th>
                          <th className="p-2 text-left font-medium">Revenue</th>
                          <th className="p-2 text-left font-medium">Commission</th>
                          <th className="p-2 text-left font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {conversions.slice(0, 10).map(conv => (
                          <tr key={conv.id} className="border-b hover:bg-muted/50">
                            <td className="p-2">
                              {format(new Date(conv.created_at), 'MMM dd, yyyy HH:mm')}
                            </td>
                            <td className="p-2 capitalize">{conv.event_type}</td>
                            <td className="p-2">${conv.revenue?.toFixed(2) || '0.00'}</td>
                            <td className="p-2">${conv.commission?.toFixed(2) || '0.00'}</td>
                            <td className="p-2 capitalize">{conv.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {conversions.length > 10 && (
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
