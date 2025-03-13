
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Offer, AffiliateOffer, Click, Conversion, Payment } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  PlusCircle, 
  TrendingUp, 
  Users, 
  MousePointerClick, 
  CreditCard,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import AffiliateApprovals from '../offers/AffiliateApprovals';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval } from 'date-fns';

export default function AdvertiserDashboard() {
  const { user } = useAuth();
  const [dateRange] = useState(7); // Last 7 days default

  // Calculate date range for charts
  const endDate = new Date();
  const startDate = subDays(endDate, dateRange);

  const { data: offers } = useQuery({
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
    enabled: !!user,
  });

  const { data: affiliateOffers } = useQuery({
    queryKey: ['affiliate-offers', offers],
    queryFn: async () => {
      if (!offers || offers.length === 0) return [];
      const offerIds = offers.map(offer => offer.id);
      const { data, error } = await supabase
        .from('affiliate_offers')
        .select('*')
        .in('offer_id', offerIds);
      if (error) throw error;
      return data as AffiliateOffer[];
    },
    enabled: !!(offers && offers.length > 0),
  });

  const { data: clicks } = useQuery({
    queryKey: ['advertiser-clicks', offers, dateRange],
    queryFn: async () => {
      if (!offers || offers.length === 0) return [];
      const offerIds = offers.map(offer => offer.id);
      const { data, error } = await supabase
        .from('clicks')
        .select('*')
        .in('offer_id', offerIds)
        .gte('created_at', startOfDay(startDate).toISOString())
        .lte('created_at', endOfDay(endDate).toISOString());
      if (error) throw error;
      return data as Click[];
    },
    enabled: !!(offers && offers.length > 0),
  });

  const { data: conversions } = useQuery({
    queryKey: ['advertiser-conversions', clicks],
    queryFn: async () => {
      if (!clicks || clicks.length === 0) return [];
      const clickIds = clicks.map(click => click.click_id);
      const { data, error } = await supabase
        .from('conversions')
        .select('*')
        .in('click_id', clickIds);
      if (error) throw error;
      return data as Conversion[];
    },
    enabled: !!(clicks && clicks.length > 0),
  });

  const { data: wallet } = useQuery({
    queryKey: ['advertiser-wallet', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
  
  // Add a specific query for pending applications to display on the dashboard
  const { data: pendingApplications, refetch: refetchApplications } = useQuery({
    queryKey: ['affiliate-applications-count', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // First get all offers from this advertiser
      const { data: myOffers, error: offersError } = await supabase
        .from('offers')
        .select('id')
        .eq('advertiser_id', user.id);
      
      if (offersError) {
        console.error("Error fetching offers:", offersError);
        throw offersError;
      }
      
      if (!myOffers || myOffers.length === 0) {
        console.log("No offers found for this advertiser");
        return [];
      }
      
      const offerIds = myOffers.map(o => o.id);
      console.log("Fetching applications for offer IDs:", offerIds);
      
      const { data, error } = await supabase
        .from('affiliate_offers')
        .select(`
          *,
          offer:offers(*),
          affiliate:users!affiliate_id(*)
        `)
        .eq('status', 'pending')
        .in('offer_id', offerIds);
      
      if (error) {
        console.error("Error fetching applications:", error);
        throw error;
      }
      
      console.log("Fetched applications:", data);
      return data || [];
    },
    enabled: !!user && user.role === 'advertiser',
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
  });
  
  // Refresh applications when the applications tab is selected
  const [activeTab, setActiveTab] = useState('overview');
  
  useEffect(() => {
    if (activeTab === 'affiliates') {
      refetchApplications();
    }
  }, [activeTab, refetchApplications]);
  
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
        // Find associated click to get date
        const click = clicks.find(c => c.click_id === conv.click_id);
        if (click) {
          const clickDate = format(new Date(click.created_at), 'yyyy-MM-dd');
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
  
  const totalOffers = offers?.length || 0;
  const approvedAffiliates = affiliateOffers?.filter(ao => ao.status === 'approved').length || 0;
  const totalClicks = clicks?.length || 0;
  const totalConversions = conversions?.length || 0;
  const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
  const walletBalance = wallet?.balance || 0;
  
  // Calculate trends (compare to previous period)
  const previousPeriodClicks = clicks?.filter(c => {
    const clickDate = new Date(c.created_at);
    const previousPeriodStart = subDays(startDate, dateRange);
    return clickDate >= previousPeriodStart && clickDate < startDate;
  }).length || 0;
  
  const clicksTrend = previousPeriodClicks > 0 
    ? ((totalClicks - previousPeriodClicks) / previousPeriodClicks) * 100 
    : 0;

  // Update the pendingAffiliateRequests variable to use our new query
  const pendingAffiliateRequests = pendingApplications?.length || 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Advertiser Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your offers and track performance
          </p>
        </div>
        <Button asChild>
          <a href="/offers/create">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Offer
          </a>
        </Button>
      </div>
      
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Offers</CardTitle>
            <div className="p-2 bg-primary/10 rounded-full">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOffers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {offers?.filter(o => o.status === 'active').length || 0} active
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Affiliates</CardTitle>
            <div className="p-2 bg-primary/10 rounded-full">
              <Users className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedAffiliates}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {pendingAffiliateRequests} pending approval
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clicks (7d)</CardTitle>
            <div className="p-2 bg-primary/10 rounded-full">
              <MousePointerClick className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClicks}</div>
            {clicksTrend !== 0 && (
              <div className="flex items-center text-xs mt-1">
                {clicksTrend > 0 ? (
                  <>
                    <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                    <span className="text-green-500">{Math.abs(clicksTrend).toFixed(1)}% up</span>
                  </>
                ) : (
                  <>
                    <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                    <span className="text-red-500">{Math.abs(clicksTrend).toFixed(1)}% down</span>
                  </>
                )}
                <span className="text-muted-foreground ml-1">vs. previous</span>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
            <div className="p-2 bg-primary/10 rounded-full">
              <CreditCard className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${walletBalance.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              For affiliate payments
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="overview" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="offers">Offers</TabsTrigger>
          <TabsTrigger value="affiliates" onClick={() => refetchApplications()}>
            Affiliate Requests
            {pendingApplications?.length ? (
              <Badge variant="secondary" className="ml-2">{pendingApplications.length}</Badge>
            ) : null}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trend</CardTitle>
              <CardDescription>
                {`${format(startDate, 'MMM dd, yyyy')} - ${format(endDate, 'MMM dd, yyyy')}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
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
                      dataKey="revenue"
                      stroke="#ff7300"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Conversion Overview</CardTitle>
                <CardDescription>Last 7 days breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        {
                          name: 'Leads',
                          count: conversions?.filter(c => c.event_type === 'lead').length || 0,
                          amount: conversions
                            ?.filter(c => c.event_type === 'lead')
                            .reduce((sum, c) => sum + (c.revenue || 0), 0) || 0
                        },
                        {
                          name: 'Sales',
                          count: conversions?.filter(c => c.event_type === 'sale').length || 0,
                          amount: conversions
                            ?.filter(c => c.event_type === 'sale')
                            .reduce((sum, c) => sum + (c.revenue || 0), 0) || 0
                        },
                        {
                          name: 'Actions',
                          count: conversions?.filter(c => c.event_type === 'action').length || 0,
                          amount: conversions
                            ?.filter(c => c.event_type === 'action')
                            .reduce((sum, c) => sum + (c.revenue || 0), 0) || 0
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
                      <Bar dataKey="amount" name="Revenue ($)" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Key Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border rounded-md">
                    <div className="grid grid-cols-3 p-3 border-b bg-muted/50">
                      <div className="font-medium">Metric</div>
                      <div className="font-medium">Value</div>
                      <div className="font-medium">Per Day</div>
                    </div>
                    <div className="divide-y">
                      <div className="grid grid-cols-3 p-3">
                        <div>Clicks</div>
                        <div>{totalClicks}</div>
                        <div>{(totalClicks / dateRange).toFixed(1)}</div>
                      </div>
                      <div className="grid grid-cols-3 p-3">
                        <div>Conversions</div>
                        <div>{totalConversions}</div>
                        <div>{(totalConversions / dateRange).toFixed(1)}</div>
                      </div>
                      <div className="grid grid-cols-3 p-3">
                        <div>Conversion Rate</div>
                        <div>{conversionRate.toFixed(2)}%</div>
                        <div>-</div>
                      </div>
                      <div className="grid grid-cols-3 p-3">
                        <div>Revenue</div>
                        <div>
                          ${conversions?.reduce((sum, c) => sum + (c.revenue || 0), 0).toFixed(2) || '0.00'}
                        </div>
                        <div>
                          ${((conversions?.reduce((sum, c) => sum + (c.revenue || 0), 0) || 0) / dateRange).toFixed(2)}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 p-3">
                        <div>Commissions</div>
                        <div>
                          ${conversions?.reduce((sum, c) => sum + (c.commission || 0), 0).toFixed(2) || '0.00'}
                        </div>
                        <div>
                          ${((conversions?.reduce((sum, c) => sum + (c.commission || 0), 0) || 0) / dateRange).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Conversions</CardTitle>
              <CardDescription>Latest affiliate conversions for your offers</CardDescription>
            </CardHeader>
            <CardContent>
              {conversions && conversions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Date</th>
                        <th className="text-left p-2">Type</th>
                        <th className="text-left p-2">Revenue</th>
                        <th className="text-left p-2">Commission</th>
                        <th className="text-left p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {conversions.slice(0, 5).map((conversion) => (
                        <tr key={conversion.id} className="border-b">
                          <td className="p-2">{format(new Date(conversion.created_at), 'MMM dd, HH:mm')}</td>
                          <td className="p-2 capitalize">{conversion.event_type}</td>
                          <td className="p-2">${conversion.revenue?.toFixed(2) || '0.00'}</td>
                          <td className="p-2">${conversion.commission?.toFixed(2) || '0.00'}</td>
                          <td className="p-2 capitalize">{conversion.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">No conversions recorded yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="offers">
          <Card>
            <CardHeader>
              <CardTitle>Your Offers</CardTitle>
              <CardDescription>Manage and track your affiliate offers</CardDescription>
            </CardHeader>
            <CardContent>
              {offers && offers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Name</th>
                        <th className="text-left p-2">Commission</th>
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2">Affiliates</th>
                        <th className="text-left p-2">Clicks (7d)</th>
                        <th className="text-left p-2">Conv.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {offers.map((offer) => {
                        const offerAffiliates = affiliateOffers?.filter(
                          ao => ao.offer_id === offer.id && ao.status === 'approved'
                        ).length || 0;
                        
                        const offerClicks = clicks?.filter(c => c.offer_id === offer.id).length || 0;
                        
                        const offerConversions = conversions?.filter(
                          conv => {
                            const click = clicks?.find(c => c.click_id === conv.click_id);
                            return click?.offer_id === offer.id;
                          }
                        ).length || 0;
                        
                        return (
                          <tr key={offer.id} className="border-b hover:bg-muted/50">
                            <td className="p-2">
                              <a href={`/offers/${offer.id}`} className="text-primary hover:underline">
                                {offer.name}
                              </a>
                            </td>
                            <td className="p-2">
                              {offer.commission_type === 'RevShare' 
                                ? `${offer.commission_percent}%` 
                                : `$${offer.commission_amount}`}
                            </td>
                            <td className="p-2 capitalize">{offer.status}</td>
                            <td className="p-2">{offerAffiliates}</td>
                            <td className="p-2">{offerClicks}</td>
                            <td className="p-2">{offerConversions}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground mb-4">You haven't created any offers yet</p>
                  <Button asChild>
                    <a href="/offers/create">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Create Your First Offer
                    </a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="affiliates">
          <AffiliateApprovals />
        </TabsContent>
      </Tabs>
    </div>
  );
}
