
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Offer, AffiliateOffer, Click, Conversion, Payment } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

export default function AdvertiserDashboard() {
  const { user } = useAuth();

  const { data: offers } = useQuery({
    queryKey: ['advertiser-offers', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .eq('advertiser_id', user.id);
      if (error) throw error;
      return data as Offer[];
    },
    enabled: !!user,
  });

  const { data: affiliateOffers } = useQuery({
    queryKey: ['affiliate-offers', offers],
    queryFn: async () => {
      if (!offers || offers.length === 0) return [];
      const offerIds = offers.map(offer => offer.id);
      const { data, error } = await supabase
        .from('affiliate_offers')
        .select('*')
        .in('offer_id', offerIds);
      if (error) throw error;
      return data as AffiliateOffer[];
    },
    enabled: !!(offers && offers.length > 0),
  });

  const { data: clicks } = useQuery({
    queryKey: ['advertiser-clicks', offers],
    queryFn: async () => {
      if (!offers || offers.length === 0) return [];
      const offerIds = offers.map(offer => offer.id);
      const { data, error } = await supabase
        .from('clicks')
        .select('*')
        .in('offer_id', offerIds);
      if (error) throw error;
      return data as Click[];
    },
    enabled: !!(offers && offers.length > 0),
  });

  const { data: conversions } = useQuery({
    queryKey: ['advertiser-conversions', clicks],
    queryFn: async () => {
      if (!clicks || clicks.length === 0) return [];
      const clickIds = clicks.map(click => click.click_id);
      const { data, error } = await supabase
        .from('conversions')
        .select('*')
        .in('click_id', clickIds);
      if (error) throw error;
      return data as Conversion[];
    },
    enabled: !!(clicks && clicks.length > 0),
  });

  const { data: wallet } = useQuery({
    queryKey: ['advertiser-wallet', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
  
  const totalOffers = offers?.length || 0;
  const pendingAffiliateRequests = affiliateOffers?.filter(ao => ao.status === 'pending').length || 0;
  const totalClicks = clicks?.length || 0;
  const totalConversions = conversions?.length || 0;
  const walletBalance = wallet?.balance || 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Advertiser Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your offers and track performance
          </p>
        </div>
        <Button asChild>
          <a href="/offers/create">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Offer
          </a>
        </Button>
      </div>
      
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Offers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOffers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Affiliate Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingAffiliateRequests}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting your approval
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClicks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${walletBalance.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Your Offers</CardTitle>
            <CardDescription>Manage and track your affiliate offers</CardDescription>
          </CardHeader>
          <CardContent>
            {offers && offers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2">Commission</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Affiliates</th>
                    </tr>
                  </thead>
                  <tbody>
                    {offers.map((offer) => {
                      const offerAffiliates = affiliateOffers?.filter(
                        ao => ao.offer_id === offer.id && ao.status === 'approved'
                      ).length || 0;
                      
                      return (
                        <tr key={offer.id} className="border-b hover:bg-muted/50">
                          <td className="p-2">
                            <a href={`/offers/${offer.id}`} className="text-primary hover:underline">
                              {offer.name}
                            </a>
                          </td>
                          <td className="p-2">
                            {offer.commission_type === 'RevShare' 
                              ? `${offer.commission_percent}%` 
                              : `$${offer.commission_amount}`}
                          </td>
                          <td className="p-2 capitalize">{offer.status}</td>
                          <td className="p-2">{offerAffiliates}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-4">You haven't created any offers yet</p>
                <Button asChild>
                  <a href="/offers/create">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Your First Offer
                  </a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Conversions</CardTitle>
            <CardDescription>Latest affiliate conversions for your offers</CardDescription>
          </CardHeader>
          <CardContent>
            {conversions && conversions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Type</th>
                      <th className="text-left p-2">Revenue</th>
                      <th className="text-left p-2">Commission</th>
                      <th className="text-left p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {conversions.slice(0, 5).map((conversion) => (
                      <tr key={conversion.id} className="border-b">
                        <td className="p-2 capitalize">{conversion.event_type}</td>
                        <td className="p-2">${conversion.revenue?.toFixed(2) || '0.00'}</td>
                        <td className="p-2">${conversion.commission?.toFixed(2) || '0.00'}</td>
                        <td className="p-2 capitalize">{conversion.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground">No conversions recorded yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
