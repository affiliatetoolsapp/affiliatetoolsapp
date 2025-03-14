
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Check, X } from 'lucide-react';

export default function AffiliateApprovals() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Optimized query for pending applications
  const { data: applications, isLoading, error } = useQuery({
    queryKey: ['pending-affiliate-applications', user?.id],
    queryFn: async () => {
      if (!user || user.role !== 'advertiser') {
        console.log('User is not an advertiser or not logged in');
        return [];
      }
      
      console.log('Fetching pending applications for advertiser:', user.id);
      
      try {
        // Direct join query to get all pending applications for offers owned by this advertiser
        const { data: pendingApplications, error } = await supabase
          .from('affiliate_offers')
          .select(`
            id, 
            offer_id, 
            affiliate_id,
            applied_at,
            traffic_source,
            notes,
            status,
            offers(id, name, description, niche, advertiser_id),
            users!affiliate_id(id, email, contact_name, company_name, website)
          `)
          .eq('status', 'pending')
          .eq('offers.advertiser_id', user.id);
        
        if (error) {
          console.error('Error fetching applications:', error);
          throw error;
        }
        
        // Filter out any applications that might have null offers
        const validApplications = pendingApplications.filter(app => app.offers !== null);
        
        console.log('Pending applications found:', validApplications);
        return validApplications || [];
      } catch (err) {
        console.error('Error in affiliate applications query:', err);
        throw err;
      }
    },
    enabled: !!user && user.role === 'advertiser',
    refetchInterval: 10000, // Check for updates every 10 seconds
    refetchOnWindowFocus: true,
    staleTime: 0, // Consider data stale immediately
  });
  
  // Mutation to update application status
  const updateApplication = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: 'approved' | 'rejected' }) => {
      console.log(`Updating application ${id} to status: ${status}`);
      
      const { error } = await supabase
        .from('affiliate_offers')
        .update({ 
          status, 
          reviewed_at: new Date().toISOString() 
        })
        .eq('id', id);
      
      if (error) {
        console.error('Error updating application:', error);
        throw error;
      }
      
      return { id, status };
    },
    onSuccess: (data) => {
      // Invalidate all related queries to update all views
      queryClient.invalidateQueries({ queryKey: ['pending-affiliate-applications'] });
      queryClient.invalidateQueries({ queryKey: ['affiliate-applications'] });
      queryClient.invalidateQueries({ queryKey: ['affiliate-offers'] });
      queryClient.invalidateQueries({ queryKey: ['available-offers'] });
      queryClient.invalidateQueries({ queryKey: ['pending-applications-count'] });
      
      toast({
        title: `Application ${data.status}`,
        description: `The affiliate application has been ${data.status}`,
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update application status',
      });
      console.error(error);
    },
  });
  
  const handleApprove = (id: string) => {
    updateApplication.mutate({ id, status: 'approved' });
  };
  
  const handleReject = (id: string) => {
    updateApplication.mutate({ id, status: 'rejected' });
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
        <p className="text-red-500 font-medium mb-2">Error loading applications</p>
        <p className="text-muted-foreground">Please try refreshing the page</p>
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
        <div className="divide-y">
          {applications.map((app) => (
            <div key={app.id} className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">
                    {app.users && ('contact_name' in app.users && app.users.contact_name) 
                      ? app.users.contact_name 
                      : (app.users?.email || 'Unknown Affiliate')}
                  </h4>
                  <p className="text-sm text-muted-foreground">{app.users?.email}</p>
                  <p className="text-sm mt-1">Applied for: <span className="font-medium">{app.offers?.name}</span></p>
                  {app.traffic_source && (
                    <p className="text-sm mt-1">Traffic Source: {app.traffic_source}</p>
                  )}
                  {app.notes && (
                    <p className="text-sm mt-1">Notes: {app.notes}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Applied on {new Date(app.applied_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
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
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
