
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { PaymentStatus, PayoutRequest } from '@/types';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wallet, Calendar, CreditCard, BadgeDollarSign, ArrowDownToLine } from 'lucide-react';

export default function AffiliateWallet() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRequesting, setIsRequesting] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState<string>('');
  const [payoutMethod, setPayoutMethod] = useState<'paypal' | 'bank' | 'crypto'>('paypal');
  const [isPayoutDialogOpen, setIsPayoutDialogOpen] = useState(false);
  
  // Get affiliate's wallet
  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ['affiliate-wallet', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user && user.role === 'affiliate',
  });
  
  // Get payout history
  const { data: payouts, isLoading: payoutsLoading } = useQuery({
    queryKey: ['affiliate-payouts', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('payout_requests')
        .select('*')
        .eq('affiliate_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      // Type assertion to match PayoutRequest type
      return data as unknown as PayoutRequest[];
    },
    enabled: !!user && user.role === 'affiliate',
  });
  
  // Request payout mutation
  const requestPayoutMutation = useMutation({
    mutationFn: async (variables: { amount: number, method: 'paypal' | 'bank' | 'crypto' }) => {
      if (!user) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('payout_requests')
        .insert({
          affiliate_id: user.id,
          amount: variables.amount,
          method: variables.method,
          status: 'pending' as PaymentStatus,
          created_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      // Update wallet balance
      const { error: walletError } = await supabase
        .from('wallets')
        .update({
          balance: wallet.balance - variables.amount
        })
        .eq('user_id', user.id);
      
      if (walletError) throw walletError;
      
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliate-wallet', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['affiliate-payouts', user?.id] });
      
      toast({
        title: "Payout Requested",
        description: "Your payout request has been submitted successfully",
      });
      
      setIsPayoutDialogOpen(false);
      setPayoutAmount('');
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to request payout",
      });
    }
  });
  
  const handleRequestPayout = () => {
    if (!wallet) return;
    
    const amount = parseFloat(payoutAmount);
    
    if (isNaN(amount) || amount <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "Please enter a valid amount",
      });
      return;
    }
    
    if (amount < 50) {
      toast({
        variant: "destructive",
        title: "Minimum Amount Required",
        description: "The minimum payout amount is $50",
      });
      return;
    }
    
    if (amount > wallet.balance) {
      toast({
        variant: "destructive",
        title: "Insufficient Balance",
        description: "You don't have enough balance for this payout",
      });
      return;
    }
    
    setIsRequesting(true);
    requestPayoutMutation.mutate({
      amount,
      method: payoutMethod
    });
    setIsRequesting(false);
  };
  
  const getStatusBadgeClass = (status: PaymentStatus) => {
    switch (status) {
      case 'pending':
        return "bg-yellow-100 text-yellow-800";
      case 'processing':
        return "bg-blue-100 text-blue-800";
      case 'completed':
        return "bg-green-100 text-green-800";
      case 'failed':
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Wallet</h1>
        <p className="text-muted-foreground">
          Manage your earnings and request payouts
        </p>
      </div>
      
      {walletLoading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : wallet ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Available Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">${wallet.balance.toFixed(2)}</div>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Amount available for withdrawal
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Earnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">${wallet.pending.toFixed(2)}</div>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Earnings in holding period
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Total Earned
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">
                  ${((wallet.balance + wallet.pending) + (payouts?.reduce((sum, payout) => sum + payout.amount, 0) || 0)).toFixed(2)}
                </div>
                <BadgeDollarSign className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                All-time earnings
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Wallet information not available</p>
        </Card>
      )}
      
      <div className="flex justify-end">
        <Dialog open={isPayoutDialogOpen} onOpenChange={setIsPayoutDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={!wallet || wallet.balance < 50}>
              <ArrowDownToLine className="mr-2 h-4 w-4" />
              Request Payout
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Payout</DialogTitle>
              <DialogDescription>
                Minimum payout amount is $50. A 1% processing fee will be applied.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="amount"
                    placeholder="Enter amount"
                    className="pl-7"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                  />
                </div>
                {wallet && (
                  <p className="text-xs text-muted-foreground">
                    Available: ${wallet.balance.toFixed(2)}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="method">Payment Method</Label>
                <Select value={payoutMethod} onValueChange={(value: 'paypal' | 'bank' | 'crypto') => setPayoutMethod(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                    <SelectItem value="crypto">Cryptocurrency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {payoutMethod === 'paypal' && (
                <p className="text-sm text-muted-foreground">
                  Payment will be sent to your registered PayPal email.
                </p>
              )}
              
              {payoutMethod === 'bank' && (
                <p className="text-sm text-muted-foreground">
                  Payment will be sent to your registered bank account.
                </p>
              )}
              
              {payoutMethod === 'crypto' && (
                <p className="text-sm text-muted-foreground">
                  Payment will be sent as USDT to your registered wallet address.
                </p>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPayoutDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleRequestPayout}
                disabled={isRequesting || !payoutAmount || parseFloat(payoutAmount) < 50}
              >
                {isRequesting ? "Processing..." : "Confirm Request"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
          <CardDescription>
            Review your payout requests and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payoutsLoading ? (
            <div className="flex justify-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : payouts?.length ? (
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-3 text-left font-medium">Date</th>
                      <th className="p-3 text-left font-medium">Amount</th>
                      <th className="p-3 text-left font-medium">Method</th>
                      <th className="p-3 text-left font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payouts.map((payout) => (
                      <tr key={payout.id} className="border-b hover:bg-muted/50">
                        <td className="p-3">
                          {new Date(payout.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-3">${payout.amount.toFixed(2)}</td>
                        <td className="p-3 capitalize">{payout.method}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(payout.status)}`}>
                            {payout.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 border rounded-md">
              <p className="text-muted-foreground">You haven't requested any payouts yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
