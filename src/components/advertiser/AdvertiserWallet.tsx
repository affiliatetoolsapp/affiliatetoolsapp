
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Payment } from '@/types';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Wallet, Calendar, ArrowUpToLine, CreditCard } from 'lucide-react';

export default function AdvertiserWallet() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isFunding, setIsFunding] = useState(false);
  const [fundAmount, setFundAmount] = useState<string>('');
  const [isFundDialogOpen, setIsFundDialogOpen] = useState(false);
  
  // Get advertiser's wallet
  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ['advertiser-wallet', user?.id],
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
    enabled: !!user && user.role === 'advertiser',
  });
  
  // Get payments history
  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ['advertiser-payments', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('advertiser_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Payment[];
    },
    enabled: !!user && user.role === 'advertiser',
  });
  
  // Fund wallet mutation
  const fundWalletMutation = useMutation({
    mutationFn: async (amount: number) => {
      if (!user) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('wallets')
        .update({
          balance: wallet.balance + amount
        })
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Log the transaction (in a real system, this would connect to a payment processor)
      const { error: transactionError } = await supabase
        .from('payments')
        .insert({
          advertiser_id: user.id,
          amount: amount,
          fee: amount * 0.01, // 1% fee
          total: amount * 1.01,
          status: 'completed',
          payment_method: 'card',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (transactionError) throw transactionError;
      
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advertiser-wallet', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['advertiser-payments', user?.id] });
      
      toast({
        title: "Wallet Funded",
        description: "Your wallet has been funded successfully",
      });
      
      setIsFundDialogOpen(false);
      setFundAmount('');
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to fund wallet",
      });
    }
  });
  
  const handleFundWallet = () => {
    const amount = parseFloat(fundAmount);
    
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
        description: "The minimum funding amount is $50",
      });
      return;
    }
    
    setIsFunding(true);
    fundWalletMutation.mutate(amount);
    setIsFunding(false);
  };
  
  const getStatusBadgeClass = (status: string) => {
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
        <h1 className="text-3xl font-bold tracking-tight">Advertiser Wallet</h1>
        <p className="text-muted-foreground">
          Manage your funds to pay affiliates
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
                Available for affiliate payments
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">${wallet.pending.toFixed(2)}</div>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Pending affiliate payments
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Total Spent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">
                  ${payments?.reduce((sum, payment) => sum + payment.total, 0).toFixed(2) || '0.00'}
                </div>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                All-time spending
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
        <Dialog open={isFundDialogOpen} onOpenChange={setIsFundDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Fund Wallet
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Fund Your Wallet</DialogTitle>
              <DialogDescription>
                Add funds to your wallet to pay affiliates. A 1% processing fee will be applied.
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
                    value={fundAmount}
                    onChange={(e) => setFundAmount(e.target.value)}
                  />
                </div>
                {fundAmount && !isNaN(parseFloat(fundAmount)) && (
                  <p className="text-xs text-muted-foreground">
                    Fee (1%): ${(parseFloat(fundAmount) * 0.01).toFixed(2)} | 
                    Total: ${(parseFloat(fundAmount) * 1.01).toFixed(2)}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="card">Card Information</Label>
                <Input id="card" placeholder="**** **** **** ****" />
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expiry" className="sr-only">Expiry Date</Label>
                    <Input id="expiry" placeholder="MM/YY" />
                  </div>
                  <div>
                    <Label htmlFor="cvc" className="sr-only">CVC</Label>
                    <Input id="cvc" placeholder="CVC" />
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsFundDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleFundWallet}
                disabled={isFunding || !fundAmount || parseFloat(fundAmount) < 50}
              >
                {isFunding ? "Processing..." : "Fund Wallet"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            Review your wallet funding and affiliate payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {paymentsLoading ? (
            <div className="flex justify-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : payments?.length ? (
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-3 text-left font-medium">Date</th>
                      <th className="p-3 text-left font-medium">Type</th>
                      <th className="p-3 text-left font-medium">Amount</th>
                      <th className="p-3 text-left font-medium">Fee</th>
                      <th className="p-3 text-left font-medium">Total</th>
                      <th className="p-3 text-left font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id} className="border-b hover:bg-muted/50">
                        <td className="p-3">
                          {new Date(payment.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-3">
                          {payment.affiliate_id ? 'Affiliate Payment' : 'Wallet Funding'}
                        </td>
                        <td className="p-3">${payment.amount.toFixed(2)}</td>
                        <td className="p-3">${payment.fee.toFixed(2)}</td>
                        <td className="p-3">${payment.total.toFixed(2)}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(payment.status)}`}>
                            {payment.status}
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
              <p className="text-muted-foreground">No transaction history yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
