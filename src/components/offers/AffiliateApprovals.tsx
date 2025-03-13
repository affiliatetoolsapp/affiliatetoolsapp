
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
  
  // Get affiliate applications for my offers
  const { data: applications, isLoading, refetch } = useQuery({
    queryKey: ['affiliate-applications', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      console.log('Fetching affiliate applications for advertiser:', user.id);
      
      // First get all offers from this advertiser
      const { data: myOffers, error: offersError } = await supabase
        .from('offers')
        .select('id')
        .eq('advertiser_id', user.id);
      
      if (offersError) {
        console.error('Error fetching offers:', offersError);
        throw offersError;
      }
      
      if (!myOffers || myOffers.length === 0) {
        console.log('No offers found for this advertiser');
        return [];
      }
      
      console.log('Found offers:', myOffers.map(o => o.id));
      
      // Then get all pending applications for these offers
      const offerIds = myOffers.map(offer => offer.id);
      
      const { data, error } = await supabase
        .from('affiliate_offers')
        .select(`
          *,
          offers!inner(*),
          affiliates:users!affiliate_id(*)
        `)
        .in('offer_id', offerIds)
        .eq('status', 'pending');
      
      if (error) {
        console.error('Error fetching applications:', error);
        throw error;
      }
      
      console.log('Found applications:', data);
      return data;
    },
    enabled: !!user && user.role === 'advertiser',
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
      // Invalidate multiple related queries to update all views
      queryClient.invalidateQueries({ queryKey: ['affiliate-applications'] });
      queryClient.invalidateQueries({ queryKey: ['affiliate-offers'] });
      queryClient.invalidateQueries({ queryKey: ['available-offers'] });
      
      toast({
        title: `Application ${data.status}`,
        description: `The affiliate application has been ${data.status}`,
      });
      
      // Immediately refetch the current list to update the UI
      refetch();
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
          {applications.map((app: any) => (
            <div key={app.id} className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{app.affiliates.contact_name || app.affiliates.email}</h4>
                  <p className="text-sm text-muted-foreground">{app.affiliates.email}</p>
                  <p className="text-sm mt-1">Applied for: <span className="font-medium">{app.offers.name}</span></p>
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
