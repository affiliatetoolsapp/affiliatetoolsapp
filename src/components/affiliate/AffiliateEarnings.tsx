
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
import { DownloadIcon, FilterIcon } from "lucide-react";
import { format } from 'date-fns';

export default function AffiliateEarnings() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved'>('all');
  
  // Get affiliate's conversions
  const { data: conversions, isLoading: conversionsLoading } = useQuery({
    queryKey: ['affiliate-conversions', user?.id, dateRange, statusFilter],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      try {
        // In a real app, you would fetch actual data from Supabase
        // This is a mock implementation
        
        // Simulated delay
        await new Promise((resolve) => setTimeout(resolve, 1000));
        
        // Generate mock conversion data
        const mockConversions = Array.from({ length: 35 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - Math.floor(Math.random() * 30));
          
          const offerNames = ['Crypto Offer', 'Health Supplements', 'SaaS Tool', 'Mobile App', 'Investment Platform'];
          const offerName = offerNames[Math.floor(Math.random() * offerNames.length)];
          
          const eventTypes = ['lead', 'sale', 'action', 'deposit'];
          const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
          
          const statuses = ['pending', 'approved', 'rejected'];
          const statusWeights = [0.3, 0.6, 0.1]; // 30% pending, 60% approved, 10% rejected
          let status;
          const rand = Math.random();
          if (rand < statusWeights[0]) status = statuses[0];
          else if (rand < statusWeights[0] + statusWeights[1]) status = statuses[1];
          else status = statuses[2];
          
          return {
            id: `conv-${i}`,
            date: format(date, 'yyyy-MM-dd'),
            offerId: `offer-${Math.floor(Math.random() * 10) + 1}`,
            offerName,
            eventType,
            commission: (Math.random() * 50 + 5).toFixed(2),
            status
          };
        });
        
        // Filter by date range
        let filteredConversions = [...mockConversions];
        if (dateRange !== 'all') {
          const daysToFilter = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - daysToFilter);
          
          filteredConversions = filteredConversions.filter(conv => {
            const convDate = new Date(conv.date);
            return convDate >= cutoffDate;
          });
        }
        
        // Filter by status
        if (statusFilter !== 'all') {
          filteredConversions = filteredConversions.filter(conv => conv.status === statusFilter);
        }
        
        // Sort by date (newest first)
        filteredConversions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        // Calculate summary
        const totalEarnings = filteredConversions.reduce((sum, conv) => {
          if (conv.status !== 'rejected') {
            return sum + parseFloat(conv.commission);
          }
          return sum;
        }, 0);
        
        const approvedEarnings = filteredConversions.reduce((sum, conv) => {
          if (conv.status === 'approved') {
            return sum + parseFloat(conv.commission);
          }
          return sum;
        }, 0);
        
        const pendingEarnings = filteredConversions.reduce((sum, conv) => {
          if (conv.status === 'pending') {
            return sum + parseFloat(conv.commission);
          }
          return sum;
        }, 0);
        
        // Group by event type
        const eventTypeCounts = filteredConversions.reduce((acc, conv) => {
          acc[conv.eventType] = (acc[conv.eventType] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        return {
          conversions: filteredConversions,
          summary: {
            total: totalEarnings.toFixed(2),
            approved: approvedEarnings.toFixed(2),
            pending: pendingEarnings.toFixed(2),
            eventTypeCounts
          }
        };
      } catch (error) {
        console.error('Error fetching conversions:', error);
        throw error;
      }
    },
    enabled: !!user && user.role === 'affiliate',
  });
  
  // Get offers for filtering
  const { data: offers } = useQuery({
    queryKey: ['affiliate-offers', user?.id],
    queryFn: async () => {
      // Mock implementation
      return [
        { id: 'offer-1', name: 'Crypto Offer' },
        { id: 'offer-2', name: 'Health Supplements' },
        { id: 'offer-3', name: 'SaaS Tool' },
        { id: 'offer-4', name: 'Mobile App' },
        { id: 'offer-5', name: 'Investment Platform' },
      ];
    },
    enabled: !!user && user.role === 'affiliate',
  });
  
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return "bg-yellow-100 text-yellow-800";
      case 'approved':
        return "bg-green-100 text-green-800";
      case 'rejected':
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'lead':
        return "Lead";
      case 'sale':
        return "Sale";
      case 'action':
        return "Action";
      case 'deposit':
        return "Deposit";
      default:
        return type;
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Earnings</h1>
          <p className="text-muted-foreground">
            Track and manage your commission earnings
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={(value: '7d' | '30d' | '90d' | 'all') => setDateRange(value)}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline">
            <DownloadIcon className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>
      
      {conversionsLoading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : conversions ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Earnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${conversions.summary.total}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Pending + Approved
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Approved Earnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${conversions.summary.approved}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Ready for payout
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Earnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${conversions.summary.pending}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Awaiting approval
                </p>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between">
                <div>
                  <CardTitle>Earnings History</CardTitle>
                  <CardDescription>
                    Track your conversions and commissions
                  </CardDescription>
                </div>
                
                <div className="flex items-center gap-2 mt-4 sm:mt-0">
                  <Select value={statusFilter} onValueChange={(value: 'all' | 'pending' | 'approved') => setStatusFilter(value)}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="Status Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {conversions.conversions.length > 0 ? (
                <div className="rounded-md border">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="p-3 text-left font-medium">Date</th>
                          <th className="p-3 text-left font-medium">Offer</th>
                          <th className="p-3 text-left font-medium">Event Type</th>
                          <th className="p-3 text-left font-medium">Commission</th>
                          <th className="p-3 text-left font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {conversions.conversions.map((conv) => (
                          <tr key={conv.id} className="border-b hover:bg-muted/50">
                            <td className="p-3">{conv.date}</td>
                            <td className="p-3">{conv.offerName}</td>
                            <td className="p-3">{getEventTypeLabel(conv.eventType)}</td>
                            <td className="p-3">${conv.commission}</td>
                            <td className="p-3">
                              <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(conv.status)}`}>
                                {conv.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 border rounded-md">
                  <p className="text-muted-foreground">No earnings data found for the selected filters</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Event Type Breakdown</CardTitle>
              <CardDescription>
                Conversion types in the selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(conversions.summary.eventTypeCounts).map(([type, count]) => (
                  <div key={type}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-sm font-medium">{getEventTypeLabel(type)}</div>
                      <div className="text-sm text-muted-foreground">{count} conversions</div>
                    </div>
                    <div className="h-2 bg-muted rounded overflow-hidden">
                      <div 
                        className="h-full bg-primary" 
                        style={{ 
                          width: `${Math.round((count / conversions.conversions.length) * 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Earnings data not available</p>
        </Card>
      )}
    </div>
  );
}
