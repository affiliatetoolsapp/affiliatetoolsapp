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
import { MoreHorizontal, Search, UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Mock data - replace with actual data from your backend
const affiliates = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    status: 'Active',
    totalEarnings: '$12,345',
    activeOffers: 15,
    conversionRate: '12.5%',
    joinedDate: '2024-01-15',
  },
  // Add more mock data as needed
];

export function AdminAffiliatesPage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Affiliates Management</h1>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Add New Affiliate
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Affiliate Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 bg-card rounded-lg border">
              <h3 className="text-sm font-medium text-muted-foreground">Total Affiliates</h3>
              <p className="text-2xl font-bold">2,350</p>
            </div>
            <div className="p-4 bg-card rounded-lg border">
              <h3 className="text-sm font-medium text-muted-foreground">Active Affiliates</h3>
              <p className="text-2xl font-bold">1,890</p>
            </div>
            <div className="p-4 bg-card rounded-lg border">
              <h3 className="text-sm font-medium text-muted-foreground">Total Earnings</h3>
              <p className="text-2xl font-bold">$1.2M</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Affiliate List</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search affiliates..."
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
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total Earnings</TableHead>
                <TableHead>Active Offers</TableHead>
                <TableHead>Conversion Rate</TableHead>
                <TableHead>Joined Date</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {affiliates.map((affiliate) => (
                <TableRow key={affiliate.id}>
                  <TableCell>{affiliate.name}</TableCell>
                  <TableCell>{affiliate.email}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      affiliate.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {affiliate.status}
                    </span>
                  </TableCell>
                  <TableCell>{affiliate.totalEarnings}</TableCell>
                  <TableCell>{affiliate.activeOffers}</TableCell>
                  <TableCell>{affiliate.conversionRate}</TableCell>
                  <TableCell>{affiliate.joinedDate}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>Suspend</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
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