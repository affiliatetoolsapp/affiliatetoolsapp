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

const data = [
  { name: 'Jan', revenue: 4000, clicks: 2400, conversions: 240 },
  { name: 'Feb', revenue: 3000, clicks: 1398, conversions: 139 },
  { name: 'Mar', revenue: 2000, clicks: 9800, conversions: 980 },
  { name: 'Apr', revenue: 2780, clicks: 3908, conversions: 390 },
  { name: 'May', revenue: 1890, clicks: 4800, conversions: 480 },
  { name: 'Jun', revenue: 2390, clicks: 3800, conversions: 380 },
];

const stats = [
  {
    title: 'Total Revenue',
    value: '$45,231.89',
    description: '+20.1% from last month',
    icon: DollarSign,
  },
  {
    title: 'Active Affiliates',
    value: '2,350',
    description: '+180.1% from last month',
    icon: Users,
  },
  {
    title: 'Active Offers',
    value: '1,234',
    description: '+19% from last month',
    icon: ShoppingCart,
  },
  {
    title: 'Conversion Rate',
    value: '12.57%',
    description: '+4.3% from last month',
    icon: TrendingUp,
  },
];

export function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
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
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
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