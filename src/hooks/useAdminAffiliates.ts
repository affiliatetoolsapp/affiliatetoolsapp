import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface AffiliateStats {
  totalAffiliates: number;
  activeAffiliates: number;
  totalEarnings: number;
}

interface Affiliate {
  id: string;
  email: string;
  company_name: string | null;
  contact_name: string | null;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  total_earnings: number;
  active_offers: number;
  conversion_rate: number;
}

async function fetchAffiliateStats(): Promise<AffiliateStats> {
  // Fetch total affiliates
  const { data: totalAffiliates, error: totalError } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'affiliate');

  if (totalError) {
    console.error('Error fetching total affiliates:', totalError);
  }

  // Fetch active affiliates
  const { data: activeAffiliates, error: activeError } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'affiliate')
    .eq('status', 'active');

  if (activeError) {
    console.error('Error fetching active affiliates:', activeError);
  }

  // Fetch total earnings
  const { data: earnings, error: earningsError } = await supabase
    .from('conversions')
    .select('payout_amount');

  if (earningsError) {
    console.error('Error fetching earnings:', earningsError);
  }

  return {
    totalAffiliates: totalAffiliates?.length || 0,
    activeAffiliates: activeAffiliates?.length || 0,
    totalEarnings: earnings?.reduce((sum, conv) => sum + Number(conv.payout_amount), 0) || 0,
  };
}

async function fetchAffiliates(): Promise<Affiliate[]> {
  // Fetch all affiliates with their basic info
  const { data: affiliates, error: affiliatesError } = await supabase
    .from('users')
    .select('id, email, company_name, contact_name, status, created_at')
    .eq('role', 'affiliate')
    .order('created_at', { ascending: false });

  if (affiliatesError) {
    console.error('Error fetching affiliates:', affiliatesError);
    return [];
  }

  console.log('Fetched affiliates:', affiliates);

  if (!affiliates || affiliates.length === 0) {
    console.log('No affiliates found');
    return [];
  }

  // Fetch additional stats for each affiliate
  const affiliatesWithStats = await Promise.all(
    affiliates.map(async (affiliate) => {
      // Fetch total earnings
      const { data: earnings, error: earningsError } = await supabase
        .from('conversions')
        .select('payout_amount')
        .eq('affiliate_id', affiliate.id);

      if (earningsError) {
        console.error(`Error fetching earnings for affiliate ${affiliate.id}:`, earningsError);
      }

      // Fetch active offers
      const { data: activeOffers, error: offersError } = await supabase
        .from('affiliate_offers')
        .select('id')
        .eq('affiliate_id', affiliate.id)
        .eq('status', 'active');

      if (offersError) {
        console.error(`Error fetching active offers for affiliate ${affiliate.id}:`, offersError);
      }

      // Fetch conversion rate
      const { data: clicks, error: clicksError } = await supabase
        .from('clicks')
        .select('id')
        .eq('affiliate_id', affiliate.id);

      if (clicksError) {
        console.error(`Error fetching clicks for affiliate ${affiliate.id}:`, clicksError);
      }

      const { data: conversions, error: conversionsError } = await supabase
        .from('conversions')
        .select('id')
        .eq('affiliate_id', affiliate.id);

      if (conversionsError) {
        console.error(`Error fetching conversions for affiliate ${affiliate.id}:`, conversionsError);
      }

      const totalClicks = clicks?.length || 0;
      const totalConversions = conversions?.length || 0;
      const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

      return {
        ...affiliate,
        total_earnings: earnings?.reduce((sum, conv) => sum + Number(conv.payout_amount), 0) || 0,
        active_offers: activeOffers?.length || 0,
        conversion_rate: conversionRate,
      };
    })
  );

  console.log('Affiliates with stats:', affiliatesWithStats);
  return affiliatesWithStats;
}

export function useAdminAffiliates() {
  const stats = useQuery({
    queryKey: ['adminAffiliateStats'],
    queryFn: fetchAffiliateStats,
  });

  const affiliates = useQuery({
    queryKey: ['adminAffiliates'],
    queryFn: fetchAffiliates,
  });

  return {
    stats,
    affiliates,
    refetch: () => {
      stats.refetch();
      affiliates.refetch();
    }
  };
} 