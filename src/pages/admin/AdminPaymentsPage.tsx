
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Payment } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Download,
  ArrowDownCircle,
  ArrowUpCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminPaymentsPage() {
  const { toast } = useToast();
  
  const { data: payments, isLoading, refetch } = useQuery({
    queryKey: ['admin-payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          affiliate:users!affiliate_id(email, contact_name, company_name),
          advertiser:users!advertiser_id(email, contact_name, company_name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as any[];
    },
  });

  const pendingPayments = payments?.filter(payment => payment.status === 'pending') || [];
  const completedPayments = payments?.filter(payment => payment.status === 'completed') || [];
  const cancelledPayments = payments?.filter(payment => payment.status === 'cancelled') || [];
  
  const totalPending = pendingPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalCompleted = completedPayments.reduce((sum, payment) => sum + payment.amount, 0);
  
  const handleApprovePayment = async (paymentId: string) => {
    try {
      const { error } = await supabase
        .from('payments')
        .update({ status: 'completed' })
        .eq('id', paymentId);
        
      if (error) throw error;
      
      toast({
        title: "Payment approved",
        description: "The payment has been successfully approved",
      });
      
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve payment",
        variant: "destructive",
      });
    }
  };
  
  const handleCancelPayment = async (paymentId: string) => {
    try {
      const { error } = await supabase
        .from('payments')
        .update({ status: 'cancelled' })
        .eq('id', paymentId);
        
      if (error) throw error;
      
      toast({
        title: "Payment cancelled",
        description: "The payment has been cancelled",
      });
      
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel payment",
        variant: "destructive",
      });
    }
  };
  
  const paymentColumns = [
    {
      accessorKey: 'created_at',
      header: 'Date',
      cell: ({ row }: any) => new Date(row.original.created_at).toLocaleDateString(),
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }: any) => {
        const isWithdrawal = row.original.affiliate_id !== null;
        return (
          <div className="flex items-center">
            {isWithdrawal ? (
              <>
                <ArrowUpCircle className="h-4 w-4 mr-1 text-orange-500" />
                <span>Withdrawal</span>
              </>
            ) : (
              <>
                <ArrowDownCircle className="h-4 w-4 mr-1 text-green-500" />
                <span>Deposit</span>
              </>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'user',
      header: 'User',
      cell: ({ row }: any) => {
        const isWithdrawal = row.original.affiliate_id !== null;
        const user = isWithdrawal ? row.original.affiliate : row.original.advertiser;
        return (
          <div>
            <div className="font-medium">{user?.contact_name || user?.email || 'N/A'}</div>
            <div className="text-xs text-muted-foreground">{isWithdrawal ? 'Affiliate' : 'Advertiser'}</div>
          </div>
        );
      },
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }: any) => `$${row.original.amount.toFixed(2)}`,
    },
    {
      accessorKey: 'payment_method',
      header: 'Method',
      cell: ({ row }: any) => row.original.payment_method?.replace('_', ' ') || 'N/A',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: any) => {
        const status = row.original.status;
        return (
          <Badge className={
            status === 'completed' 
              ? 'bg-green-100 text-green-800' 
              : status === 'pending' 
                ? 'bg-yellow-100 text-yellow-800' 
                : 'bg-red-100 text-red-800'
          }>
            {status}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: any) => {
        const status = row.original.status;
        
        if (status === 'completed' || status === 'cancelled') {
          return (
            <Button size="sm" variant="outline">
              View
            </Button>
          );
        }
        
        return (
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="border-green-500 text-green-500 hover:bg-green-50"
              onClick={() => handleApprovePayment(row.original.id)}
            >
              Approve
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="border-red-500 text-red-500 hover:bg-red-50"
              onClick={() => handleCancelPayment(row.original.id)}
            >
              Cancel
            </Button>
          </div>
        );
      },
    },
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payments Management</h1>
          <p className="text-muted-foreground">
            Manage deposits and withdrawals across the platform
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
      
      <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Processed</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCompleted.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              From {completedPayments.length} transactions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalPending.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              From {pendingPayments.length} transactions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedPayments.length}</div>
            <p className="text-xs text-muted-foreground">
              Successful transactions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingPayments.length}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting review
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Transactions</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <DataTable 
                columns={paymentColumns} 
                data={payments || []} 
                isLoading={isLoading}
                filterableColumns={[
                  { id: 'status', title: 'Status', type: 'select', options: [
                    { label: 'Pending', value: 'pending' },
                    { label: 'Completed', value: 'completed' },
                    { label: 'Cancelled', value: 'cancelled' },
                  ]}
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="pending" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <DataTable 
                columns={paymentColumns} 
                data={pendingPayments} 
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="completed" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <DataTable 
                columns={paymentColumns} 
                data={completedPayments} 
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="cancelled" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <DataTable 
                columns={paymentColumns} 
                data={cancelledPayments} 
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
