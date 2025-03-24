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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
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
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, subWeeks } from 'date-fns';
import { DataTable } from '@/components/ui/data-table';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';

export default function ReportsPage() {
  const { user } = useAuth();
  const [selectedOffer, setSelectedOffer] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('today');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfDay(new Date()),
    to: endOfDay(new Date())
  });
  const [groupBy, setGroupBy] = useState('daily');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedGeo, setSelectedGeo] = useState<string>('all');
  
  const isAdvertiser = user?.role === 'advertiser';

  // Query to get approved offers
  const { data: approvedOffers } = useQuery({
    queryKey: ['approved-offers', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('affiliate_offers')
        .select(`
          offer_id,
          offers (
            id,
            name
          )
        `)
        .eq('affiliate_id', user.id)
        .eq('status', 'approved');
        
      if (error) {
        console.error('Error fetching approved offers:', error);
        return [];
      }
      
      return data || [];
    },
    enabled: !!user && !isAdvertiser,
  });

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

  const currentDateRange = getDateRange();
  
  // Get clicks with offer filtering
  const { data: clicks, isLoading: isLoadingClicks } = useQuery({
    queryKey: ['report-clicks', user?.id, selectedOffer, selectedGeo, timeRange, dateRange],
    queryFn: async () => {
      if (!user) return [];
      
      try {
        let query = supabase
          .from('clicks')
          .select(`
            *,
            offers!inner(*)
          `)
          .gte('created_at', currentDateRange.from.toISOString())
          .lte('created_at', currentDateRange.to.toISOString());

        if (isAdvertiser) {
          // For advertisers, filter by their offers
          query = query.eq('offers.advertiser_id', user.id);
        } else {
          // For affiliates, filter by their ID
          query = query.eq('affiliate_id', user.id);
        }

        if (selectedOffer !== 'all') {
          query = query.eq('offer_id', selectedOffer);
        }

        if (selectedGeo !== 'all') {
          query = query.eq('geo', selectedGeo);
        }

        const { data, error } = await query;
        
        if (error) {
          console.error('Error fetching clicks:', error);
          toast.error(`Error fetching clicks: ${error.message}`);
          return [];
        }
        
        return data || [];
      } catch (error) {
        console.error('Error processing clicks:', error);
        toast.error('Error loading click data');
        return [];
      }
    },
    enabled: !!user,
  });

  // Get conversions with offer filtering
  const { data: conversions, isLoading: isLoadingConversions } = useQuery({
    queryKey: ['report-conversions', user?.id, selectedOffer, selectedGeo, timeRange, dateRange],
    queryFn: async () => {
      if (!user) return [];
      
      try {
        let query = supabase
          .from('conversions')
          .select(`
            *,
            click:clicks!inner(
              id, click_id, affiliate_id, offer_id, 
              tracking_code, created_at, ip_address, device, geo,
              offers!inner(id, name, advertiser_id, commission_type)
            )
          `)
          .gte('created_at', currentDateRange.from.toISOString())
          .lte('created_at', currentDateRange.to.toISOString());

        if (isAdvertiser) {
          // For advertisers, filter by their offers
          query = query.eq('click.offers.advertiser_id', user.id);
        } else {
          // For affiliates, filter by their ID
          query = query.eq('click.affiliate_id', user.id);
        }

        if (selectedOffer !== 'all') {
          query = query.eq('click.offer_id', selectedOffer);
        }

        if (selectedGeo !== 'all') {
          query = query.eq('click.geo', selectedGeo);
        }

        const { data, error } = await query;
        
        if (error) {
          console.error('Error fetching conversions:', error);
          throw error;
        }
        
        return data || [];
      } catch (error) {
        console.error('Error processing conversions:', error);
        return [];
      }
    },
    enabled: !!user,
  });

  // Calculate metrics
  const totalClicks = clicks?.length || 0;
  const totalConversions = conversions?.length || 0;
  const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
  const totalRevenue = conversions?.reduce((sum, conv) => sum + (conv.revenue || 0), 0) || 0;
  const totalCommissions = conversions?.reduce((sum, conv) => sum + (conv.commission || 0), 0) || 0;

  // Calculate per day averages
  const daysDiff = Math.max(1, Math.ceil((currentDateRange.to.getTime() - currentDateRange.from.getTime()) / (1000 * 60 * 60 * 24)));
  const clicksPerDay = totalClicks / daysDiff;
  const conversionsPerDay = totalConversions / daysDiff;
  const revenuePerDay = totalRevenue / daysDiff;
  const commissionsPerDay = totalCommissions / daysDiff;

  // Define columns for clicks table
  const clickColumns: ColumnDef<any>[] = [
    {
      accessorKey: "click_id",
      header: "Click ID",
      cell: ({ row }) => (
        <div className="font-mono text-xs truncate max-w-[120px]" title={row.original.click_id}>
          {row.original.click_id?.substring(0, 8)}...
        </div>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Date & Time",
      cell: ({ row }) => (
        <div className="whitespace-nowrap">
          {row.original.created_at ? format(parseISO(row.original.created_at), "MMM dd, yyyy HH:mm") : "Unknown"}
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
        const count = 0; // We'll implement this later
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

  // Enhanced filtering options for offers
  const extractOfferData = (click: any) => {
    // This function is used for both filtering and display
    if (click?.offers) {
      return {
        id: click.offers.id,
        name: click.offers.name,
      };
    }
    return { id: null, name: "Unknown" };
  };
  
  const extractConversionOfferData = (conv: any) => {
    const clickData = conv?.click as any;
    if (clickData?.offers) {
      return {
        id: clickData.offers.id,
        name: clickData.offers.name,
      };
    }
    return { id: null, name: "Unknown" };
  };

  // Improved offer filter options
  const getOfferFilterOptions = () => {
    if (!clicks || clicks.length === 0) return [];
    
    // Create a map to store unique offers
    const uniqueOffers = new Map();
    
    // Extract offer data from clicks
    clicks.forEach(click => {
      const offer = extractOfferData(click);
      if (offer.id) {
        uniqueOffers.set(offer.id, offer.name);
      }
    });
    
    // Convert to array of options
    return Array.from(uniqueOffers.entries()).map(([value, label]) => ({
      label: String(label),
      value: String(value),
    }));
  };
  
  const getConversionOfferFilterOptions = () => {
    if (!conversions || conversions.length === 0) return [];
    
    // Create a map to store unique offers
    const uniqueOffers = new Map();
    
    // Extract offer data from conversions
    conversions.forEach(conv => {
      const offer = extractConversionOfferData(conv);
      if (offer.id) {
        uniqueOffers.set(offer.id, offer.name);
      }
    });
    
    // Convert to array of options
    return Array.from(uniqueOffers.entries()).map(([value, label]) => ({
      label: String(label),
      value: String(value),
    }));
  };

  // Country filtering options
  const getCountryFilterOptions = () => {
    if (!clicks || clicks.length === 0) return [];
    
    const uniqueCountries = new Set();
    
    clicks.forEach(click => {
      if (click.geo) {
        uniqueCountries.add(click.geo);
      }
    });
    
    return Array.from(uniqueCountries).map(country => ({
      label: String(country),
      value: String(country),
    }));
  };
  
  // Device filtering options
  const getDeviceFilterOptions = () => {
    if (!clicks || clicks.length === 0) return [];
    
    const uniqueDevices = new Set();
    
    clicks.forEach(click => {
      if (click.device) {
        uniqueDevices.add(click.device);
      }
    });
    
    return Array.from(uniqueDevices).map(device => ({
      label: String(device).charAt(0).toUpperCase() + String(device).slice(1),
      value: String(device),
    }));
  };
  
  // Event type filtering options for conversions
  const getEventTypeFilterOptions = () => {
    if (!conversions || conversions.length === 0) return [];
    
    const uniqueTypes = new Set();
    
    conversions.forEach(conv => {
      if (conv.event_type) {
        uniqueTypes.add(conv.event_type);
      }
    });
    
    return Array.from(uniqueTypes).map(type => ({
      label: String(type).charAt(0).toUpperCase() + String(type).slice(1),
      value: String(type),
    }));
  };

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
  
  // Prepare data for charts
  const prepareChartData = () => {
    if (!clicks || !conversions) return [];
    
    // Create an array of all days in the date range
    const days = eachDayOfInterval({ start: currentDateRange.from, end: currentDateRange.to });
    
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
    conversions.forEach(conv => {
      const convDate = format(parseISO(conv.created_at), 'yyyy-MM-dd');
      const dataPoint = data.find(d => d.date === convDate);
      if (dataPoint) {
        dataPoint.conversions += 1;
        dataPoint.revenue += conv.revenue || 0;
        dataPoint.commissions += conv.commission || 0;
      }
    });
    
    // Format dates for display
    return data.map(item => ({
      ...item,
      date: format(new Date(item.date), 'MMM dd'),
      revenue: parseFloat(item.revenue.toFixed(2)),
      commissions: parseFloat(item.commissions.toFixed(2)),
    }));
  };

  const chartData = prepareChartData();
  const isLoading = isLoadingClicks || isLoadingConversions;

  if (!user) return null;
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Performance Reports</h1>
        <p className="text-muted-foreground">
          Track your {isAdvertiser ? 'offer' : 'affiliate'} performance and earnings
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={selectedOffer} onValueChange={setSelectedOffer}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Select Offer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Offers</SelectItem>
            {approvedOffers?.map((offer: any) => (
              <SelectItem key={offer.offer_id} value={offer.offer_id}>
                {offer.offers.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedGeo} onValueChange={setSelectedGeo}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Select Country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Countries</SelectItem>
            {getCountryFilterOptions().map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Select Time Range" />
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
                  "w-full sm:w-[300px] justify-start text-left font-normal",
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
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
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
      
      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingClicks ? '...' : totalClicks.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingConversions ? '...' : totalConversions.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              CR: {(isLoadingClicks || isLoadingConversions) ? '...' : conversionRate.toFixed(2)}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{isAdvertiser ? 'Revenue' : 'Advertiser Revenue'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${isLoadingConversions ? '...' : totalRevenue.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{isAdvertiser ? 'Commissions Paid' : 'Your Commissions'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${isLoadingConversions ? '...' : totalCommissions.toFixed(2)}
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
                {`${format(currentDateRange.from, 'MMM dd, yyyy')} - ${format(currentDateRange.to, 'MMM dd, yyyy')}`}
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
                  {isLoadingConversions ? (
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
                        <div>{clicksPerDay.toFixed(1)}</div>
                      </div>
                      <div className="grid grid-cols-3 p-3">
                        <div>Conversions</div>
                        <div>{totalConversions}</div>
                        <div>{conversionsPerDay.toFixed(1)}</div>
                      </div>
                      <div className="grid grid-cols-3 p-3">
                        <div>Revenue</div>
                        <div>${totalRevenue.toFixed(2)}</div>
                        <div>${revenuePerDay.toFixed(2)}</div>
                      </div>
                      <div className="grid grid-cols-3 p-3">
                        <div>Commissions</div>
                        <div>${totalCommissions.toFixed(2)}</div>
                        <div>${commissionsPerDay.toFixed(2)}</div>
                      </div>
                      <div className="grid grid-cols-3 p-3">
                        <div>Conversion Rate</div>
                        <div>{conversionRate.toFixed(2)}%</div>
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
                defaultSorting={[{ id: 'created_at', desc: true }]}
                filterableColumns={[
                  {
                    id: 'offer',
                    title: 'Offer',
                    options: getOfferFilterOptions(),
                    type: 'select'
                  },
                  {
                    id: 'geo',
                    title: 'Country',
                    options: getCountryFilterOptions(),
                    type: 'select'
                  },
                  {
                    id: 'device',
                    title: 'Device',
                    options: getDeviceFilterOptions(),
                    type: 'select'
                  },
                  {
                    id: 'ip_address',
                    title: 'IP Address',
                    type: 'text'
                  }
                ]}
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
                  All conversion details for the selected period
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
                defaultSorting={[{ id: 'created_at', desc: true }]}
                filterableColumns={[
                  {
                    id: 'offer',
                    title: 'Offer',
                    options: getConversionOfferFilterOptions(),
                    type: 'select'
                  },
                  {
                    id: 'event_type',
                    title: 'Event Type',
                    options: getEventTypeFilterOptions(),
                    type: 'select'
                  },
                  {
                    id: 'status',
                    title: 'Status',
                    options: [
                      { label: 'Pending', value: 'pending' },
                      { label: 'Approved', value: 'approved' },
                      { label: 'Rejected', value: 'rejected' }
                    ],
                    type: 'select'
                  }
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
