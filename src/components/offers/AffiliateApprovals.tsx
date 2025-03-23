import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Check, X, AlertCircle, ExternalLink, Info, User } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';

// Define types for the applications
type PendingApplication = {
  id: string;
  offer_id: string;
  affiliate_id: string;
  applied_at: string;
  traffic_source: string | null;
  notes: string | null;
  status: string;
  reviewed_at: string | null;
  offers: {
    id: string;
    name: string;
    description: string | null;
    niche: string | null;
    advertiser_id: string;
  };
  users: {
    id: string;
    email: string;
    contact_name: string | null;
    company_name: string | null;
    website: string | null;
    bio?: string | null;
    phone?: string | null;
  };
};

export default function AffiliateApprovals() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedApplication, setSelectedApplication] = React.useState<PendingApplication | null>(null);
  
  // Fetch pending applications using the database function
  const { data: applications, isLoading, error } = useQuery({
    queryKey: ['pending-affiliate-applications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      console.log('Fetching pending applications for advertiser:', user.id);
      
      // Use the database function to get pending applications
      const { data, error } = await supabase
        .rpc('get_advertiser_pending_applications', {
          advertiser_id: user.id
        });
      
      if (error) {
        console.error('Error fetching pending applications:', error);
        throw error;
      }
      
      console.log('Pending applications data:', data);
      return (data || []) as PendingApplication[];
    },
    refetchInterval: 30000, // Check every 30 seconds
    refetchOnWindowFocus: true
  });
  
  // Mutation to update application status
  const updateApplication = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: 'approved' | 'rejected' }) => {
      const { data, error } = await supabase
        .from('affiliate_offers')
        .update({ 
          status, 
          reviewed_at: new Date().toISOString() 
        })
        .eq('id', id)
        .select();
      
      if (error) {
        throw error;
      }
      
      return { id, status, data };
    },
    onSuccess: (data) => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['pending-affiliate-applications'] });
      queryClient.invalidateQueries({ queryKey: ['pending-applications-count'] });
      queryClient.invalidateQueries({ queryKey: ['affiliate-applications'] });
      queryClient.invalidateQueries({ queryKey: ['affiliate-offers'] });
      queryClient.invalidateQueries({ queryKey: ['available-offers'] });
      
      toast({
        title: `Application ${data.status}`,
        description: `The affiliate application has been ${data.status}`,
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to update application status: ${error.message}`,
      });
    },
  });
  
  const handleApprove = (id: string) => {
    updateApplication.mutate({ id, status: 'approved' });
    setSelectedApplication(null);
  };
  
  const handleReject = (id: string) => {
    updateApplication.mutate({ id, status: 'rejected' });
    setSelectedApplication(null);
  };

  const handleViewDetails = (application: PendingApplication) => {
    setSelectedApplication(application);
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <Card className="p-8 text-center">
        <div className="flex flex-col items-center gap-2">
          <AlertCircle className="h-8 w-8 text-red-500" />
          <p className="text-red-500 font-medium mb-2">Error loading applications</p>
          <p className="text-muted-foreground">Please try refreshing the page</p>
          <pre className="mt-4 p-4 bg-muted text-left text-xs overflow-auto rounded-md max-w-full">
            {JSON.stringify(error, null, 2)}
          </pre>
        </div>
      </Card>
    );
  }
  
  if (!applications || applications.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">You don't have any pending affiliate applications</p>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <div className="p-4 bg-muted/50">
          <h3 className="text-lg font-semibold">Pending Affiliate Applications</h3>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Affiliate</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Offer</TableHead>
              <TableHead>Applied On</TableHead>
              <TableHead>Traffic Source</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.map((app) => (
              <TableRow key={app.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0"
                      onClick={() => handleViewDetails(app)}
                    >
                      <Info className="h-4 w-4" />
                      <span className="sr-only">View affiliate details</span>
                    </Button>
                    <span>
                      Affiliate ID: {app.affiliate_id}
                    </span>
                  </div>
                </TableCell>
                <TableCell>Hidden for Privacy</TableCell>
                <TableCell>
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <span className="cursor-help underline decoration-dotted">
                        {app.offers?.name}
                      </span>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80">
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold">{app.offers?.name}</h4>
                        <p className="text-sm">{app.offers?.description || 'No description available'}</p>
                        {app.offers?.niche && (
                          <div className="flex items-center">
                            <span className="text-xs text-muted-foreground">Niche: {app.offers.niche}</span>
                          </div>
                        )}
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                </TableCell>
                <TableCell>{new Date(app.applied_at).toLocaleDateString()}</TableCell>
                <TableCell>{app.traffic_source || '-'}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleApprove(app.id)}
                      disabled={updateApplication.isPending}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleReject(app.id)}
                      disabled={updateApplication.isPending}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Application Details Dialog */}
      <Dialog open={!!selectedApplication} onOpenChange={() => setSelectedApplication(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>
              Review the affiliate's application details
            </DialogDescription>
          </DialogHeader>
          
          {selectedApplication && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-1">Affiliate ID</h4>
                <p>{selectedApplication.affiliate_id}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-1">Applied For</h4>
                <p>{selectedApplication.offers?.name}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-1">Application Date</h4>
                <p>{new Date(selectedApplication.applied_at).toLocaleDateString()}</p>
              </div>
              
              {selectedApplication.traffic_source && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Traffic Source</h4>
                  <p>{selectedApplication.traffic_source}</p>
                </div>
              )}
              
              {selectedApplication.notes && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Notes</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {selectedApplication.notes}
                  </p>
                </div>
              )}
              
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setSelectedApplication(null)}
                >
                  Close
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleReject(selectedApplication.id)}
                  disabled={updateApplication.isPending}
                >
                  <X className="h-4 w-4 mr-1" />
                  Reject
                </Button>
                <Button
                  onClick={() => handleApprove(selectedApplication.id)}
                  disabled={updateApplication.isPending}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Approve
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
