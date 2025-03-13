
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AffiliateOffer, Offer } from '@/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, ExternalLink, Link as LinkIcon, Clock, Check, X, Grid, List, Trash } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export default function AffiliateOffers() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get approved offers for this affiliate with improved query
  const { data: approvedOffers, isLoading: approvedLoading } = useQuery({
    queryKey: ['affiliate-approved-offers', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      console.log("Fetching approved offers for affiliate:", user.id);
      
      const { data, error } = await supabase
        .from('affiliate_offers')
        .select('*, offer:offers(*)')
        .eq('affiliate_id', user.id)
        .eq('status', 'approved');
      
      if (error) {
        console.error("Error fetching approved offers:", error);
        throw error;
      }
      
      console.log("Approved offers fetched:", data?.length);
      return data as (AffiliateOffer & { offer: Offer })[];
    },
    enabled: !!user && user.role === 'affiliate',
  });
  
  // Get pending applications for this affiliate with improved query
  const { data: pendingApplications, isLoading: pendingLoading } = useQuery({
    queryKey: ['affiliate-pending-offers', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      console.log("Fetching pending applications for affiliate:", user.id);
      
      const { data, error } = await supabase
        .from('affiliate_offers')
        .select('*, offer:offers(*)')
        .eq('affiliate_id', user.id)
        .eq('status', 'pending');
      
      if (error) {
        console.error("Error fetching pending applications:", error);
        throw error;
      }
      
      console.log("Pending applications fetched:", data?.length, data);
      return data as (AffiliateOffer & { offer: Offer })[];
    },
    enabled: !!user && user.role === 'affiliate',
    refetchInterval: 5000, // More frequent updates
  });
  
  // Get rejected applications for this affiliate with improved query
  const { data: rejectedApplications, isLoading: rejectedLoading } = useQuery({
    queryKey: ['affiliate-rejected-offers', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      console.log("Fetching rejected applications for affiliate:", user.id);
      
      const { data, error } = await supabase
        .from('affiliate_offers')
        .select('*, offer:offers(*)')
        .eq('affiliate_id', user.id)
        .eq('status', 'rejected');
      
      if (error) {
        console.error("Error fetching rejected applications:", error);
        throw error;
      }
      
      console.log("Rejected applications fetched:", data?.length);
      return data as (AffiliateOffer & { offer: Offer })[];
    },
    enabled: !!user && user.role === 'affiliate',
  });
  
  // Cancel application mutation with improved error handling
  const cancelApplication = useMutation({
    mutationFn: async (applicationId: string) => {
      console.log("Cancelling application:", applicationId);
      
      const { error } = await supabase
        .from('affiliate_offers')
        .delete()
        .eq('id', applicationId);
      
      if (error) {
        console.error("Error cancelling application:", error);
        throw error;
      }
      
      console.log("Application cancelled successfully");
      return applicationId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliate-pending-offers'] });
      toast({
        title: 'Application Cancelled',
        description: 'Your application has been successfully cancelled',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to cancel application. Please try again.',
      });
      console.error(error);
    }
  });
  
  // Filter offers based on search query
  const filteredApprovedOffers = approvedOffers?.filter(item => 
    item.offer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.offer.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.offer.niche?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const isLoading = approvedLoading || pendingLoading || rejectedLoading;
  
  const handleCancelApplication = (applicationId: string) => {
    cancelApplication.mutate(applicationId);
  };
  
  const renderPendingTable = (applications: (AffiliateOffer & { offer: Offer })[]) => (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Offer</TableHead>
            <TableHead>Applied On</TableHead>
            <TableHead>Traffic Source</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.map((application) => (
            <TableRow key={application.id}>
              <TableCell className="font-medium">{application.offer.name}</TableCell>
              <TableCell>{new Date(application.applied_at || '').toLocaleDateString()}</TableCell>
              <TableCell>{application.traffic_source || '-'}</TableCell>
              <TableCell>
                <Badge variant="secondary">
                  <Clock className="h-3 w-3 mr-1" />
                  Pending
                </Badge>
              </TableCell>
              <TableCell>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-destructive">
                      <Trash className="h-3 w-3 mr-1" />
                      Cancel
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel Application</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to cancel your application for "{application.offer.name}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>No, keep it</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleCancelApplication(application.id)}>
                        Yes, cancel application
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
  
  const renderRejectedTable = (applications: (AffiliateOffer & { offer: Offer })[]) => (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Offer</TableHead>
            <TableHead>Applied On</TableHead>
            <TableHead>Reviewed On</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.map((application) => (
            <TableRow key={application.id}>
              <TableCell className="font-medium">{application.offer.name}</TableCell>
              <TableCell>{new Date(application.applied_at || '').toLocaleDateString()}</TableCell>
              <TableCell>
                {application.reviewed_at ? 
                  new Date(application.reviewed_at).toLocaleDateString() : 
                  'Not yet reviewed'}
              </TableCell>
              <TableCell>
                <Badge variant="destructive">
                  <X className="h-3 w-3 mr-1" />
                  Rejected
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Offers</h1>
        <p className="text-muted-foreground">
          Manage your approved offers and tracking links
        </p>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search" 
            placeholder="Search your offers..." 
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center border rounded-md">
          <Button 
            variant={viewMode === 'grid' ? 'default' : 'ghost'} 
            size="sm" 
            className="rounded-r-none" 
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button 
            variant={viewMode === 'list' ? 'default' : 'ghost'} 
            size="sm" 
            className="rounded-l-none" 
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active Offers</TabsTrigger>
          <TabsTrigger value="pending">
            Pending Applications
            {pendingApplications?.length ? (
              <Badge variant="secondary" className="ml-2">{pendingApplications.length}</Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="links">My Tracking Links</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredApprovedOffers?.length ? (
            viewMode === 'grid' ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredApprovedOffers.map((affiliateOffer) => (
                  <Card key={affiliateOffer.id} className="overflow-hidden">
                    <CardHeader className="p-4">
                      <CardTitle className="text-lg">{affiliateOffer.offer.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {affiliateOffer.offer.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 grid gap-2">
                      <div className="text-sm">
                        <span className="font-medium">Commission: </span>
                        {affiliateOffer.offer.commission_type === 'RevShare' 
                          ? `${affiliateOffer.offer.commission_percent}% Revenue Share` 
                          : `$${affiliateOffer.offer.commission_amount} per ${affiliateOffer.offer.commission_type.slice(2)}`}
                      </div>
                      
                      {affiliateOffer.offer.niche && (
                        <div className="text-sm">
                          <span className="font-medium">Niche: </span>
                          {affiliateOffer.offer.niche}
                        </div>
                      )}
                      
                      <div className="mt-4 flex justify-between">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => window.open(affiliateOffer.offer.url, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Preview
                        </Button>
                        
                        <Button
                          size="sm"
                          onClick={() => {
                            window.location.href = `/links?offer=${affiliateOffer.offer_id}`;
                          }}
                        >
                          <LinkIcon className="h-4 w-4 mr-2" />
                          Generate Links
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              // Render table for approved offers
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Offer</TableHead>
                      <TableHead>Niche</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredApprovedOffers.map((affiliateOffer) => (
                      <TableRow key={affiliateOffer.id}>
                        <TableCell className="font-medium">{affiliateOffer.offer.name}</TableCell>
                        <TableCell>{affiliateOffer.offer.niche || '-'}</TableCell>
                        <TableCell>
                          {affiliateOffer.offer.commission_type === 'RevShare' 
                            ? `${affiliateOffer.offer.commission_percent}% Revenue Share` 
                            : `$${affiliateOffer.offer.commission_amount} per ${affiliateOffer.offer.commission_type.slice(2)}`}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => window.open(affiliateOffer.offer.url, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Preview
                            </Button>
                            
                            <Button
                              size="sm"
                              onClick={() => {
                                window.location.href = `/links?offer=${affiliateOffer.offer_id}`;
                              }}
                            >
                              <LinkIcon className="h-4 w-4 mr-2" />
                              Links
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground mb-4">You don't have any approved offers yet</p>
              <Button 
                onClick={() => {
                  window.location.href = '/marketplace';
                }}
              >
                Browse Marketplace
              </Button>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="pending">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : pendingApplications?.length ? (
            viewMode === 'grid' ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {pendingApplications.map((application) => (
                  <Card key={application.id} className="overflow-hidden">
                    <CardHeader className="p-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{application.offer?.name}</CardTitle>
                        <Badge variant="outline" className="ml-2">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      </div>
                      <CardDescription className="line-clamp-2">
                        {application.offer?.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 grid gap-2">
                      <div className="text-sm">
                        <span className="font-medium">Applied on: </span>
                        {new Date(application.applied_at || '').toLocaleDateString()}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Traffic Source: </span>
                        {application.traffic_source}
                      </div>
                      {application.notes && (
                        <div className="text-sm">
                          <span className="font-medium">Your Notes: </span>
                          {application.notes}
                        </div>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" className="mt-2 text-destructive">
                            <Trash className="h-4 w-4 mr-2" />
                            Cancel Application
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Cancel Application</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to cancel your application for "{application.offer?.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>No, keep it</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleCancelApplication(application.id)}>
                              Yes, cancel application
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Offer</TableHead>
                      <TableHead>Applied On</TableHead>
                      <TableHead>Traffic Source</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingApplications.map((application) => (
                      <TableRow key={application.id}>
                        <TableCell className="font-medium">{application.offer?.name}</TableCell>
                        <TableCell>{new Date(application.applied_at || '').toLocaleDateString()}</TableCell>
                        <TableCell>{application.traffic_source || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-destructive">
                                <Trash className="h-3 w-3 mr-1" />
                                Cancel
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Cancel Application</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to cancel your application for "{application.offer?.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>No, keep it</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleCancelApplication(application.id)}>
                                  Yes, cancel application
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">You don't have any pending applications</p>
              <Button 
                onClick={() => {
                  window.location.href = '/marketplace';
                }}
                className="mt-4"
              >
                Browse Marketplace
              </Button>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="rejected">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : rejectedApplications?.length ? (
            viewMode === 'grid' ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {rejectedApplications.map((application) => (
                  <Card key={application.id} className="overflow-hidden">
                    <CardHeader className="p-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{application.offer.name}</CardTitle>
                        <Badge variant="destructive" className="ml-2">
                          <X className="h-3 w-3 mr-1" />
                          Rejected
                        </Badge>
                      </div>
                      <CardDescription className="line-clamp-2">
                        {application.offer.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 grid gap-2">
                      <div className="text-sm">
                        <span className="font-medium">Applied on: </span>
                        {new Date(application.applied_at || '').toLocaleDateString()}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Reviewed on: </span>
                        {application.reviewed_at ? 
                          new Date(application.reviewed_at).toLocaleDateString() : 
                          'Not yet reviewed'}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => window.location.href = '/marketplace'}
                      >
                        Find Similar Offers
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              renderRejectedTable(rejectedApplications)
            )
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">You don't have any rejected applications</p>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="links">
          <Card className="p-6">
            <p className="mb-4">To view and generate tracking links for specific offers, please select an offer from the Active Offers tab.</p>
            <Button
              onClick={() => {
                window.location.href = '/links';
              }}
            >
              Go to Links Page
            </Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
