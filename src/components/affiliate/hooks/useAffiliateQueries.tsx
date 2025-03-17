
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AffiliateOfferWithOffer, TrackingLinkWithOffer } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

/**
 * A custom hook that provides all affiliate offer-related queries and mutations
 */
export const useAffiliateQueries = (userId: string | undefined) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get approved offers for this affiliate
  const { 
    data: approvedOffers, 
    isLoading: approvedLoading 
  } = useQuery({
    queryKey: ['affiliate-approved-offers', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      console.log("Fetching approved offers for affiliate:", userId);
      
      const { data, error } = await supabase
        .from('affiliate_offers')
        .select('*, offer:offers(*)')
        .eq('affiliate_id', userId)
        .eq('status', 'approved');
      
      if (error) {
        console.error("Error fetching approved offers:", error);
        throw error;
      }
      
      console.log("Approved offers fetched:", data?.length);
      return data as AffiliateOfferWithOffer[];
    },
    enabled: !!userId,
  });
  
  // Get pending applications for this affiliate
  const { 
    data: pendingApplications, 
    isLoading: pendingLoading 
  } = useQuery({
    queryKey: ['affiliate-pending-offers', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      console.log("Fetching pending applications for affiliate:", userId);
      
      const { data, error } = await supabase
        .from('affiliate_offers')
        .select('*, offer:offers(*)')
        .eq('affiliate_id', userId)
        .eq('status', 'pending');
      
      if (error) {
        console.error("Error fetching pending applications:", error);
        throw error;
      }
      
      console.log("Pending applications fetched:", data?.length);
      return data as AffiliateOfferWithOffer[];
    },
    enabled: !!userId,
    refetchInterval: 5000, // More frequent updates
  });
  
  // Get rejected applications for this affiliate
  const { 
    data: rejectedApplications, 
    isLoading: rejectedLoading 
  } = useQuery({
    queryKey: ['affiliate-rejected-offers', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      console.log("Fetching rejected applications for affiliate:", userId);
      
      const { data, error } = await supabase
        .from('affiliate_offers')
        .select('*, offer:offers(*)')
        .eq('affiliate_id', userId)
        .eq('status', 'rejected');
      
      if (error) {
        console.error("Error fetching rejected applications:", error);
        throw error;
      }
      
      console.log("Rejected applications fetched:", data?.length);
      return data as AffiliateOfferWithOffer[];
    },
    enabled: !!userId,
  });

  // Get tracking links for this affiliate
  const { 
    data: trackingLinks, 
    isLoading: trackingLinksLoading 
  } = useQuery({
    queryKey: ['affiliate-tracking-links', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      console.log("Fetching tracking links for affiliate:", userId);
      
      const { data, error } = await supabase
        .from('tracking_links')
        .select(`
          *,
          offer:offers(id, name, commission_type, commission_amount, commission_percent)
        `)
        .eq('affiliate_id', userId);
      
      if (error) {
        console.error("Error fetching tracking links:", error);
        throw error;
      }
      
      console.log("Tracking links fetched:", data?.length);
      return data as TrackingLinkWithOffer[];
    },
    enabled: !!userId,
  });
  
  // Cancel application mutation - Now using the edge function
  const cancelApplicationMutation = useMutation({
    mutationFn: async (applicationId: string) => {
      console.log("Cancelling application via edge function:", applicationId);
      
      const { data, error } = await supabase.functions.invoke('cancel-application', {
        method: 'POST',
        body: { applicationId }
      });
      
      if (error) {
        console.error("Error from cancel-application edge function:", error);
        throw error;
      }
      
      if (data.error) {
        console.error("Error returned by cancel-application edge function:", data.error);
        throw new Error(data.error);
      }
      
      console.log("Application cancelled successfully:", data);
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

  // Delete tracking link mutation
  const deleteTrackingLinkMutation = useMutation({
    mutationFn: async (trackingLinkId: string) => {
      if (!userId) throw new Error("User not authenticated");
      
      console.log('Deleting tracking link:', trackingLinkId);
      
      const { error } = await supabase
        .from('tracking_links')
        .delete()
        .eq('id', trackingLinkId);
    
      if (error) {
        console.error('Error deleting tracking link:', error);
        throw error;
      }
    
      return trackingLinkId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliate-tracking-links', userId] });
      toast({
        title: "Tracking Link Deleted",
        description: "Your tracking link has been deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete tracking link",
      });
    }
  });

  return {
    // Data
    approvedOffers,
    pendingApplications,
    rejectedApplications,
    trackingLinks,
    
    // Loading states
    isLoading: approvedLoading || pendingLoading || rejectedLoading || trackingLinksLoading,
    
    // Mutations
    cancelApplication: (applicationId: string) => cancelApplicationMutation.mutate(applicationId),
    deleteTrackingLink: (linkId: string) => deleteTrackingLinkMutation.mutate(linkId)
  };
};
