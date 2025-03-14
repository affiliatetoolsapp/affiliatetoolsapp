
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Check, X, AlertCircle, ExternalLink } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

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
  };
};

export default function AffiliateApprovals() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch pending applications with multiple approaches to debug
  const { data: applications, isLoading, error } = useQuery({
    queryKey: ['pending-affiliate-applications', user?.id],
    queryFn: async () => {
      console.log('[AffiliateApprovals] Starting query with advertiser ID:', user?.id);
      
      if (!user?.id) {
        console.log('[AffiliateApprovals] No user ID available');
        return [];
      }
      
      // DIAGNOSTIC: Get all affiliate_offers regardless of status or offer
      const { data: allApplications, error: allAppsError } = await supabase
        .from('affiliate_offers')
        .select('*');
      
      console.log('[DIAGNOSTIC] All applications in system:', allApplications || []);
      
      if (allAppsError) {
        console.error('[DIAGNOSTIC] Error fetching all applications:', allAppsError);
      }
      
      // DIAGNOSTIC: Get all pending applications regardless of offer
      const { data: allPending, error: pendingError } = await supabase
        .from('affiliate_offers')
        .select('*')
        .eq('status', 'pending');
      
      console.log('[DIAGNOSTIC] All pending applications in system:', allPending || []);
      
      if (pendingError) {
        console.error('[DIAGNOSTIC] Error fetching all pending applications:', pendingError);
      }
      
      // Get all offers from this advertiser for reference
      const { data: offers, error: offersError } = await supabase
        .from('offers')
        .select('id, name, advertiser_id')
        .eq('advertiser_id', user.id);
      
      if (offersError) {
        console.error('[AffiliateApprovals] Error fetching offers:', offersError);
        throw offersError;
      }
      
      console.log('[AffiliateApprovals] Found advertiser offers:', offers || []);
      
      if (!offers || offers.length === 0) {
        console.log('[AffiliateApprovals] No offers found for this advertiser');
        return [];
      }
      
      const offerIds = offers.map(offer => offer.id);
      console.log('[AffiliateApprovals] Offer IDs to check for applications:', offerIds);
      
      // APPROACH 1: Try direct query with proper join syntax
      const { data: pendingApps1, error: appsError1 } = await supabase
        .from('affiliate_offers')
        .select(`
          id, 
          offer_id,
          affiliate_id,
          applied_at,
          traffic_source,
          notes,
          status,
          reviewed_at,
          offers:offer_id (id, name, description, niche, advertiser_id),
          users:affiliate_id (id, email, contact_name, company_name, website)
        `)
        .eq('status', 'pending')
        .in('offer_id', offerIds);
      
      console.log('[APPROACH 1] Direct join results:', pendingApps1 || []);
      
      if (appsError1) {
        console.error('[APPROACH 1] Error:', appsError1);
      }
      
      // APPROACH 2: Try using a different join technique
      const { data: pendingApps2, error: appsError2 } = await supabase
        .from('affiliate_offers')
        .select(`
          *,
          offers!inner(*),
          users!inner(*)
        `)
        .eq('status', 'pending')
        .in('offer_id', offerIds);
      
      console.log('[APPROACH 2] Inner join results:', pendingApps2 || []);
      
      if (appsError2) {
        console.error('[APPROACH 2] Error:', appsError2);
      }
      
      // APPROACH 3: Try the database function
      try {
        const { data: functionData, error: functionError } = await supabase
          .rpc('get_advertiser_pending_applications', { 
            advertiser_id: user.id 
          });
        
        console.log('[APPROACH 3] Function results:', functionData || []);
        
        if (functionError) {
          console.error('[APPROACH 3] Error using function:', functionError);
        }
        
        // If function works, return its data
        if (functionData && functionData.length > 0) {
          return functionData as PendingApplication[];
        }
      } catch (err) {
        console.error('[APPROACH 3] Exception using function:', err);
      }
      
      // APPROACH 4: Simple two-step query
      // First get applications
      const { data: simpleApps, error: simpleError } = await supabase
        .from('affiliate_offers')
        .select('*')
        .eq('status', 'pending')
        .in('offer_id', offerIds);
      
      console.log('[APPROACH 4] Simple query results:', simpleApps || []);
      
      if (simpleError) {
        console.error('[APPROACH 4] Error:', simpleError);
      }
      
      // If we have applications, enrich them with offer and user data
      if (simpleApps && simpleApps.length > 0) {
        const enrichedApps = await Promise.all(simpleApps.map(async (app) => {
          // Get offer details
          const { data: offerData } = await supabase
            .from('offers')
            .select('id, name, description, niche, advertiser_id')
            .eq('id', app.offer_id)
            .single();
          
          // Get affiliate user details
          const { data: userData } = await supabase
            .from('users')
            .select('id, email, contact_name, company_name, website')
            .eq('id', app.affiliate_id)
            .single();
          
          return {
            ...app,
            offers: offerData,
            users: userData
          };
        }));
        
        console.log('[APPROACH 4] Enriched applications:', enrichedApps);
        return enrichedApps as PendingApplication[];
      }
      
      // Default to approach 1 results if available
      if (pendingApps1 && pendingApps1.length > 0) {
        return pendingApps1 as PendingApplication[];
      }
      
      // Fall back to approach 2
      if (pendingApps2 && pendingApps2.length > 0) {
        return pendingApps2.map(app => ({
          ...app,
          offers: app.offers,
          users: app.users
        })) as PendingApplication[];
      }
      
      console.log('[AffiliateApprovals] No pending applications found with any approach');
      return [];
    },
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
    staleTime: 0
  });
  
  // Mutation to update application status
  const updateApplication = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: 'approved' | 'rejected' }) => {
      console.log(`[AffiliateApprovals] Updating application ${id} to status: ${status}`);
      
      const { data, error } = await supabase
        .from('affiliate_offers')
        .update({ 
          status, 
          reviewed_at: new Date().toISOString() 
        })
        .eq('id', id)
        .select();
      
      if (error) {
        console.error('[AffiliateApprovals] Error updating application:', error);
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
      console.error('Error updating application:', error);
    },
  });
  
  const handleApprove = (id: string) => {
    updateApplication.mutate({ id, status: 'approved' });
  };
  
  const handleReject = (id: string) => {
    updateApplication.mutate({ id, status: 'rejected' });
  };
  
  // For debugging - log when the component mounts
  useEffect(() => {
    console.log('[AffiliateApprovals] Component mounted');
    
    // Direct check in console to verify database content
    const checkApplications = async () => {
      if (!user?.id) return;
      
      console.log('[DIAGNOSTIC CHECK] Running diagnostic check for user ID:', user.id);
      
      // Get all pending applications regardless of offer
      const { data: allPending } = await supabase
        .from('affiliate_offers')
        .select('*')
        .eq('status', 'pending');
      
      console.log('[DIAGNOSTIC CHECK] All pending applications in system:', allPending || []);
      
      // Get all offers
      const { data: allOffers } = await supabase
        .from('offers')
        .select('id, name, advertiser_id');
      
      console.log('[DIAGNOSTIC CHECK] All offers in system:', allOffers || []);
      
      // Get offers for this advertiser
      const { data: offers } = await supabase
        .from('offers')
        .select('id, name, advertiser_id')
        .eq('advertiser_id', user.id);
      
      console.log('[DIAGNOSTIC CHECK] Advertiser offers:', offers || []);
      
      if (offers && offers.length > 0) {
        // Get all pending applications for these offers
        const offerIds = offers.map(offer => offer.id);
        const { data: pendingApps } = await supabase
          .from('affiliate_offers')
          .select('id, offer_id, affiliate_id, status')
          .eq('status', 'pending')
          .in('offer_id', offerIds);
        
        console.log('[DIAGNOSTIC CHECK] Pending applications for advertiser offers:', pendingApps || []);
      }
    };
    
    checkApplications();
  }, [user?.id]);
  
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
                  {app.users?.contact_name || 'Unknown Affiliate'}
                  {app.users?.website && (
                    <a 
                      href={app.users.website.startsWith('http') ? app.users.website : `https://${app.users.website}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-xs text-muted-foreground hover:text-primary ml-2"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Website
                    </a>
                  )}
                </TableCell>
                <TableCell>{app.users?.email}</TableCell>
                <TableCell>{app.offers?.name}</TableCell>
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
    </div>
  );
}
