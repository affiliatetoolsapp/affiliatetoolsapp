import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Wallet, PayoutRequest, PaymentStatus } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from 'lucide-react';

export default function AffiliateWallet() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isRequestingPayout, setIsRequestingPayout] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState('');
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutNotes, setPayoutNotes] = useState('');
  
  // Get wallet info
  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ['wallet', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      return data as Wallet;
    },
    enabled: !!user,
  });
  
  // Get payout requests
  const { data: payoutRequests, isLoading: payoutRequestsLoading, refetch } = useQuery({
    queryKey: ['payout-requests', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('payout_requests')
        .select('*')
        .eq('affiliate_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as PayoutRequest[];
    },
    enabled: !!user,
  });
  
  // Handle payout request submission
  const handlePayoutRequest = async () => {
    if (!user) return;
    
    if (!payoutMethod) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a payout method',
      });
      return;
    }
    
    if (!payoutAmount || isNaN(Number(payoutAmount)) || Number(payoutAmount) <= 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter a valid payout amount',
      });
      return;
    }
    
    if (Number(payoutAmount) > (wallet?.balance || 0)) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Payout amount exceeds available balance',
      });
      return;
    }
    
    setIsRequestingPayout(true);
    
    try {
      const { error } = await supabase
        .from('payout_requests')
        .insert({
          affiliate_id: user.id,
          amount: Number(payoutAmount),
          method: payoutMethod,
          notes: payoutNotes,
          status: 'pending',
          created_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      toast({
        title: 'Payout Requested',
        description: 'Your payout request has been submitted successfully',
      });
      
      // Reset form
      setPayoutMethod('');
      setPayoutAmount('');
      setPayoutNotes('');
      
      // Refetch payout requests
      refetch();
      
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to submit payout request',
      });
    } finally {
      setIsRequestingPayout(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Wallet</h1>
        <p className="text-muted-foreground">
          Manage your earnings and request payouts
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Available Balance</CardTitle>
          <CardDescription>
            Your current available balance for payouts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {walletLoading ? (
            <div className="flex justify-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            </div>
          ) : (
            <div className="text-3xl font-bold">
              ${wallet?.balance?.toFixed(2) || '0.00'}
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Request Payout</CardTitle>
          <CardDescription>
            Request a payout to your preferred payment method
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            <Label htmlFor="payout-method">Payout Method</Label>
            <Select value={payoutMethod} onValueChange={setPayoutMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Select payout method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paypal">PayPal</SelectItem>
                <SelectItem value="bank">Bank Transfer</SelectItem>
                <SelectItem value="crypto">Crypto (USDT)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-3">
            <Label htmlFor="payout-amount">Payout Amount</Label>
            <Input
              type="number"
              id="payout-amount"
              placeholder="Enter amount"
              value={payoutAmount}
              onChange={(e) => setPayoutAmount(e.target.value)}
            />
          </div>
          
          <div className="grid gap-3">
            <Label htmlFor="payout-notes">Additional Notes (Optional)</Label>
            <Textarea
              id="payout-notes"
              placeholder="Any additional notes for the payout request"
              value={payoutNotes}
              onChange={(e) => setPayoutNotes(e.target.value)}
            />
          </div>
          
          <Button onClick={handlePayoutRequest} disabled={isRequestingPayout}>
            {isRequestingPayout ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Requesting...
              </>
            ) : (
              'Request Payout'
            )}
          </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
          <CardDescription>
            Your previous payout requests and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payoutRequestsLoading ? (
            <div className="flex justify-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            </div>
          ) : payoutRequests?.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payoutRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>{new Date(request.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>{request.method}</TableCell>
                    <TableCell>${request.amount.toFixed(2)}</TableCell>
                    <TableCell className="font-medium">{request.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-4">No payout history available</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
