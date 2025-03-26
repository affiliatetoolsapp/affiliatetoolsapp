import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Search, Download, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Mock data - replace with actual data from your backend
const payments = [
  {
    id: 1,
    affiliate: 'John Doe',
    amount: '$1,234.56',
    status: 'Pending',
    method: 'Bank Transfer',
    date: '2024-03-25',
    reference: 'PAY-123456',
  },
  // Add more mock data as needed
];

export function AdminPaymentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Payments Management</h1>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Export Payments
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payments Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="p-4 bg-card rounded-lg border">
              <h3 className="text-sm font-medium text-muted-foreground">Total Pending</h3>
              <p className="text-2xl font-bold">$45,231.89</p>
            </div>
            <div className="p-4 bg-card rounded-lg border">
              <h3 className="text-sm font-medium text-muted-foreground">Total Processed</h3>
              <p className="text-2xl font-bold">$123,456.78</p>
            </div>
            <div className="p-4 bg-card rounded-lg border">
              <h3 className="text-sm font-medium text-muted-foreground">Total Failed</h3>
              <p className="text-2xl font-bold">$2,345.67</p>
            </div>
            <div className="p-4 bg-card rounded-lg border">
              <h3 className="text-sm font-medium text-muted-foreground">Total Paid</h3>
              <p className="text-2xl font-bold">$1.2M</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Payments List</CardTitle>
            <div className="flex items-center gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processed">Processed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search payments..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Affiliate</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{payment.reference}</TableCell>
                  <TableCell>{payment.affiliate}</TableCell>
                  <TableCell>{payment.amount}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        payment.status === 'Pending'
                          ? 'secondary'
                          : payment.status === 'Processed'
                          ? 'default'
                          : payment.status === 'Failed'
                          ? 'destructive'
                          : 'success'
                      }
                    >
                      {payment.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{payment.method}</TableCell>
                  <TableCell>{payment.date}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Process Payment</DropdownMenuItem>
                        <DropdownMenuItem>Mark as Paid</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          Cancel Payment
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 