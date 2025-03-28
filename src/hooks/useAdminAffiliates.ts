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
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  created_at: string;
  total_earnings: number;
  active_offers: number;
  conversion_rate: number;
  has_activity: boolean;
}

async function fetchAffiliateStats(): Promise<AffiliateStats> {
  // Fetch total affiliates
  const { data: totalAffiliates, error: totalError } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'affiliate');

  console.log('Total affiliates query result:', { data: totalAffiliates, error: totalError });

  if (totalError) {
    console.error('Error fetching total affiliates:', totalError);
  }

  // Log each affiliate found in the total count
  if (totalAffiliates) {
    console.log('Found affiliates:', totalAffiliates.map(aff => ({
      id: aff.id,
      email: aff.email,
      role: aff.role,
      status: aff.status
    })));
  }

  // Fetch active affiliates (those with activity)
  const { data: activeAffiliates, error: activeError } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'affiliate')
    .eq('status', 'active')
    .filter('id', 'in', (
      supabase
        .from('clicks')
        .select('affiliate_id')
    ));

  console.log('Active affiliates query result:', { data: activeAffiliates, error: activeError });

  if (activeError) {
    console.error('Error fetching active affiliates:', activeError);
  }

  // Fetch total earnings
  const { data: earnings, error: earningsError } = await supabase
    .from('conversions')
    .select('payout_amount');

  console.log('Total earnings query result:', { data: earnings, error: earningsError });

  if (earningsError) {
    console.error('Error fetching earnings:', earningsError);
  }

  const stats = {
    totalAffiliates: totalAffiliates?.length || 0,
    activeAffiliates: activeAffiliates?.length || 0,
    totalEarnings: earnings?.reduce((sum, conv) => sum + Number(conv.payout_amount), 0) || 0,
  };

  console.log('Final stats:', stats);
  return stats;
}

async function fetchAffiliates(): Promise<Affiliate[]> {
  // Fetch all affiliates with their basic info
  const { data: affiliates, error: affiliatesError } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'affiliate')
    .order('created_at', { ascending: false });

  console.log('Initial affiliates query result:', { data: affiliates, error: affiliatesError });

  if (affiliatesError) {
    console.error('Error fetching affiliates:', affiliatesError);
    return [];
  }

  if (!affiliates || affiliates.length === 0) {
    console.log('No affiliates found in initial query');
    return [];
  }

  // Log the role of each user to verify they are indeed affiliates
  affiliates.forEach(affiliate => {
    console.log(`User ${affiliate.id} role:`, affiliate.role);
  });

  // Fetch additional stats for each affiliate
  const affiliatesWithStats = await Promise.all(
    affiliates.map(async (affiliate) => {
      console.log(`Fetching stats for affiliate ${affiliate.id}`);
      
      // Fetch total earnings
      const { data: earnings, error: earningsError } = await supabase
        .from('conversions')
        .select('payout_amount')
        .eq('affiliate_id', affiliate.id);

      if (earningsError) {
        console.error(`Error fetching earnings for affiliate ${affiliate.id}:`, earningsError);
      }
      console.log(`Earnings for affiliate ${affiliate.id}:`, earnings);

      // Fetch active offers
      const { data: activeOffers, error: offersError } = await supabase
        .from('affiliate_offers')
        .select('id')
        .eq('affiliate_id', affiliate.id)
        .eq('status', 'active');

      if (offersError) {
        console.error(`Error fetching active offers for affiliate ${affiliate.id}:`, offersError);
      }
      console.log(`Active offers for affiliate ${affiliate.id}:`, activeOffers);

      // Fetch clicks and conversions for activity check and conversion rate
      const { data: clicks, error: clicksError } = await supabase
        .from('clicks')
        .select('id')
        .eq('affiliate_id', affiliate.id);

      if (clicksError) {
        console.error(`Error fetching clicks for affiliate ${affiliate.id}:`, clicksError);
      }
      console.log(`Clicks for affiliate ${affiliate.id}:`, clicks);

      const { data: conversions, error: conversionsError } = await supabase
        .from('conversions')
        .select('id')
        .eq('affiliate_id', affiliate.id);

      if (conversionsError) {
        console.error(`Error fetching conversions for affiliate ${affiliate.id}:`, conversionsError);
      }
      console.log(`Conversions for affiliate ${affiliate.id}:`, conversions);

      const totalClicks = clicks?.length || 0;
      const totalConversions = conversions?.length || 0;
      const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
      const hasActivity = totalClicks > 0 || totalConversions > 0;

      const affiliateWithStats = {
        ...affiliate,
        status: affiliate.status || 'pending',
        total_earnings: earnings?.reduce((sum, conv) => sum + Number(conv.payout_amount), 0) || 0,
        active_offers: activeOffers?.length || 0,
        conversion_rate: conversionRate,
        has_activity: hasActivity,
      };

      console.log(`Complete stats for affiliate ${affiliate.id}:`, affiliateWithStats);
      return affiliateWithStats;
    })
  );

  console.log('Final affiliates with stats:', affiliatesWithStats);
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