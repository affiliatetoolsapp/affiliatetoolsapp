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
import { MoreHorizontal, Search, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Mock data - replace with actual data from your backend
const offers = [
  {
    id: 1,
    name: 'Summer Sale Campaign',
    advertiser: 'Acme Corp',
    payout: '$25.00',
    status: 'Active',
    conversions: 156,
    revenue: '$3,900',
    conversionRate: '12.5%',
    startDate: '2024-03-01',
    endDate: '2024-04-30',
  },
  // Add more mock data as needed
];

export function AdminOffersPage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Offers Management</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create New Offer
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Offers Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="p-4 bg-card rounded-lg border">
              <h3 className="text-sm font-medium text-muted-foreground">Total Offers</h3>
              <p className="text-2xl font-bold">1,234</p>
            </div>
            <div className="p-4 bg-card rounded-lg border">
              <h3 className="text-sm font-medium text-muted-foreground">Active Offers</h3>
              <p className="text-2xl font-bold">890</p>
            </div>
            <div className="p-4 bg-card rounded-lg border">
              <h3 className="text-sm font-medium text-muted-foreground">Total Revenue</h3>
              <p className="text-2xl font-bold">$2.5M</p>
            </div>
            <div className="p-4 bg-card rounded-lg border">
              <h3 className="text-sm font-medium text-muted-foreground">Avg. Conversion Rate</h3>
              <p className="text-2xl font-bold">14.2%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Offers List</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search offers..."
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
                <TableHead>Offer Name</TableHead>
                <TableHead>Advertiser</TableHead>
                <TableHead>Payout</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Conversions</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Conversion Rate</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {offers.map((offer) => (
                <TableRow key={offer.id}>
                  <TableCell>{offer.name}</TableCell>
                  <TableCell>{offer.advertiser}</TableCell>
                  <TableCell>{offer.payout}</TableCell>
                  <TableCell>
                    <Badge variant={offer.status === 'Active' ? 'default' : 'secondary'}>
                      {offer.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{offer.conversions}</TableCell>
                  <TableCell>{offer.revenue}</TableCell>
                  <TableCell>{offer.conversionRate}</TableCell>
                  <TableCell>
                    {offer.startDate} - {offer.endDate}
                  </TableCell>
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
                        <DropdownMenuItem>Pause</DropdownMenuItem>
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