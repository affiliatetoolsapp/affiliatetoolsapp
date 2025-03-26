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
import { MoreHorizontal, Search, Upload, FileText, FileCheck, FileX } from 'lucide-react';
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
const documents = [
  {
    id: 1,
    name: 'Tax Form W-9',
    type: 'Tax Document',
    status: 'Pending',
    uploadedBy: 'John Doe',
    uploadedAt: '2024-03-25',
    size: '2.5 MB',
  },
  // Add more mock data as needed
];

export function AdminDocumentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Documents Management</h1>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Documents Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 bg-card rounded-lg border">
              <h3 className="text-sm font-medium text-muted-foreground">Total Documents</h3>
              <p className="text-2xl font-bold">1,234</p>
            </div>
            <div className="p-4 bg-card rounded-lg border">
              <h3 className="text-sm font-medium text-muted-foreground">Pending Review</h3>
              <p className="text-2xl font-bold">45</p>
            </div>
            <div className="p-4 bg-card rounded-lg border">
              <h3 className="text-sm font-medium text-muted-foreground">Verified Documents</h3>
              <p className="text-2xl font-bold">1,189</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Documents List</CardTitle>
            <div className="flex items-center gap-4">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="tax">Tax Documents</SelectItem>
                  <SelectItem value="identity">Identity Documents</SelectItem>
                  <SelectItem value="contract">Contracts</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
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
                <TableHead>Document Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Uploaded By</TableHead>
                <TableHead>Upload Date</TableHead>
                <TableHead>Size</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((document) => (
                <TableRow key={document.id}>
                  <TableCell className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    {document.name}
                  </TableCell>
                  <TableCell>{document.type}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        document.status === 'Pending'
                          ? 'secondary'
                          : document.status === 'Verified'
                          ? 'success'
                          : 'destructive'
                      }
                    >
                      {document.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{document.uploadedBy}</TableCell>
                  <TableCell>{document.uploadedAt}</TableCell>
                  <TableCell>{document.size}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Document</DropdownMenuItem>
                        <DropdownMenuItem>Download</DropdownMenuItem>
                        <DropdownMenuItem>Verify</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          Delete
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