import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Payment } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { Badge } from '@/components/ui/badge';

export function PaymentsPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  
  const { data: payments, isLoading, isError } = useQuery({
    queryKey: ['payments', searchQuery, dateRange],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase
        .from('payments')
        .select('*');
      
      if (searchQuery) {
        query = query.ilike('id', `%${searchQuery}%`);
      }
      
      if (dateRange?.from && dateRange?.to) {
        query = query.gte('created_at', dateRange.from.toISOString());
        query = query.lte('created_at', dateRange.to.toISOString());
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error("Error fetching payments:", error);
        throw error;
      }
      
      return data as Payment[];
    },
    enabled: !!user,
  });
  
  if (isLoading) {
    return <div>Loading payments...</div>;
  }
  
  if (isError) {
    return <div>Error fetching payments.</div>;
  }
  
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-4">Payments</h1>
      
      <div className="flex justify-between items-center mb-4">
        <Input
          type="search"
          placeholder="Search payments..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-1/3"
        />
        
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-[300px] justify-start text-left font-normal",
                !dateRange?.from && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  `${format(dateRange.from, "LLL dd, y")} - ${format(
                    dateRange.to,
                    "LLL dd, y"
                  )}`
                ) : (
                  format(dateRange.from, "LLL dd, y")
                )
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Affiliate ID</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Fee</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Payment Method</TableHead>
            <TableHead>Created At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments?.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell>{payment.id}</TableCell>
              <TableCell>{payment.affiliate_id}</TableCell>
              <TableCell>{payment.amount}</TableCell>
              <TableCell>{payment.fee}</TableCell>
              <TableCell>{payment.total}</TableCell>
              <TableCell>
                <Badge variant={payment.status === 'paid' ? 'default' : payment.status === 'approved' ? 'default' : payment.status === 'rejected' ? 'destructive' : 'secondary'}>
                  {payment.status}
                </Badge>
              </TableCell>
              <TableCell>{payment.payment_method}</TableCell>
              <TableCell>{new Date(payment.created_at || '').toLocaleDateString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default PaymentsPage;
