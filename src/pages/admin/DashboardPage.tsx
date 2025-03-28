import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ShoppingCart, DollarSign, TrendingUp } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useAdminStats } from '@/hooks/useAdminStats';
import { useAdminHistoricalData } from '@/hooks/useAdminHistoricalData';
import { formatCurrency } from '@/lib/utils';

export function AdminDashboardPage() {
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: historicalData, isLoading: historicalLoading } = useAdminHistoricalData();

  if (statsLoading || historicalLoading) {
    return <div>Loading...</div>;
  }

  const statsData = [
    {
      title: 'Total Revenue',
      value: formatCurrency(stats?.totalRevenue || 0),
      description: `${stats?.revenueChange >= 0 ? '+' : ''}${stats?.revenueChange.toFixed(1)}% from last month`,
      icon: DollarSign,
    },
    {
      title: 'Active Affiliates',
      value: stats?.activeAffiliates.toLocaleString() || '0',
      description: `${stats?.affiliatesChange >= 0 ? '+' : ''}${stats?.affiliatesChange.toFixed(1)}% from last month`,
      icon: Users,
    },
    {
      title: 'Active Offers',
      value: stats?.activeOffers.toLocaleString() || '0',
      description: `${stats?.offersChange >= 0 ? '+' : ''}${stats?.offersChange.toFixed(1)}% from last month`,
      icon: ShoppingCart,
    },
    {
      title: 'Conversion Rate',
      value: `${stats?.conversionRate.toFixed(2)}%`,
      description: `${stats?.conversionRateChange >= 0 ? '+' : ''}${stats?.conversionRateChange.toFixed(1)}% from last month`,
      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsData.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historicalData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number, name: string) => {
                    if (name === 'Revenue') {
                      return formatCurrency(value);
                    }
                    return value.toLocaleString();
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#8884d8"
                  name="Revenue"
                />
                <Line
                  type="monotone"
                  dataKey="clicks"
                  stroke="#82ca9d"
                  name="Clicks"
                />
                <Line
                  type="monotone"
                  dataKey="conversions"
                  stroke="#ffc658"
                  name="Conversions"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 