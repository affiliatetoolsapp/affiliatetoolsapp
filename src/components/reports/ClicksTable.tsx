
import { DataTable } from '@/components/ui/data-table';
import type { ColumnDef } from '@tanstack/react-table';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { DownloadIcon } from 'lucide-react';

interface ClicksTableProps {
  clicks: any[] | undefined;
  conversions: any[] | undefined;
  isLoading: boolean;
  exportToCSV: (dataType: 'clicks' | 'conversions') => void;
}

export function ClicksTable({ clicks, conversions, isLoading, exportToCSV }: ClicksTableProps) {
  const clickColumns: ColumnDef<any>[] = [
    {
      accessorKey: "click_id",
      header: "Click ID",
      cell: ({ row }) => (
        <div className="font-mono text-xs truncate max-w-[120px]" title={row.getValue("click_id")}>
          {row.getValue("click_id").substring(0, 8)}...
        </div>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Date & Time",
      cell: ({ row }) => (
        <div className="whitespace-nowrap">
          {format(parseISO(row.getValue("created_at")), "MMM dd, yyyy HH:mm")}
        </div>
      ),
    },
    {
      accessorKey: "ip_address",
      header: "IP Address",
      cell: ({ row }) => <div>{row.getValue("ip_address") || "Unknown"}</div>,
    },
    {
      accessorKey: "geo",
      header: "Country",
      cell: ({ row }) => <div>{row.getValue("geo") || "Unknown"}</div>,
    },
    {
      accessorKey: "device",
      header: "Device",
      cell: ({ row }) => <div className="capitalize">{row.getValue("device") || "Unknown"}</div>,
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
      accessorKey: "offer_name",
      header: "Offer",
      cell: ({ row }) => {
        const offerName = row.original.offers?.name || "Unknown";
        return <div className="font-medium">{offerName}</div>;
      },
    },
    {
      accessorKey: "tracking_code",
      header: "Tracking Code",
      cell: ({ row }) => <div>{row.getValue("tracking_code") || "N/A"}</div>,
    },
    {
      accessorKey: "conversions",
      header: "Conversions",
      cell: ({ row }) => {
        const count = conversions?.filter(c => c.click_id === row.getValue("click_id")).length || 0;
        return <div className="text-center">{count}</div>;
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => exportToCSV('clicks')}
          disabled={!clicks || clicks.length === 0}
        >
          <DownloadIcon className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>
      <DataTable
        columns={clickColumns}
        data={clicks || []}
        isLoading={isLoading}
        emptyMessage="No click data for the selected period"
      />
    </div>
  );
}
