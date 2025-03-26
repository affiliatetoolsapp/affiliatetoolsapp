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
import { MoreHorizontal, Search, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Plus } from 'lucide-react';

// Mock data - replace with actual data from your backend
const advertisers = [
  {
    id: 1,
    name: 'Acme Corp',
    email: 'contact@acme.com',
    status: 'Active',
    totalSpent: '$45,678',
    activeOffers: 8,
    conversionRate: '15.2%',
    joinedDate: '2024-01-10',
  },
  // Add more mock data as needed
];

export function AdminAdvertisersPage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Advertisers Management</h1>
        <Button>
          <Building2 className="mr-2 h-4 w-4" />
          Add New Advertiser
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Advertiser Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 bg-card rounded-lg border">
              <h3 className="text-sm font-medium text-muted-foreground">Total Advertisers</h3>
              <p className="text-2xl font-bold">850</p>
            </div>
            <div className="p-4 bg-card rounded-lg border">
              <h3 className="text-sm font-medium text-muted-foreground">Active Advertisers</h3>
              <p className="text-2xl font-bold">720</p>
            </div>
            <div className="p-4 bg-card rounded-lg border">
              <h3 className="text-sm font-medium text-muted-foreground">Total Spent</h3>
              <p className="text-2xl font-bold">$4.5M</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Advertiser List</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search advertisers..."
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
                <TableHead>Company Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total Spent</TableHead>
                <TableHead>Active Offers</TableHead>
                <TableHead>Conversion Rate</TableHead>
                <TableHead>Joined Date</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {advertisers.map((advertiser) => (
                <TableRow key={advertiser.id}>
                  <TableCell>{advertiser.name}</TableCell>
                  <TableCell>{advertiser.email}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      advertiser.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {advertiser.status}
                    </span>
                  </TableCell>
                  <TableCell>{advertiser.totalSpent}</TableCell>
                  <TableCell>{advertiser.activeOffers}</TableCell>
                  <TableCell>{advertiser.conversionRate}</TableCell>
                  <TableCell>{advertiser.joinedDate}</TableCell>
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