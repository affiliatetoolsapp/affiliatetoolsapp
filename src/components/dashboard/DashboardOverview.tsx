
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval, parseISO } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, TrendingUp, DollarSign, Users, MousePointerClick } from 'lucide-react';

export default function DashboardOverview() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState('7'); // 7 days default
  
  const endDate = new Date();
  const startDate = subDays(endDate, parseInt(timeRange));
  
  // Get clicks data
  const { data: clicks, isLoading: clicksLoading } = useQuery({
    queryKey: ['dashboard-clicks', user?.id, timeRange],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase.from('clicks').select('*');
      
      if (user.role === 'affiliate') {
        query = query.eq('affiliate_id', user.id);
      } else if (user.role === 'advertiser') {
        query = query.eq('advertiser_id', user.id);
      }
      
      query = query
        .gte('created_at', startOfDay(startDate).toISOString())
        .lte('created_at', endOfDay(endDate).toISOString());
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
  
  // Get conversions data
  const { data: conversions, isLoading: conversionsLoading } = useQuery({
    queryKey: ['dashboard-conversions', clicks, timeRange],
    queryFn: async () => {
      if (!clicks || clicks.length === 0) return [];
      
      const clickIds = clicks.map(click => click.click_id);
      
      const { data, error } = await supabase
        .from('conversions')
        .select('*')
        .in('click_id', clickIds);
        
      if (error) throw error;
      return data;
    },
    enabled: !!(clicks && clicks.length > 0),
  });
  
  // Get offers data
  const { data: offers, isLoading: offersLoading } = useQuery({
    queryKey: ['dashboard-offers', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase.from('offers').select('*');
      
      if (user.role === 'advertiser') {
        query = query.eq('advertiser_id', user.id);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
  
  // Get affiliate offers data
  const { data: affiliateOffers, isLoading: affiliateOffersLoading } = useQuery({
    queryKey: ['dashboard-affiliate-offers', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase.from('affiliate_offers').select('*, offers(*)');
      
      if (user.role === 'affiliate') {
        query = query.eq('affiliate_id', user.id);
      } else if (user.role === 'advertiser') {
        query = query.eq('advertiser_id', user.id);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
  
  // Prepare chart data
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
      date: format(parseISO(item.date), 'MMM dd'),
      revenue: parseFloat(item.revenue.toFixed(2)),
      commissions: parseFloat(item.commissions.toFixed(2)),
    }));
  };
  
  const chartData = prepareChartData();
  
  // Calculate summary metrics
  const totalClicks = clicks?.length || 0;
  const totalConversions = conversions?.length || 0;
  const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
  
  const totalRevenue = conversions?.reduce((sum, conv) => sum + (conv.revenue || 0), 0) || 0;
  const totalCommissions = conversions?.reduce((sum, conv) => sum + (conv.commission || 0), 0) || 0;
  
  const activeOffers = user?.role === 'affiliate' 
    ? affiliateOffers?.filter((ao: any) => ao.status === 'approved').length || 0
    : offers?.filter(o => o.status === 'active').length || 0;
  
  const isLoading = clicksLoading || conversionsLoading || offersLoading || affiliateOffersLoading;
  
  if (!user) return null;
  
  const isAffiliate = user.role === 'affiliate';
  const isAdvertiser = user.role === 'advertiser';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Dashboard Overview</h2>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isAffiliate ? 'Active Offers' : 'Your Offers'}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 flex items-center">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{activeOffers}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {isAffiliate 
                    ? `${affiliateOffers?.filter((ao: any) => ao.status === 'pending').length || 0} pending approval`
                    : `${offers?.filter(o => o.status === 'pending').length || 0} pending approval`}
                </p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 flex items-center">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{totalClicks}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {(totalClicks / parseInt(timeRange)).toFixed(1)} per day
                </p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isAffiliate ? 'Commissions' : 'Revenue'}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 flex items-center">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  ${isAffiliate ? totalCommissions.toFixed(2) : totalRevenue.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {isAffiliate 
                    ? `$${(totalCommissions / parseInt(timeRange)).toFixed(2)} per day`
                    : `$${(totalRevenue / parseInt(timeRange)).toFixed(2)} per day`}
                </p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isAffiliate ? 'Conversion Rate' : 'Active Partners'}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 flex items-center">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {isAffiliate 
                    ? `${conversionRate.toFixed(2)}%`
                    : affiliateOffers?.filter((ao: any) => ao.status === 'approved').length || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {isAffiliate 
                    ? `${totalConversions} conversions from ${totalClicks} clicks`
                    : `${affiliateOffers?.filter((ao: any) => ao.status === 'pending').length || 0} pending requests`}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Performance Trends</CardTitle>
          <CardDescription>
            {`${format(startDate, 'MMM dd, yyyy')} - ${format(endDate, 'MMM dd, yyyy')}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-[300px] flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="h-[300px]">
              <Tabs defaultValue="performance">
                <TabsList>
                  <TabsTrigger value="performance">Performance</TabsTrigger>
                  <TabsTrigger value="revenue">
                    {isAffiliate ? 'Earnings' : 'Revenue'}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="performance">
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={chartData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="clicks"
                          stroke="#8884d8"
                          activeDot={{ r: 8 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="conversions"
                          stroke="#82ca9d"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>
                <TabsContent value="revenue">
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey={isAffiliate ? "commissions" : "revenue"}
                          name={isAffiliate ? "Commissions ($)" : "Revenue ($)"}
                          fill="#8884d8"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
