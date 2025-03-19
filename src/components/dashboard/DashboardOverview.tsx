import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  AreaChart, 
  Area, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, DollarSign, Users, LineChart, Clock } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase, getAdvertiserDashboardStats } from '@/integrations/supabase/client';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';

// Define explicit types to avoid excessive type instantiation
type TimeRange = '7d' | '30d' | '90d' | 'all';
type ChartData = Array<{ name: string; clicks: number; conversions: number; revenue: number; }>;

// Define base stats type and role-specific stats types
interface BaseStats {
  revenue: number;
  clicks: number;
  conversions: number;
  conversionRate: string;
  chartData: ChartData;
}

interface AdminStats extends BaseStats {
  totalUsers: number;
  activeAffiliates: number;
  activeAdvertisers: number;
  pendingApprovals: number;
}

interface AdvertiserStats extends BaseStats {
  activeOffers: number;
  totalAffiliates: number;
  pendingAffiliates: number;
  averageConversion: string;
}

interface AffiliateStats extends BaseStats {
  approvedOffers: number;
  activeLinks: number;
  averageCTR: string;
  pendingCommissions: number;
}

// Combined type for all possible stats
type DashboardStats = BaseStats & Partial<AdminStats & AdvertiserStats & AffiliateStats>;

export default function DashboardOverview() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  
  // Function to get real data based on user role
  const fetchDashboardData = async (): Promise<DashboardStats> => {
    if (!user) throw new Error('User not authenticated');
    
    // For advertisers, we can now use our dedicated function
    if (user.role === 'advertiser') {
      return getAdvertiserDashboardStats(user.id, timeRange);
    }
    
    // For affiliates, admins, and fallback, we'll use a similar approach 
    // (but will keep mock data for now)
    
    // First get time range boundaries
    const now = new Date();
    let startDate = new Date();
    
    switch(timeRange) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case 'all':
        startDate = new Date(2000, 0, 1); // Far in the past
        break;
    }
    
    const isoStartDate = startDate.toISOString();
    
    // Generate chart data
    const mockChartData = generateMockChartData(timeRange);
    
    if (user.role === 'affiliate') {
      // Get affiliate's tracking links
      const { data: trackingLinks } = await supabase
        .from('tracking_links')
        .select('id, tracking_code')
        .eq('affiliate_id', user.id);
      
      const trackingCodes = trackingLinks?.map(link => link.tracking_code) || [];
      
      // Get clicks for this affiliate
      const { data: clicks } = await supabase
        .from('clicks')
        .select('id, created_at')
        .eq('affiliate_id', user.id)
        .gte('created_at', isoStartDate);
      
      // Get conversions
      const { data: conversions } = await supabase
        .from('conversions')
        .select('id, revenue, created_at')
        .gte('created_at', isoStartDate);
      
      // Get approved offers
      const { data: affiliateOffers } = await supabase
        .from('affiliate_offers')
        .select('id, offer_id')
        .eq('affiliate_id', user.id)
        .eq('status', 'approved');
      
      // Get wallet info
      const { data: wallet } = await supabase
        .from('wallets')
        .select('pending')
        .eq('user_id', user.id)
        .single();
      
      return {
        revenue: Math.floor((conversions?.reduce((sum, conv) => sum + (conv.revenue || 0), 0) || 0)),
        clicks: clicks?.length || 0,
        conversions: conversions?.length || 0,
        conversionRate: clicks?.length ? 
          ((conversions?.length || 0) / clicks.length * 100).toFixed(1) + '%' : '0.0%',
        approvedOffers: affiliateOffers?.length || 0,
        activeLinks: trackingLinks?.length || 0,
        averageCTR: '3.5%', // We would need more data to calculate this properly
        pendingCommissions: wallet?.pending || 0,
        chartData: mockChartData
      };
    } else if (user.role === 'admin') {
      // Admin stats - for now using mock data
      // In a real implementation, we would query for all users, offers, etc.
      return {
        revenue: 12500,
        clicks: 48750,
        conversions: 975,
        conversionRate: '2.0%',
        totalUsers: 250,
        activeAffiliates: 150,
        activeAdvertisers: 75,
        pendingApprovals: 12,
        chartData: mockChartData
      };
    }
    
    // Fallback to mock data if we can't determine the user role
    return {
      revenue: 0,
      clicks: 0,
      conversions: 0,
      conversionRate: '0.0%',
      chartData: mockChartData
    };
  };
  
  function generateMockChartData(timeRange: TimeRange): ChartData {
    const daysToGenerate = timeRange === '7d' ? 7 : 
                          timeRange === '30d' ? 30 : 
                          timeRange === '90d' ? 90 : 365;
    
    const result: ChartData = [];
    const now = new Date();
    
    for (let i = daysToGenerate - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      const day = date.getDate();
      const month = date.getMonth() + 1;
      
      result.push({
        name: `${month}/${day}`,
        clicks: Math.floor(Math.random() * 100) + 50,
        conversions: Math.floor(Math.random() * 10) + 1,
        revenue: Math.floor(Math.random() * 200) + 50
      });
    }
    
    return result;
  }

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats', user?.id, timeRange],
    queryFn: fetchDashboardData,
    enabled: !!user
  });

  if (isLoading || !stats) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-10 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Chart configuration
  const chartConfig = {
    clicks: {
      label: 'Clicks',
      theme: {
        light: '#8884d8',
        dark: '#8884d8'
      }
    },
    conversions: {
      label: 'Conversions',
      theme: {
        light: '#82ca9d',
        dark: '#82ca9d'
      }
    },
    revenue: {
      label: 'Revenue',
      theme: {
        light: '#ffc658',
        dark: '#ffc658'
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Dashboard Overview</h2>
        <Select value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {/* Revenue/Earnings Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {user.role === 'affiliate' ? 'Earnings' : 'Revenue'}
                </p>
                <h3 className="text-2xl font-bold">${stats.revenue}</h3>
              </div>
              <div className="p-2 bg-green-100 rounded-full text-green-600">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-center text-sm text-green-600 mt-2">
              <ArrowUpRight className="h-4 w-4 mr-1" />
              <span>12% from last {timeRange === '7d' ? 'week' : 'month'}</span>
            </div>
          </CardContent>
        </Card>
  
        {/* Clicks Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Clicks</p>
                <h3 className="text-2xl font-bold">{stats.clicks.toLocaleString()}</h3>
              </div>
              <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-center text-sm text-green-600 mt-2">
              <ArrowUpRight className="h-4 w-4 mr-1" />
              <span>8% from last {timeRange === '7d' ? 'week' : 'month'}</span>
            </div>
          </CardContent>
        </Card>
  
        {/* Conversions Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Conversions</p>
                <h3 className="text-2xl font-bold">{stats.conversions.toLocaleString()}</h3>
              </div>
              <div className="p-2 bg-purple-100 rounded-full text-purple-600">
                <LineChart className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-center text-sm text-red-600 mt-2">
              <ArrowDownRight className="h-4 w-4 mr-1" />
              <span>3% from last {timeRange === '7d' ? 'week' : 'month'}</span>
            </div>
          </CardContent>
        </Card>
  
        {/* Conversion Rate Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
                <h3 className="text-2xl font-bold">{stats.conversionRate}</h3>
              </div>
              <div className="p-2 bg-yellow-100 rounded-full text-yellow-600">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-center text-sm text-green-600 mt-2">
              <ArrowUpRight className="h-4 w-4 mr-1" />
              <span>5% from last {timeRange === '7d' ? 'week' : 'month'}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Performance Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <AreaChart data={stats.chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ffc658" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ffc658" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" />
                <YAxis />
                <CartesianGrid strokeDasharray="3 3" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#ffc658" 
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Clicks & Conversions</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <BarChart data={stats.chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Bar dataKey="clicks" name="Clicks" fill="#8884d8" />
                <Bar dataKey="conversions" name="Conversions" fill="#82ca9d" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
      
      {/* Role-specific stats */}
      {user.role === 'admin' && (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm font-medium text-muted-foreground">Total Users</p>
              <h3 className="text-2xl font-bold">{stats.totalUsers}</h3>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm font-medium text-muted-foreground">Active Affiliates</p>
              <h3 className="text-2xl font-bold">{stats.activeAffiliates}</h3>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm font-medium text-muted-foreground">Active Advertisers</p>
              <h3 className="text-2xl font-bold">{stats.activeAdvertisers}</h3>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm font-medium text-muted-foreground">Pending Approvals</p>
              <h3 className="text-2xl font-bold">{stats.pendingApprovals}</h3>
            </CardContent>
          </Card>
        </div>
      )}
      
      {user.role === 'advertiser' && (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm font-medium text-muted-foreground">Active Offers</p>
              <h3 className="text-2xl font-bold">{stats.activeOffers}</h3>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm font-medium text-muted-foreground">Total Affiliates</p>
              <h3 className="text-2xl font-bold">{stats.totalAffiliates}</h3>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm font-medium text-muted-foreground">Pending Affiliates</p>
              <h3 className="text-2xl font-bold">{stats.pendingAffiliates}</h3>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm font-medium text-muted-foreground">Average Conversion</p>
              <h3 className="text-2xl font-bold">{stats.averageConversion}</h3>
            </CardContent>
          </Card>
        </div>
      )}
      
      {user.role === 'affiliate' && (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm font-medium text-muted-foreground">Approved Offers</p>
              <h3 className="text-2xl font-bold">{stats.approvedOffers}</h3>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm font-medium text-muted-foreground">Active Links</p>
              <h3 className="text-2xl font-bold">{stats.activeLinks}</h3>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm font-medium text-muted-foreground">Average CTR</p>
              <h3 className="text-2xl font-bold">{stats.averageCTR}</h3>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm font-medium text-muted-foreground">Pending Commissions</p>
              <h3 className="text-2xl font-bold">${stats.pendingCommissions}</h3>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
