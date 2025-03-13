
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { User, Offer, Payment } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AdminDashboard() {
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase.from('users').select('*');
      if (error) throw error;
      return data as User[];
    },
  });

  const { data: offers } = useQuery({
    queryKey: ['offers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('offers').select('*');
      if (error) throw error;
      return data as Offer[];
    },
  });

  const { data: payments } = useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      const { data, error } = await supabase.from('payments').select('*');
      if (error) throw error;
      return data as Payment[];
    },
  });
  
  const totalUsers = users?.length || 0;
  const totalOffers = offers?.length || 0;
  const totalPayments = payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
  const affiliates = users?.filter(user => user.role === 'affiliate').length || 0;
  const advertisers = users?.filter(user => user.role === 'advertiser').length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Platform overview and management
        </p>
      </div>
      
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {affiliates} Affiliates, {advertisers} Advertisers
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Offers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOffers}</div>
            <p className="text-xs text-muted-foreground">
              Across all advertisers
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalPayments.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Processed through the platform
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="offers">Offers</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>
        <TabsContent value="users" className="p-4 border rounded-md mt-2">
          <h3 className="text-lg font-semibold mb-4">Recent Users</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Email</th>
                  <th className="text-left p-2">Role</th>
                  <th className="text-left p-2">Company</th>
                  <th className="text-left p-2">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users?.slice(0, 5).map((user) => (
                  <tr key={user.id} className="border-b">
                    <td className="p-2">{user.email}</td>
                    <td className="p-2 capitalize">{user.role}</td>
                    <td className="p-2">{user.company_name || '-'}</td>
                    <td className="p-2">{new Date(user.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
        <TabsContent value="offers" className="p-4 border rounded-md mt-2">
          <h3 className="text-lg font-semibold mb-4">Recent Offers</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Commission</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {offers?.slice(0, 5).map((offer) => (
                  <tr key={offer.id} className="border-b">
                    <td className="p-2">{offer.name}</td>
                    <td className="p-2">
                      {offer.commission_type === 'RevShare' 
                        ? `${offer.commission_percent}%` 
                        : `$${offer.commission_amount}`}
                    </td>
                    <td className="p-2 capitalize">{offer.status}</td>
                    <td className="p-2">{new Date(offer.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
        <TabsContent value="payments" className="p-4 border rounded-md mt-2">
          <h3 className="text-lg font-semibold mb-4">Recent Payments</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Amount</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {payments?.slice(0, 5).map((payment) => (
                  <tr key={payment.id} className="border-b">
                    <td className="p-2">${payment.amount.toFixed(2)}</td>
                    <td className="p-2 capitalize">{payment.status}</td>
                    <td className="p-2">{new Date(payment.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {!payments?.length && (
                  <tr>
                    <td colSpan={3} className="p-4 text-center text-muted-foreground">No payments yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
