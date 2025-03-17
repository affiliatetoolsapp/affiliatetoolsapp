
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ColumnDef } from '@tanstack/react-table';
import { 
  UserCircle2, 
  Search, 
  Users2, 
  UserPlus, 
  UserCheck, 
  UserX, 
  RefreshCw,
  ExternalLink
} from 'lucide-react';

export default function AdminUsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as User[];
    },
  });
  
  const affiliateUsers = users?.filter(user => user.role === 'affiliate') || [];
  const advertiserUsers = users?.filter(user => user.role === 'advertiser') || [];
  const adminUsers = users?.filter(user => user.role === 'admin') || [];
  
  const userColumns: ColumnDef<User>[] = [
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => (
        <div className="font-medium">{row.original.email}</div>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => {
        const role = row.original.role;
        return (
          <Badge className={
            role === 'admin' 
              ? 'bg-red-100 text-red-800' 
              : role === 'advertiser' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-green-100 text-green-800'
          }>
            {role}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'contact_name',
      header: 'Name',
      cell: ({ row }) => row.original.contact_name || 'N/A',
    },
    {
      accessorKey: 'company_name',
      header: 'Company',
      cell: ({ row }) => row.original.company_name || 'N/A',
    },
    {
      accessorKey: 'created_at',
      header: 'Joined',
      cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString(),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button size="sm" variant="outline">
            View
          </Button>
          <Button size="sm" variant="outline">
            Edit
          </Button>
        </div>
      ),
    },
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users Management</h1>
          <p className="text-muted-foreground">
            View and manage all platform users
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>
      
      <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Affiliates</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{affiliateUsers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Advertisers</CardTitle>
            <UserCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{advertiserUsers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminUsers.length}</div>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search users..." 
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Users</TabsTrigger>
          <TabsTrigger value="affiliates">Affiliates</TabsTrigger>
          <TabsTrigger value="advertisers">Advertisers</TabsTrigger>
          <TabsTrigger value="admins">Administrators</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <DataTable 
                columns={userColumns} 
                data={users || []} 
                isLoading={isLoading}
                filterableColumns={[
                  { id: 'role', title: 'Role', type: 'select', options: [
                    { label: 'Affiliate', value: 'affiliate' },
                    { label: 'Advertiser', value: 'advertiser' },
                    { label: 'Admin', value: 'admin' },
                  ]}
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="affiliates" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <DataTable 
                columns={userColumns} 
                data={affiliateUsers} 
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="advertisers" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <DataTable 
                columns={userColumns} 
                data={advertiserUsers} 
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="admins" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <DataTable 
                columns={userColumns} 
                data={adminUsers} 
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
