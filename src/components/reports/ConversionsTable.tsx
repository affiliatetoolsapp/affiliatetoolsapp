
import { DataTable } from '@/components/ui/data-table';
import type { ColumnDef } from '@tanstack/react-table';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { DownloadIcon } from 'lucide-react';

interface ConversionsTableProps {
  conversions: any[] | undefined;
  isLoading: boolean;
  exportToCSV: (dataType: 'clicks' | 'conversions') => void;
}

export function ConversionsTable({ conversions, isLoading, exportToCSV }: ConversionsTableProps) {
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

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => exportToCSV('conversions')}
          disabled={!conversions || conversions.length === 0}
        >
          <DownloadIcon className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>
      <DataTable
        columns={conversionColumns}
        data={conversions || []}
        isLoading={isLoading}
        emptyMessage="No conversion data for the selected period"
      />
    </div>
  );
}
