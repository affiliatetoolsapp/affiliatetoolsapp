
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

// Helper function to generate random data for demo
const generateRandomData = (days: number) => {
  const data = [];
  const now = new Date();
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      clicks: Math.floor(Math.random() * 100) + 50,
      conversions: Math.floor(Math.random() * 20) + 5,
      earnings: (Math.random() * 100 + 20).toFixed(2),
    });
  }
  return data;
};

// Helper function to generate pie chart data
const generatePieData = () => [
  { name: 'Finance', value: 35, color: '#8884d8' },
  { name: 'Health', value: 25, color: '#82ca9d' },
  { name: 'Gaming', value: 20, color: '#ffc658' },
  { name: 'Education', value: 15, color: '#ff8042' },
  { name: 'Other', value: 5, color: '#0088fe' },
];

export default function AffiliatePerformance() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');
  
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['affiliate-stats', user?.id, dateRange],
    queryFn: async () => {
      // In a real app, fetch actual data from Supabase
      // For now, return mock data
      return {
        summary: {
          clicks: 2843,
          conversions: 147,
          earnings: 1243.78,
          conversionRate: 5.17,
          epc: 0.44,
        },
        dailyData: generateRandomData(dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90),
        categoryData: generatePieData(),
      };
    },
    enabled: !!user && user.role === 'affiliate',
  });
  
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
      
      {statsLoading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Clicks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.summary.clicks.toLocaleString()}</div>
                <div className="mt-1 flex items-center text-xs text-muted-foreground">
                  <div className="text-emerald-500 rounded-md px-1">+12.5%</div>
                  <div className="ml-1">vs. previous period</div>
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
                <div className="text-2xl font-bold">{stats.summary.conversions.toLocaleString()}</div>
                <div className="mt-1 flex items-center text-xs text-muted-foreground">
                  <div className="text-emerald-500 rounded-md px-1">+8.3%</div>
                  <div className="ml-1">vs. previous period</div>
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
                <div className="text-2xl font-bold">${stats.summary.earnings.toLocaleString()}</div>
                <div className="mt-1 flex items-center text-xs text-muted-foreground">
                  <div className="text-emerald-500 rounded-md px-1">+15.2%</div>
                  <div className="ml-1">vs. previous period</div>
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
                    <RechartsBarChart data={stats.dailyData}>
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
                    <RechartsLineChart data={stats.dailyData}>
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
                    <RechartsLineChart data={stats.dailyData}>
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
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={stats.categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {stats.categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
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
                      <div className="text-sm text-muted-foreground">{stats.summary.conversionRate}%</div>
                    </div>
                    <div className="h-2 bg-muted rounded overflow-hidden">
                      <div 
                        className="h-full bg-primary" 
                        style={{ width: `${Math.min(stats.summary.conversionRate * 5, 100)}%` }}
                      ></div>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Industry average: 3.2%
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-sm font-medium">EPC (Earnings Per Click)</div>
                      <div className="text-sm text-muted-foreground">${stats.summary.epc}</div>
                    </div>
                    <div className="h-2 bg-muted rounded overflow-hidden">
                      <div 
                        className="h-full bg-primary" 
                        style={{ width: `${Math.min(stats.summary.epc * 100, 100)}%` }}
                      ></div>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Industry average: $0.35
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <h3 className="font-medium mb-2">Top Traffic Sources</h3>
                    <ul className="space-y-2">
                      <li className="flex items-center justify-between">
                        <span>Google</span>
                        <span className="text-sm text-muted-foreground">35%</span>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>Facebook</span>
                        <span className="text-sm text-muted-foreground">28%</span>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>Direct</span>
                        <span className="text-sm text-muted-foreground">22%</span>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>Email</span>
                        <span className="text-sm text-muted-foreground">15%</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Performance data not available</p>
        </Card>
      )}
    </div>
  );
}
