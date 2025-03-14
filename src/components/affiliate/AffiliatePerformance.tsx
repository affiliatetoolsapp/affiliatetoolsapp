
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BarChart, LineChart, PieChart } from "lucide-react";
import { Bar, BarChart as RechartsBarChart, CartesianGrid, Legend, Line, LineChart as RechartsLineChart, Pie, PieChart as RechartsPieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';
import { format, subDays, startOfDay, endOfDay, parseISO } from 'date-fns';

export default function AffiliatePerformance() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');
  
  // Calculate date range
  const endDate = new Date();
  const startDate = subDays(endDate, dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90);
  
  // Fetch clicks data
  const { data: clicks, isLoading: clicksLoading } = useQuery({
    queryKey: ['affiliate-clicks', user?.id, dateRange],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('clicks')
        .select('*')
        .eq('affiliate_id', user.id)
        .gte('created_at', startOfDay(startDate).toISOString())
        .lte('created_at', endOfDay(endDate).toISOString());
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && user.role === 'affiliate',
  });
  
  // Fetch conversions data
  const { data: conversions, isLoading: conversionsLoading } = useQuery({
    queryKey: ['affiliate-conversions', user?.id, dateRange, clicks],
    queryFn: async () => {
      if (!user || !clicks || clicks.length === 0) return [];
      
      const clickIds = clicks.map(click => click.click_id);
      
      const { data, error } = await supabase
        .from('conversions')
        .select('*')
        .in('click_id', clickIds);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!clicks && clicks.length > 0 && user.role === 'affiliate',
  });
  
  // Fetch offers data
  const { data: offers, isLoading: offersLoading } = useQuery({
    queryKey: ['affiliate-offers', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('affiliate_offers')
        .select(`
          *,
          offers(*)
        `)
        .eq('affiliate_id', user.id)
        .eq('status', 'approved');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && user.role === 'affiliate',
  });
  
  // Prepare daily data for charts
  const prepareDailyData = () => {
    if (!clicks) return [];
    
    // Create a map for each day
    const dailyDataMap = new Map();
    
    // Initialize with all days in the range having zeros
    for (let i = 0; i <= (dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90); i++) {
      const date = subDays(endDate, i);
      const dateString = format(date, 'yyyy-MM-dd');
      dailyDataMap.set(dateString, {
        date: format(date, 'MMM dd'),
        clicks: 0,
        conversions: 0,
        earnings: 0,
      });
    }
    
    // Count clicks by day
    clicks.forEach(click => {
      const clickDate = format(parseISO(click.created_at), 'yyyy-MM-dd');
      if (dailyDataMap.has(clickDate)) {
        const dayData = dailyDataMap.get(clickDate);
        dayData.clicks += 1;
      }
    });
    
    // Count conversions and earnings by day
    if (conversions) {
      conversions.forEach(conversion => {
        // Find associated click to get date
        const click = clicks.find(c => c.click_id === conversion.click_id);
        if (click) {
          const clickDate = format(parseISO(click.created_at), 'yyyy-MM-dd');
          if (dailyDataMap.has(clickDate)) {
            const dayData = dailyDataMap.get(clickDate);
            dayData.conversions += 1;
            dayData.earnings += conversion.commission || 0;
          }
        }
      });
    }
    
    // Convert map to array and sort by date
    return Array.from(dailyDataMap.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };
  
  const dailyData = prepareDailyData();
  
  // Prepare category data for charts
  const prepareCategoryData = () => {
    if (!offers || !conversions) return [];
    
    // Create a map to track conversions by niche/category
    const categoryCounts = new Map();
    const categoryColors = [
      '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe',
      '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'
    ];
    
    // Initialize with all offers' niches
    offers.forEach((offerData, index) => {
      const niche = offerData.offers.niche || 'Uncategorized';
      if (!categoryCounts.has(niche)) {
        categoryCounts.set(niche, {
          name: niche,
          value: 0,
          color: categoryColors[index % categoryColors.length]
        });
      }
    });
    
    // Count conversions by niche
    conversions.forEach(conversion => {
      // Find the associated click
      const click = clicks?.find(c => c.click_id === conversion.click_id);
      if (click) {
        // Find the offer
        const offerData = offers.find(o => o.offer_id === click.offer_id);
        if (offerData) {
          const niche = offerData.offers.niche || 'Uncategorized';
          if (categoryCounts.has(niche)) {
            const category = categoryCounts.get(niche);
            category.value += 1;
          }
        }
      }
    });
    
    return Array.from(categoryCounts.values());
  };
  
  const categoryData = prepareCategoryData();
  
  // Calculate summary statistics
  const totalClicks = clicks?.length || 0;
  const totalConversions = conversions?.length || 0;
  const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
  const totalEarnings = conversions?.reduce((sum, conv) => sum + (conv.commission || 0), 0) || 0;
  const epc = totalClicks > 0 ? totalEarnings / totalClicks : 0;
  
  // Group conversions by traffic source
  const prepareTrafficData = () => {
    if (!clicks) return [];
    
    // Count by referrer
    const sourceCount = {};
    let totalTracked = 0;
    
    clicks.forEach(click => {
      const source = click.referrer 
        ? new URL(click.referrer).hostname || 'direct'
        : 'direct';
      
      sourceCount[source] = (sourceCount[source] || 0) + 1;
      totalTracked++;
    });
    
    // Convert to percentage and sort
    return Object.entries(sourceCount)
      .map(([name, count]) => ({
        name: name.replace('www.', ''),
        percent: Math.round((count as number / totalTracked) * 100)
      }))
      .sort((a, b) => b.percent - a.percent)
      .slice(0, 4); // Top 4 sources
  };
  
  const trafficSources = prepareTrafficData();
  
  const isLoading = clicksLoading || conversionsLoading || offersLoading;
  
  if (!user) return null;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Performance</h1>
          <p className="text-muted-foreground">
            Analyze your traffic and conversion metrics
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={(value: '7d' | '30d' | '90d') => setDateRange(value)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline">
            Export
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Clicks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalClicks.toLocaleString()}</div>
                <div className="mt-1 flex items-center text-xs text-muted-foreground">
                  <div className="text-muted">Last {dateRange === '7d' ? '7' : dateRange === '30d' ? '30' : '90'} days</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Conversions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalConversions.toLocaleString()}</div>
                <div className="mt-1 flex items-center text-xs text-muted-foreground">
                  <div className="text-muted">CR: {conversionRate.toFixed(2)}%</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Earnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalEarnings.toFixed(2)}</div>
                <div className="mt-1 flex items-center text-xs text-muted-foreground">
                  <div className="text-muted">EPC: ${epc.toFixed(2)}</div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>
                Track your traffic, conversions, and earnings over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="clicks">
                <div className="flex justify-between items-center mb-4">
                  <TabsList>
                    <TabsTrigger value="clicks">Clicks</TabsTrigger>
                    <TabsTrigger value="conversions">Conversions</TabsTrigger>
                    <TabsTrigger value="earnings">Earnings</TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="clicks" className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="clicks" fill="#8884d8" name="Clicks" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </TabsContent>
                
                <TabsContent value="conversions" className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="conversions" stroke="#82ca9d" name="Conversions" />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </TabsContent>
                
                <TabsContent value="earnings" className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${value}`, 'Earnings']} />
                      <Line type="monotone" dataKey="earnings" stroke="#ffc658" name="Earnings" />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Category Performance</CardTitle>
                <CardDescription>
                  Conversions by category
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [value, 'Conversions']} />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No category data available
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>
                  Key performance indicators
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-sm font-medium">Conversion Rate</div>
                      <div className="text-sm text-muted-foreground">{conversionRate.toFixed(2)}%</div>
                    </div>
                    <div className="h-2 bg-muted rounded overflow-hidden">
                      <div 
                        className="h-full bg-primary" 
                        style={{ width: `${Math.min(conversionRate * 5, 100)}%` }}
                      ></div>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Industry average: 3.2%
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-sm font-medium">EPC (Earnings Per Click)</div>
                      <div className="text-sm text-muted-foreground">${epc.toFixed(2)}</div>
                    </div>
                    <div className="h-2 bg-muted rounded overflow-hidden">
                      <div 
                        className="h-full bg-primary" 
                        style={{ width: `${Math.min(epc * 100, 100)}%` }}
                      ></div>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Industry average: $0.35
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <h3 className="font-medium mb-2">Top Traffic Sources</h3>
                    {trafficSources.length > 0 ? (
                      <ul className="space-y-2">
                        {trafficSources.map((source, index) => (
                          <li key={index} className="flex items-center justify-between">
                            <span>{source.name}</span>
                            <span className="text-sm text-muted-foreground">{source.percent}%</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-sm text-muted-foreground">No traffic source data available</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
