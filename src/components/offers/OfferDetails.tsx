
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdvertiserPostbackSetup from '@/components/advertiser/AdvertiserPostbackSetup';
import { Pencil, Trash2 } from 'lucide-react';
import { Offer } from '@/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function OfferDetails({ offerId }: { offerId: string }) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('details');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Fetch offer details
  const { data: offer, isLoading } = useQuery({
    queryKey: ['offer', offerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .eq('id', offerId)
        .single();
      
      if (error) throw error;
      return data;
    },
  });
  
  // Fetch affiliates who have applied to this offer
  const { data: affiliates } = useQuery({
    queryKey: ['offer-affiliates', offerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('affiliate_offers')
        .select(`
          id,
          status,
          applied_at,
          reviewed_at,
          traffic_source,
          notes,
          affiliate:affiliate_id(
            id,
            email,
            contact_name,
            company_name
          )
        `)
        .eq('offer_id', offerId);
      
      if (error) throw error;
      return data;
    },
  });
  
  // Mutation to update offer
  const updateOffer = useMutation({
    mutationFn: async (updatedOffer: any) => {
      const { data, error } = await supabase
        .from('offers')
        .update(updatedOffer)
        .eq('id', offerId)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offer', offerId] });
      toast({
        title: 'Offer Updated',
        description: 'The offer has been updated successfully',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update offer',
      });
      console.error(error);
    },
  });
  
  // Mutation to delete offer
  const deleteOfferMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('offers')
        .delete()
        .eq('id', offerId);
      
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      toast({
        title: 'Offer Deleted',
        description: 'The offer has been deleted successfully',
      });
      navigate('/offers');
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete offer',
      });
      console.error(error);
    },
  });
  
  // Mutation to update affiliate application status
  const updateAffiliateStatus = useMutation({
    mutationFn: async ({ affiliateOfferId, status }: { affiliateOfferId: string, status: string }) => {
      const { data, error } = await supabase
        .from('affiliate_offers')
        .update({
          status,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', affiliateOfferId)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offer-affiliates', offerId] });
      toast({
        title: 'Status Updated',
        description: 'The affiliate application status has been updated',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update affiliate status',
      });
      console.error(error);
    },
  });
  
  // Check if user is authorized to view this offer
  useEffect(() => {
    if (offer && user) {
      const isAuthorized = 
        user.role === 'admin' || 
        (user.role === 'advertiser' && offer.advertiser_id === user.id);
      
      if (!isAuthorized) {
        toast({
          variant: 'destructive',
          title: 'Access Denied',
          description: 'You do not have permission to view this offer',
        });
        navigate('/offers');
      }
    }
  }, [offer, user, navigate, toast]);

  // Navigate to the edit page
  const handleEditClick = () => {
    navigate(`/offers/${offerId}/edit`);
  };

  // Delete offer
  const handleDeleteOffer = () => {
    setShowDeleteDialog(true);
  };

  const confirmDeleteOffer = () => {
    deleteOfferMutation.mutate();
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!offer) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold">Offer Not Found</h2>
        <p className="text-muted-foreground mt-2">The offer you're looking for doesn't exist or you don't have permission to view it.</p>
        <Button className="mt-4" onClick={() => navigate('/offers')}>
          Back to Offers
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {offer.name}
          </h1>
          <p className="text-muted-foreground">
            Manage your offer details, affiliates, and tracking
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => navigate('/offers')}>
            Back to Offers
          </Button>
          <Button 
            variant={offer.status === 'active' ? 'destructive' : 'default'}
            onClick={() => {
              updateOffer.mutate({
                status: offer.status === 'active' ? 'inactive' : 'active'
              });
            }}
          >
            {offer.status === 'active' ? 'Pause Offer' : 'Activate Offer'}
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDeleteOffer}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Offer
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="affiliates">Affiliates</TabsTrigger>
          <TabsTrigger value="conversions">Conversions</TabsTrigger>
          <TabsTrigger value="tracking">Tracking</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Offer Details</CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1"
                onClick={handleEditClick}
              >
                <Pencil className="h-4 w-4" />
                Edit Offer
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium">Name</h3>
                  <p>{offer.name}</p>
                </div>
                <div>
                  <h3 className="font-medium">Status</h3>
                  <p className="capitalize">{offer.status}</p>
                </div>
                <div>
                  <h3 className="font-medium">URL</h3>
                  <p className="truncate">{offer.url}</p>
                </div>
                <div>
                  <h3 className="font-medium">Commission</h3>
                  <p>
                    {offer.commission_type === 'RevShare' 
                      ? `${offer.commission_percent}% RevShare` 
                      : `$${offer.commission_amount} per ${offer.commission_type.slice(2)}`}
                  </p>
                </div>
                {offer.niche && (
                  <div>
                    <h3 className="font-medium">Niche</h3>
                    <p>{offer.niche}</p>
                  </div>
                )}
                {offer.description && (
                  <div className="col-span-2">
                    <h3 className="font-medium">Description</h3>
                    <p>{offer.description}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="affiliates">
          <Card>
            <CardHeader>
              <CardTitle>Affiliate Applications</CardTitle>
            </CardHeader>
            <CardContent>
              {affiliates && affiliates.length > 0 ? (
                <div className="rounded-md border">
                  <table className="min-w-full divide-y divide-border">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium">Affiliate</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Applied</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Traffic Source</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                        <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {affiliates.map((affiliate) => (
                        <tr key={affiliate.id}>
                          <td className="px-4 py-3 text-sm">
                            {affiliate.affiliate.contact_name || affiliate.affiliate.company_name || affiliate.affiliate.email}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {new Date(affiliate.applied_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {affiliate.traffic_source || 'Not specified'}
                          </td>
                          <td className="px-4 py-3 text-sm capitalize">
                            {affiliate.status}
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            {affiliate.status === 'pending' && (
                              <div className="flex justify-end space-x-2">
                                <Button 
                                  size="sm" 
                                  variant="default"
                                  onClick={() => updateAffiliateStatus.mutate({
                                    affiliateOfferId: affiliate.id,
                                    status: 'approved'
                                  })}
                                >
                                  Approve
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => updateAffiliateStatus.mutate({
                                    affiliateOfferId: affiliate.id,
                                    status: 'rejected'
                                  })}
                                >
                                  Reject
                                </Button>
                              </div>
                            )}
                            {affiliate.status === 'approved' && (
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => updateAffiliateStatus.mutate({
                                  affiliateOfferId: affiliate.id,
                                  status: 'rejected'
                                })}
                              >
                                Revoke
                              </Button>
                            )}
                            {affiliate.status === 'rejected' && (
                              <Button 
                                size="sm" 
                                variant="default"
                                onClick={() => updateAffiliateStatus.mutate({
                                  affiliateOfferId: affiliate.id,
                                  status: 'approved'
                                })}
                              >
                                Approve
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No affiliate applications yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="conversions">
          <Card>
            <CardHeader>
              <CardTitle>Conversions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">Conversion tracking data will appear here</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Set up your postback URL in the Tracking tab to start recording conversions
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="tracking">
          <AdvertiserPostbackSetup />
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this offer?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the offer
              and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteOffer} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
