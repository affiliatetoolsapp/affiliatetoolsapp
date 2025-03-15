
import { useState } from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface ReportFiltersProps {
  dateRange: string;
  setDateRange: (value: string) => void;
  selectedType: string;
  setSelectedType: (value: string) => void;
  refetchData: () => void;
}

export function ReportFilters({
  dateRange,
  setDateRange,
  selectedType,
  setSelectedType,
  refetchData
}: ReportFiltersProps) {
  const refreshData = () => {
    refetchData();
    toast.info('Refreshing data...');
  };

  return (
    <div className="flex flex-wrap gap-4 items-center justify-between">
      <div className="flex flex-wrap gap-2">
        <Select
          value={dateRange}
          onValueChange={setDateRange}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Date Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
        
        <Select
          value={selectedType}
          onValueChange={setSelectedType}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Event Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            <SelectItem value="lead">Leads</SelectItem>
            <SelectItem value="sale">Sales</SelectItem>
            <SelectItem value="action">Actions</SelectItem>
            <SelectItem value="deposit">Deposits</SelectItem>
          </SelectContent>
        </Select>
        
        <Button 
          variant="outline" 
          size="icon"
          onClick={refreshData}
          title="Refresh data"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
