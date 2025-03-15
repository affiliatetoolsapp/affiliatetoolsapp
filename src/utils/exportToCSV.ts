
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';

export function exportToCSV(dataType: 'clicks' | 'conversions', data: any[] | undefined, conversions?: any[]) {
  try {
    if (!data || data.length === 0) {
      toast.error(`No ${dataType} data to export`);
      return;
    }
    
    let csvContent = '';
    let headers: string[] = [];
    let rows: any[][] = [];
    
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
}
