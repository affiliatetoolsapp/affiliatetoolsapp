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
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase, getAdvertiserDashboardStats } from '@/integrations/supabase/client';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';
import { getCountryFilterOptions } from '@/components/affiliate/utils/offerUtils';
import type { Database } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format, subDays, startOfDay, endOfDay, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, subWeeks } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

// Define explicit types to avoid excessive type instantiation
type TimeRange = 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'custom';
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

interface DateRange {
  from: Date;
  to: Date;
}

// Add type definitions for database rows
type Tables = Database['public']['Tables'];
type TrackingLink = Tables['tracking_links']['Row'];
type Click = Tables['clicks']['Row'];
type Conversion = Tables['conversions']['Row'];

export default function DashboardOverview() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<TimeRange>('today');
  const [selectedOffer, setSelectedOffer] = useState<string>('all');
  const [selectedGeo, setSelectedGeo] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfDay(new Date()),
    to: endOfDay(new Date())
  });
  const [offers, setOffers] = useState<Array<{ id: string; name: string }>>([]);
  const [countries, setCountries] = useState<Array<{ value: string; label: string }>>([]);
  
  // Calculate date range based on selected time period
  const getDateRange = () => {
    const now = new Date();
    switch (timeRange) {
      case 'today':
        return {
          from: startOfDay(now),
          to: endOfDay(now)
        };
      case 'yesterday':
        const yesterday = subDays(now, 1);
        return {
          from: startOfDay(yesterday),
          to: endOfDay(yesterday)
        };
      case 'this_week':
        return {
          from: startOfWeek(now),
          to: endOfWeek(now)
        };
      case 'last_week':
        const lastWeek = subWeeks(now, 1);
        return {
          from: startOfWeek(lastWeek),
          to: endOfWeek(lastWeek)
        };
      case 'this_month':
        return {
          from: startOfMonth(now),
          to: endOfMonth(now)
        };
      case 'last_month':
        const lastMonth = subMonths(now, 1);
        return {
          from: startOfMonth(lastMonth),
          to: endOfMonth(lastMonth)
        };
      case 'custom':
        return dateRange;
      default:
        return {
          from: startOfDay(now),
          to: endOfDay(now)
        };
    }
  };

  // Update date range when time range changes
  useEffect(() => {
    if (timeRange !== 'custom') {
      setDateRange(getDateRange());
    }
  }, [timeRange]);

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  // Fetch offers for the current user
  useEffect(() => {
    const fetchOffers = async () => {
      if (!user) return;
      
      try {
        let { data } = await (user.role === 'advertiser' 
          ? supabase
              .from('offers')
              .select('id, name')
              .eq('advertiser_id', user.id)
          : supabase
              .from('offers')
              .select(`
                id,
                name,
                affiliate_offers!inner (
                  affiliate_id,
                  status
                )
              `)
              .eq('affiliate_offers.affiliate_id', user.id)
              .eq('affiliate_offers.status', 'approved')
        );

        if (data) {
          setOffers([{ id: 'all', name: 'All Offers' }, ...data]);
        }
      } catch (error) {
        console.error('Error fetching offers:', error);
      }
    };
    
    fetchOffers();
  }, [user]);
  
  // Fetch countries from clicks data
  useEffect(() => {
    const fetchCountries = async () => {
      if (!user) return;
      
      try {
        let query = supabase
          .from('clicks')
          .select(`
            geo,
            offers!inner(*)
          `)
          .not('geo', 'is', null);

        if (user.role === 'advertiser') {
          // For advertisers, filter by their offers
          query = query.eq('offers.advertiser_id', user.id);
        } else {
          // For affiliates, filter by their ID
          query = query.eq('affiliate_id', user.id);
        }

        const { data, error } = await query;
        
        if (error) {
          console.error('Error fetching countries:', error);
          return;
        }
        
        if (data) {
          // Get unique countries and sort them
          const uniqueCountries = [...new Set(data.map(click => click.geo).filter(Boolean))].sort();
          
          // Get country options with flags and labels
          const countryOptions = [
            { value: 'all', label: 'All Countries' },
            ...uniqueCountries.map(geo => {
              const option = getCountryFilterOptions().find(opt => opt.value.toLowerCase() === geo.toLowerCase());
              return {
                value: geo,
                label: option ? option.label : geo
              };
            })
          ];
          
          setCountries(countryOptions);
        }
      } catch (error) {
        console.error('Error fetching countries:', error);
      }
    };
    
    fetchCountries();
  }, [user]);
  
  // Function to get real data based on user role
  const fetchDashboardData = async (): Promise<DashboardStats> => {
    if (!user) throw new Error('User not authenticated');
    
    if (user.role === 'advertiser') {
      const stats = await getAdvertiserDashboardStats(user.id, timeRange, selectedOffer, selectedGeo);
      return stats;
    }
    
    const isoStartDate = dateRange.from.toISOString();
    const isoEndDate = dateRange.to.toISOString();
    
    if (user.role === 'affiliate') {
      try {
        const { data: trackingLinks } = await supabase
          .from('tracking_links')
          .select('id, tracking_code, offer_id')
          .eq('affiliate_id', user.id)
          .eq(selectedOffer !== 'all' ? 'offer_id' : 'affiliate_id', selectedOffer !== 'all' ? selectedOffer : user.id)
          .returns<TrackingLink[]>();
        
        let clicksQuery = supabase
          .from('clicks')
          .select('id, created_at, geo')
          .eq('affiliate_id', user.id)
          .gte('created_at', isoStartDate)
          .lte('created_at', isoEndDate);

        if (selectedGeo !== 'all') {
          clicksQuery = clicksQuery.eq('geo', selectedGeo);
        }

        const { data: clicks } = await clicksQuery.returns<Click[]>();
        
        let conversionsQuery = supabase
          .from('conversions')
          .select('id, revenue, created_at, click_id')
          .gte('created_at', isoStartDate)
          .lte('created_at', isoEndDate);

        if (selectedOffer !== 'all') {
          conversionsQuery = conversionsQuery.eq('offer_id', selectedOffer);
        }

        const { data: conversions } = await conversionsQuery.returns<Conversion[]>();
        
        // Process data for chart
        const dates = clicks?.map(c => format(new Date(c.created_at), 'MM/dd/yyyy')) || [];
        const uniqueDates = [...new Set(dates)];
        
        const chartData = uniqueDates.map(date => {
          const dayClicks = clicks?.filter(c => format(new Date(c.created_at), 'MM/dd/yyyy') === date).length || 0;
          const dayConversions = conversions?.filter(c => format(new Date(c.created_at), 'MM/dd/yyyy') === date).length || 0;
          const dayRevenue = conversions?.filter(c => format(new Date(c.created_at), 'MM/dd/yyyy') === date)
            .reduce((sum, conv) => sum + (conv.revenue || 0), 0) || 0;
          
          return {
            name: date,
            clicks: dayClicks,
            conversions: dayConversions,
            revenue: dayRevenue
          };
        });
        
        return {
          revenue: Math.floor((conversions?.reduce((sum, conv) => sum + (conv.revenue || 0), 0) || 0)),
          clicks: clicks?.length || 0,
          conversions: conversions?.length || 0,
          conversionRate: clicks?.length ? 
            ((conversions?.length || 0) / clicks.length * 100).toFixed(1) + '%' : '0.0%',
          approvedOffers: trackingLinks?.length || 0,
          activeLinks: trackingLinks?.length || 0,
          averageCTR: '3.5%',
          pendingCommissions: 0,
          chartData
        };
      } catch (error) {
        console.error('Error fetching affiliate data:', error);
        throw error;
      }
    }
    
    return generateMockChartData();
  };
  
  function generateMockChartData(): DashboardStats {
    const start = dateRange.from;
    const end = dateRange.to;
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    const result: DashboardStats = {
      revenue: 0,
      clicks: 0,
      conversions: 0,
      conversionRate: '0.0%',
      chartData: [],
      approvedOffers: 0,
      activeLinks: 0,
      averageCTR: '0.0%',
      pendingCommissions: 0
    };
    
    for (let i = 0; i < daysDiff; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      
      const day = date.getDate();
      const month = date.getMonth() + 1;
      
      result.revenue += Math.floor(Math.random() * 200) + 50;
      result.clicks += Math.floor(Math.random() * 100) + 50;
      result.conversions += Math.floor(Math.random() * 10) + 1;
      
      result.chartData.push({
        name: `${month}/${day}`,
        clicks: Math.floor(Math.random() * 100) + 50,
        conversions: Math.floor(Math.random() * 10) + 1,
        revenue: Math.floor(Math.random() * 200) + 50
      });
    }
    
    result.conversionRate = result.clicks ? 
      ((result.conversions || 0) / result.clicks * 100).toFixed(1) + '%' : '0.0%';
    
    return result;
  }

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats', user?.id, timeRange, selectedOffer, selectedGeo],
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold">Performance Reports</h2>
        <p className="text-muted-foreground">Track your offer performance and earnings</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full">
        {user.role !== 'admin' && (
          <>
            <Select value={selectedOffer} onValueChange={setSelectedOffer}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Offers" />
              </SelectTrigger>
              <SelectContent>
                {offers.map(offer => (
                  <SelectItem key={offer.id} value={offer.id}>
                    {offer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedGeo} onValueChange={setSelectedGeo}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Countries" />
              </SelectTrigger>
              <SelectContent>
                {countries.map(country => (
                  <SelectItem key={country.value} value={country.value}>
                    {country.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}
        
        <Select value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Today" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="yesterday">Yesterday</SelectItem>
            <SelectItem value="this_week">This Week</SelectItem>
            <SelectItem value="last_week">Last Week</SelectItem>
            <SelectItem value="this_month">This Month</SelectItem>
            <SelectItem value="last_month">Last Month</SelectItem>
            <SelectItem value="custom">Custom Range</SelectItem>
          </SelectContent>
        </Select>

        {timeRange === 'custom' && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[280px] justify-start text-left font-normal",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={{ 
                  from: dateRange?.from, 
                  to: dateRange?.to 
                }}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    setDateRange({
                      from: startOfDay(range.from),
                      to: endOfDay(range.to)
                    });
                  }
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        )}
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
              <span>12% from last {timeRange === 'last_week' ? 'week' : 'month'}</span>
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
              <span>8% from last {timeRange === 'last_week' ? 'week' : 'month'}</span>
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
              <span>3% from last {timeRange === 'last_week' ? 'week' : 'month'}</span>
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
              <span>5% from last {timeRange === 'last_week' ? 'week' : 'month'}</span>
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
