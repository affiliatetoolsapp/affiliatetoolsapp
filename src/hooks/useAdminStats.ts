import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface AdminStats {
  totalRevenue: number;
  activeAffiliates: number;
  activeOffers: number;
  conversionRate: number;
  revenueChange: number;
  affiliatesChange: number;
  offersChange: number;
  conversionRateChange: number;
}

async function fetchAdminStats(): Promise<AdminStats> {
  // Get current month's start and end dates
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  // Get last month's start and end dates
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  // Fetch current month's revenue
  const { data: currentRevenue } = await supabase
    .from('conversions')
    .select('payout_amount')
    .gte('created_at', currentMonthStart.toISOString())
    .lte('created_at', currentMonthEnd.toISOString());

  // Fetch last month's revenue
  const { data: lastRevenue } = await supabase
    .from('conversions')
    .select('payout_amount')
    .gte('created_at', lastMonthStart.toISOString())
    .lte('created_at', lastMonthEnd.toISOString());

  // Fetch active affiliates for current month
  const { data: currentAffiliates } = await supabase
    .from('users')
    .select('id, created_at')
    .eq('role', 'affiliate')
    .eq('status', 'active')
    .lte('created_at', currentMonthEnd.toISOString());

  // Fetch active affiliates for last month
  const { data: lastMonthAffiliates } = await supabase
    .from('users')
    .select('id, created_at')
    .eq('role', 'affiliate')
    .eq('status', 'active')
    .lte('created_at', lastMonthEnd.toISOString());

  // Fetch active offers for current month
  const { data: currentOffers } = await supabase
    .from('offers')
    .select('id, created_at')
    .eq('status', 'active')
    .lte('created_at', currentMonthEnd.toISOString());

  // Fetch active offers for last month
  const { data: lastMonthOffers } = await supabase
    .from('offers')
    .select('id, created_at')
    .eq('status', 'active')
    .lte('created_at', lastMonthEnd.toISOString());

  // Calculate conversion rate
  const { data: clicks } = await supabase
    .from('clicks')
    .select('id')
    .gte('created_at', currentMonthStart.toISOString())
    .lte('created_at', currentMonthEnd.toISOString());

  const { data: conversions } = await supabase
    .from('conversions')
    .select('id')
    .gte('created_at', currentMonthStart.toISOString())
    .lte('created_at', currentMonthEnd.toISOString());

  // Calculate statistics
  const totalRevenue = currentRevenue?.reduce((sum, conv) => sum + Number(conv.payout_amount), 0) || 0;
  const lastMonthTotal = lastRevenue?.reduce((sum, conv) => sum + Number(conv.payout_amount), 0) || 0;
  const revenueChange = lastMonthTotal > 0 ? ((totalRevenue - lastMonthTotal) / lastMonthTotal) * 100 : 0;

  const activeAffiliates = currentAffiliates?.length || 0;
  const lastMonthAffiliatesCount = lastMonthAffiliates?.length || 0;
  const affiliatesChange = lastMonthAffiliatesCount > 0 ? ((activeAffiliates - lastMonthAffiliatesCount) / lastMonthAffiliatesCount) * 100 : 0;

  const activeOffers = currentOffers?.length || 0;
  const lastMonthOffersCount = lastMonthOffers?.length || 0;
  const offersChange = lastMonthOffersCount > 0 ? ((activeOffers - lastMonthOffersCount) / lastMonthOffersCount) * 100 : 0;

  const totalClicks = clicks?.length || 0;
  const totalConversions = conversions?.length || 0;
  const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

  // Calculate last month's conversion rate for comparison
  const { data: lastMonthClicks } = await supabase
    .from('clicks')
    .select('id')
    .gte('created_at', lastMonthStart.toISOString())
    .lte('created_at', lastMonthEnd.toISOString());

  const { data: lastMonthConversions } = await supabase
    .from('conversions')
    .select('id')
    .gte('created_at', lastMonthStart.toISOString())
    .lte('created_at', lastMonthEnd.toISOString());

  const lastMonthTotalClicks = lastMonthClicks?.length || 0;
  const lastMonthTotalConversions = lastMonthConversions?.length || 0;
  const lastMonthConversionRate = lastMonthTotalClicks > 0 ? (lastMonthTotalConversions / lastMonthTotalClicks) * 100 : 0;
  const conversionRateChange = lastMonthConversionRate > 0 ? ((conversionRate - lastMonthConversionRate) / lastMonthConversionRate) * 100 : 0;

  return {
    totalRevenue,
    activeAffiliates,
    activeOffers,
    conversionRate,
    revenueChange,
    affiliatesChange,
    offersChange,
    conversionRateChange,
  };
}

export function useAdminStats() {
  return useQuery({
    queryKey: ['adminStats'],
    queryFn: fetchAdminStats,
  });
} 