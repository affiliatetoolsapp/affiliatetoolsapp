import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface HistoricalData {
  name: string;
  revenue: number;
  clicks: number;
  conversions: number;
}

async function fetchHistoricalData(): Promise<HistoricalData[]> {
  // Get data for the last 6 months
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return {
      start: date,
      end: new Date(date.getFullYear(), date.getMonth() + 1, 0),
      name: date.toLocaleString('default', { month: 'short' }),
    };
  }).reverse();

  const historicalData = await Promise.all(
    months.map(async (month) => {
      // Fetch revenue
      const { data: revenueData } = await supabase
        .from('conversions')
        .select('payout_amount')
        .gte('created_at', month.start.toISOString())
        .lte('created_at', month.end.toISOString());

      // Fetch clicks
      const { data: clicksData } = await supabase
        .from('clicks')
        .select('id')
        .gte('created_at', month.start.toISOString())
        .lte('created_at', month.end.toISOString());

      // Fetch conversions
      const { data: conversionsData } = await supabase
        .from('conversions')
        .select('id')
        .gte('created_at', month.start.toISOString())
        .lte('created_at', month.end.toISOString());

      const revenue = revenueData?.reduce((sum, conv) => sum + Number(conv.payout_amount), 0) || 0;
      const clicks = clicksData?.length || 0;
      const conversions = conversionsData?.length || 0;

      return {
        name: month.name,
        revenue,
        clicks,
        conversions,
      };
    })
  );

  return historicalData;
}

export function useAdminHistoricalData() {
  return useQuery({
    queryKey: ['adminHistoricalData'],
    queryFn: fetchHistoricalData,
  });
} 