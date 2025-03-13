
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Offer, AffiliateOffer, Click, Conversion } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

export default function AffiliateDashboard() {
  const { user } = useAuth();

  const { data: wallet } = useQuery({
    queryKey: ['affiliate-wallet', user?.id],
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

  const { data: affiliateOffers } = useQuery({
    queryKey: ['user-affiliate-offers', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('affiliate_offers')
        .select('*, offers(*)')
        .eq('affiliate_id', user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: clicks } = useQuery({
    queryKey: ['affiliate-clicks', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('clicks')
        .select('*')
        .eq('affiliate_id', user.id);
      if (error) throw error;
      return data as Click[];
    },
    enabled: !!user,
  });

  const { data: conversions } = useQuery({
    queryKey: ['affiliate-conversions', clicks],
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
  
  const approvedOffers = affiliateOffers?.filter(ao => ao.status === 'approved') || [];
  const pendingOffers = affiliateOffers?.filter(ao => ao.status === 'pending') || [];
  const totalClicks = clicks?.length || 0;
  const totalConversions = conversions?.length || 0;
  const walletBalance = wallet?.balance || 0;
  const pendingBalance = wallet?.pending || 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Affiliate Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your offers and track your earnings
          </p>
        </div>
        <Button asChild>
          <a href="/marketplace">
            <Search className="mr-2 h-4 w-4" />
            Browse Offers
          </a>
        </Button>
      </div>
      
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Offers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedOffers.length}</div>
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
            <CardTitle className="text-sm font-medium">Pending Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${pendingBalance.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${walletBalance.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Your Active Offers</CardTitle>
            <CardDescription>Offers you're currently promoting</CardDescription>
          </CardHeader>
          <CardContent>
            {approvedOffers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Offer</th>
                      <th className="text-left p-2">Commission</th>
                      <th className="text-left p-2">Conversions</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvedOffers.map((ao: any) => {
                      const offer = ao.offers;
                      const offerClicks = clicks?.filter(c => c.offer_id === offer.id).length || 0;
                      
                      return (
                        <tr key={ao.id} className="border-b">
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
                          <td className="p-2">{offerClicks}</td>
                          <td className="p-2">
                            <Button asChild variant="outline" size="sm">
                              <a href={`/links/create?offer=${offer.id}`}>Get Link</a>
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-4">You don't have any approved offers yet</p>
                <Button asChild>
                  <a href="/marketplace">
                    <Search className="mr-2 h-4 w-4" />
                    Browse Offer Marketplace
                  </a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Earnings</CardTitle>
            <CardDescription>Your latest conversions and commissions</CardDescription>
          </CardHeader>
          <CardContent>
            {conversions && conversions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Date</th>
                      <th className="text-left p-2">Type</th>
                      <th className="text-left p-2">Commission</th>
                      <th className="text-left p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {conversions.slice(0, 5).map((conversion) => (
                      <tr key={conversion.id} className="border-b">
                        <td className="p-2">{new Date(conversion.created_at).toLocaleDateString()}</td>
                        <td className="p-2 capitalize">{conversion.event_type}</td>
                        <td className="p-2">${conversion.commission?.toFixed(2) || '0.00'}</td>
                        <td className="p-2 capitalize">{conversion.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground">No earnings recorded yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {pendingOffers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Applications</CardTitle>
            <CardDescription>Your offer applications awaiting approval</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Offer</th>
                    <th className="text-left p-2">Commission</th>
                    <th className="text-left p-2">Applied On</th>
                    <th className="text-left p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingOffers.map((ao: any) => {
                    const offer = ao.offers;
                    
                    return (
                      <tr key={ao.id} className="border-b">
                        <td className="p-2">{offer.name}</td>
                        <td className="p-2">
                          {offer.commission_type === 'RevShare' 
                            ? `${offer.commission_percent}%` 
                            : `$${offer.commission_amount}`}
                        </td>
                        <td className="p-2">{new Date(ao.applied_at).toLocaleDateString()}</td>
                        <td className="p-2 capitalize">{ao.status}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
