
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useReportData } from '@/hooks/useReportData';
import { exportToCSV } from '@/utils/exportToCSV';

// Import refactored components
import { ReportFilters } from '@/components/reports/ReportFilters';
import { StatsCards } from '@/components/reports/StatsCards';
import { PerformanceChart } from '@/components/reports/PerformanceChart';
import { ConversionBreakdown } from '@/components/reports/ConversionBreakdown';
import { MetricsSummary } from '@/components/reports/MetricsSummary';
import { ClicksTable } from '@/components/reports/ClicksTable';
import { ConversionsTable } from '@/components/reports/ConversionsTable';

export default function ReportsPage() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState('7');
  const [selectedType, setSelectedType] = useState('all');
  
  const isAdvertiser = user?.role === 'advertiser';
  
  const {
    clicks,
    conversions,
    isLoading,
    chartData,
    totalClicks,
    totalConversions,
    conversionRate,
    totalRevenue,
    totalCommissions,
    startDate,
    endDate,
    refetchData
  } = useReportData(user?.id, user?.role, dateRange, selectedType);

  const handleExportToCSV = (dataType: 'clicks' | 'conversions') => {
    exportToCSV(dataType, dataType === 'clicks' ? clicks : conversions, conversions);
  };
  
  if (!user) return null;
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Performance Reports</h1>
        <p className="text-muted-foreground">
          Track your {isAdvertiser ? 'offer' : 'affiliate'} performance and earnings
        </p>
      </div>
      
      <ReportFilters
        dateRange={dateRange}
        setDateRange={setDateRange}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
        refetchData={refetchData}
      />
      
      <StatsCards
        isLoading={isLoading}
        totalClicks={totalClicks}
        totalConversions={totalConversions}
        conversionRate={conversionRate}
        totalRevenue={totalRevenue}
        totalCommissions={totalCommissions}
        isAdvertiser={isAdvertiser}
      />
      
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="clicks">Clicks</TabsTrigger>
          <TabsTrigger value="conversions">Conversions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <PerformanceChart
            isLoading={isLoading}
            chartData={chartData}
            startDate={startDate}
            endDate={endDate}
            isAdvertiser={isAdvertiser}
          />
          
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 mt-6">
            <ConversionBreakdown
              isLoading={isLoading}
              conversions={conversions}
            />
            
            <MetricsSummary
              totalClicks={totalClicks}
              totalConversions={totalConversions}
              dateRange={dateRange}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="clicks">
          <ClicksTable
            clicks={clicks}
            conversions={conversions}
            isLoading={isLoading}
            exportToCSV={handleExportToCSV}
          />
        </TabsContent>
        
        <TabsContent value="conversions">
          <ConversionsTable
            conversions={conversions}
            isLoading={isLoading}
            exportToCSV={handleExportToCSV}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
