
import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Payment } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Download, Upload, DollarSign, Calendar, Filter } from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

export default function PaymentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentDetails, setPaymentDetails] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Get user's payments
  const { data: payments, isLoading: paymentsLoading, refetch: refetchPayments } = useQuery({
    queryKey: ['payments', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase
        .from('payments')
        .select('*');
        
      if (user.role === 'affiliate') {
        query = query.eq('affiliate_id', user.id);
      } else if (user.role === 'advertiser') {
        query = query.eq('advertiser_id', user.id);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Payment[];
    },
    enabled: !!user,
  });

  // Get user's wallet
  const { data: wallet, isLoading: walletLoading, refetch: refetchWallet } = useQuery({
    queryKey: ['wallet', user?.id],
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

  const handleWithdraw = async () => {
    if (!user || !wallet) return;
    
    const amount = parseFloat(withdrawAmount);
    
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid withdrawal amount",
        variant: "destructive",
      });
      return;
    }
    
    if (amount > wallet.balance) {
      toast({
        title: "Insufficient balance",
        description: "Your withdrawal amount exceeds your available balance",
        variant: "destructive",
      });
      return;
    }
    
    if (!paymentMethod) {
      toast({
        title: "Payment method required",
        description: "Please select a payment method",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Create withdrawal record
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          affiliate_id: user.id,
          amount: amount,
          fee: amount * 0.03, // 3% fee
          total: amount * 0.97,
          payment_method: paymentMethod,
          payment_details: paymentDetails,
          status: 'pending',
        });
        
      if (paymentError) throw paymentError;
      
      // Update wallet balance
      const { error: walletError } = await supabase
        .from('wallets')
        .update({
          balance: wallet.balance - amount,
        })
        .eq('user_id', user.id);
        
      if (walletError) throw walletError;
      
      toast({
        title: "Withdrawal requested",
        description: "Your withdrawal request has been submitted",
      });
      
      setWithdrawAmount('');
      setPaymentMethod('');
      setPaymentDetails('');
      refetchPayments();
      refetchWallet();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to process withdrawal",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    if (!user || !wallet) return;
    
    const amount = parseFloat(depositAmount);
    
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid deposit amount",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Create deposit record
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          advertiser_id: user.id,
          amount: amount,
          fee: 0,
          total: amount,
          payment_method: 'credit_card',
          status: 'completed',
        });
        
      if (paymentError) throw paymentError;
      
      // Update wallet balance
      const { error: walletError } = await supabase
        .from('wallets')
        .update({
          balance: wallet.balance + amount,
        })
        .eq('user_id', user.id);
        
      if (walletError) throw walletError;
      
      toast({
        title: "Deposit successful",
        description: "Your funds have been added to your account",
      });
      
      setDepositAmount('');
      refetchPayments();
      refetchWallet();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to process deposit",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments?.filter(payment => {
    if (statusFilter === 'all') return true;
    return payment.status === statusFilter;
  });

  if (!user) return null;

  const isAffiliate = user.role === 'affiliate';
  const isAdvertiser = user.role === 'advertiser';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
        <p className="text-muted-foreground">
          {isAffiliate 
            ? "Manage your earnings and withdrawals" 
            : "Fund your account and track your payments"}
        </p>
      </div>
      
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${walletLoading ? '...' : wallet?.balance.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Ready to {isAffiliate ? 'withdraw' : 'use for payments'}
            </p>
          </CardContent>
        </Card>
        
        {isAffiliate && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Balance</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${walletLoading ? '...' : wallet?.pending.toFixed(2) || '0.00'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Will be available after approval
              </p>
            </CardContent>
          </Card>
        )}
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total {isAffiliate ? 'Earnings' : 'Spent'}</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${paymentsLoading 
                ? '...' 
                : payments
                  ?.reduce((sum, payment) => sum + payment.amount, 0)
                  .toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Lifetime {isAffiliate ? 'earnings' : 'payments'}
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex space-x-2">
          {isAffiliate && (
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Upload className="mr-2 h-4 w-4" />
                  Withdraw Funds
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Withdraw Funds</DialogTitle>
                  <DialogDescription>
                    Request a withdrawal from your available balance
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="amount" className="text-right">
                      Amount
                    </Label>
                    <div className="col-span-3 relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
                      <Input
                        id="amount"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder="0.00"
                        className="pl-7"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="method" className="text-right">
                      Method
                    </Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paypal">PayPal</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="crypto">Cryptocurrency</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="details" className="text-right">
                      Details
                    </Label>
                    <Input
                      id="details"
                      value={paymentDetails}
                      onChange={(e) => setPaymentDetails(e.target.value)}
                      placeholder="PayPal email or account details"
                      className="col-span-3"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleWithdraw} disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Request Withdrawal
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          
          {isAdvertiser && (
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Download className="mr-2 h-4 w-4" />
                  Add Funds
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Funds</DialogTitle>
                  <DialogDescription>
                    Deposit money into your advertiser account
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="amount" className="text-right">
                      Amount
                    </Label>
                    <div className="col-span-3 relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
                      <Input
                        id="amount"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        placeholder="0.00"
                        className="pl-7"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="method" className="text-right">
                      Method
                    </Label>
                    <Input
                      id="method"
                      value="Credit Card"
                      disabled
                      className="col-span-3"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleDeposit} disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Complete Deposit
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            Your recent payment activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          {paymentsLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredPayments && filteredPayments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Type</th>
                    <th className="text-left p-2">Amount</th>
                    <th className="text-left p-2">Fee</th>
                    <th className="text-left p-2">Total</th>
                    <th className="text-left p-2">Method</th>
                    <th className="text-left p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="border-b">
                      <td className="p-2">{new Date(payment.created_at).toLocaleDateString()}</td>
                      <td className="p-2 capitalize">
                        {payment.affiliate_id === user.id ? 'Withdrawal' : 'Deposit'}
                      </td>
                      <td className="p-2">${payment.amount.toFixed(2)}</td>
                      <td className="p-2">${payment.fee.toFixed(2)}</td>
                      <td className="p-2">${payment.total.toFixed(2)}</td>
                      <td className="p-2 capitalize">{payment.payment_method?.replace('_', ' ') || '-'}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          payment.status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : payment.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground">No transaction history found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
