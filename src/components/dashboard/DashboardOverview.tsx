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
import { supabase } from '@/integrations/supabase/client';

// Define explicit types to avoid excessive type instantiation
type TimeRange = '7d' | '30d' | '90d' | 'all';
type ChartData = Array<{ name: string; value: number; }>;

// Define base stats type and role-specific stats types
interface BaseStats {
  revenue: number;
  clicks: number;
  conversions: number;
  conversionRate: string;
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
  
  // Mock data for overview charts
  const mockData: ChartData = [
    { name: 'Mon', value: 400 },
    { name: 'Tue', value: 300 },
    { name: 'Wed', value: 500 },
    { name: 'Thu', value: 280 },
    { name: 'Fri', value: 590 },
    { name: 'Sat', value: 320 },
    { name: 'Sun', value: 480 }
  ];
  
  // Define more mock data for different metrics
  const mockDataImpressions: ChartData = mockData.map(item => ({ ...item, value: item.value * 2 }));
  const mockDataRevenue: ChartData = mockData.map(item => ({ ...item, value: item.value / 10 }));
  const mockDataClicks: ChartData = mockData.map(item => ({ ...item, value: item.value / 2 }));

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats', user?.id, timeRange],
    queryFn: async () => {
      if (!user) return null;
      
      // This would be replaced with actual API calls to get real data
      const range = {
        '7d': { days: 7, multiplier: 1 },
        '30d': { days: 30, multiplier: 1.5 },
        '90d': { days: 90, multiplier: 2 },
        'all': { days: 365, multiplier: 3 }
      }[timeRange];
      
      // Simulate different stats based on user role
      let roleSpecificStats: Partial<AdminStats & AdvertiserStats & AffiliateStats> = {};
      
      switch (user.role) {
        case 'admin':
          roleSpecificStats = {
            totalUsers: Math.floor(120 * range.multiplier),
            activeAffiliates: Math.floor(45 * range.multiplier),
            activeAdvertisers: Math.floor(25 * range.multiplier),
            pendingApprovals: Math.floor(8 * range.multiplier)
          };
          break;
        case 'advertiser':
          roleSpecificStats = {
            activeOffers: Math.floor(12 * range.multiplier),
            totalAffiliates: Math.floor(30 * range.multiplier),
            pendingAffiliates: Math.floor(5 * range.multiplier),
            averageConversion: (2.8 * range.multiplier).toFixed(1) + '%'
          };
          break;
        case 'affiliate':
          roleSpecificStats = {
            approvedOffers: Math.floor(18 * range.multiplier),
            activeLinks: Math.floor(36 * range.multiplier),
            averageCTR: (3.4 * range.multiplier).toFixed(1) + '%',
            pendingCommissions: Math.floor(150 * range.multiplier)
          };
          break;
      }
      
      const baseStats: BaseStats = {
        revenue: Math.floor(1200 * range.multiplier),
        clicks: Math.floor(5400 * range.multiplier),
        conversions: Math.floor(120 * range.multiplier),
        conversionRate: (2.2 * range.multiplier).toFixed(1) + '%'
      };
      
      // Return combined stats
      return {
        ...baseStats,
        ...roleSpecificStats
      } as DashboardStats;
    },
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
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={mockData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" />
                <YAxis />
                <CartesianGrid strokeDasharray="3 3" />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#8884d8" 
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Clicks & Conversions</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mockData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Clicks" fill="#8884d8" />
                <Bar dataKey="value" name="Conversions" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
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
