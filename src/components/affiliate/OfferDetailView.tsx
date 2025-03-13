
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Offer } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Star, ExternalLink, Calendar, Tag, Landmark, Users, Info } from 'lucide-react';

interface OfferDetailViewProps {
  offer: Offer;
  applicationStatus: string | null;
  onBack: () => void;
}

const OfferDetailView = ({ offer, applicationStatus, onBack }: OfferDetailViewProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [trafficSource, setTrafficSource] = React.useState('');
  const [notes, setNotes] = React.useState('');

  // Apply for offer mutation
  const applyForOfferMutation = useMutation({
    mutationFn: async (offerId: string) => {
      if (!user) throw new Error("User not authenticated");
      
      // Get the advertiser ID from the offer
      const { data: offerData, error: offerError } = await supabase
        .from('offers')
        .select('advertiser_id')
        .eq('id', offerId)
        .single();
      
      if (offerError) throw offerError;
      
      if (!offerData.advertiser_id) {
        throw new Error("Offer has no advertiser assigned");
      }
      
      const { data, error } = await supabase
        .from('affiliate_offers')
        .insert({
          affiliate_id: user.id,
          offer_id: offerId,
          traffic_source: trafficSource,
          notes: notes,
          applied_at: new Date().toISOString(),
          status: 'pending'
        })
        .select();
      
      if (error) throw error;
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliate-applications', user?.id] });
      toast({
        title: "Application Submitted",
        description: "Your application has been submitted successfully",
      });
      setOpen(false);
      setTrafficSource('');
      setNotes('');
    },
    onError: (error: any) => {
      console.error("Error submitting application:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to submit application",
      });
    }
  });

  const handleApplyClick = () => setOpen(true);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="flex items-center space-x-2">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to offers</span>
        </Button>
        
        {applicationStatus && (
          <Badge variant={
            applicationStatus === 'approved' ? 'default' : 
            applicationStatus === 'rejected' ? 'destructive' : 
            'secondary'
          }>
            {applicationStatus === 'approved' ? 'Approved' :
             applicationStatus === 'rejected' ? 'Rejected' :
             'Pending'}
          </Badge>
        )}
      </div>
      
      <div className="text-left">
        <div className="flex items-start gap-3">
          <div>
            <h1 className="text-3xl font-bold">{offer.name}</h1>
            {offer.is_featured && (
              <Badge variant="outline" className="mt-2 bg-yellow-100 dark:bg-yellow-900">
                <Star className="h-3 w-3 mr-1 text-yellow-500" />
                Featured Offer
              </Badge>
            )}
          </div>
        </div>
        <p className="mt-2 text-muted-foreground">{offer.description}</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Offer Details</CardTitle>
            <CardDescription>Key information about this offer</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-sm text-muted-foreground">Commission Model</Label>
                <p className="font-medium">
                  {offer.commission_type === 'RevShare' 
                    ? `${offer.commission_percent}% Revenue Share` 
                    : `$${offer.commission_amount} per ${offer.commission_type.slice(2)}`}
                </p>
              </div>
              
              <div className="space-y-1">
                <Label className="text-sm text-muted-foreground">Niche</Label>
                <p className="font-medium flex items-center">
                  <Tag className="h-3 w-3 mr-1" />
                  {offer.niche || 'General'}
                </p>
              </div>
              
              <div className="space-y-1">
                <Label className="text-sm text-muted-foreground">Added</Label>
                <p className="font-medium flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  {new Date(offer.created_at).toLocaleDateString()}
                </p>
              </div>
              
              <div className="space-y-1">
                <Label className="text-sm text-muted-foreground">Status</Label>
                <p className="font-medium">
                  <Badge variant={offer.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                    {offer.status}
                  </Badge>
                </p>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">Advertiser</Label>
              <p className="font-medium flex items-center">
                <Landmark className="h-3 w-3 mr-1" />
                {offer.advertiser_name || 'Company Name'}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Requirements & Expectations</CardTitle>
            <CardDescription>What's expected from affiliates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium">Allowed Traffic Sources</h3>
              <p className="text-sm text-muted-foreground">
                {offer.allowed_traffic_sources || 'All traffic sources are allowed for this offer.'}
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">Target Audience</h3>
              <p className="text-sm text-muted-foreground">
                {offer.target_audience || 'This offer is targeted at a general audience.'}
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">Restrictions</h3>
              <p className="text-sm text-muted-foreground">
                {offer.restrictions || 'No specific restrictions for this offer.'}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Offer Description</CardTitle>
            <CardDescription>Detailed information about the offer</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none dark:prose-invert">
              <p>{offer.description}</p>
              
              <div className="mt-6">
                <h3 className="text-lg font-medium">Marketing Materials</h3>
                <p className="mt-2 text-muted-foreground">
                  {offer.marketing_materials || 'Additional marketing materials will be provided after approval.'}
                </p>
              </div>
              
              {offer.conversion_requirements && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium">Conversion Requirements</h3>
                  <p className="mt-2 text-muted-foreground">
                    {offer.conversion_requirements}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" size="sm" className="flex items-center space-x-1" asChild>
              <a href={offer.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-1" />
                Preview Offer
              </a>
            </Button>
            
            {!applicationStatus ? (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={handleApplyClick}>Apply Now</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Apply for {offer.name}</DialogTitle>
                    <DialogDescription>
                      Enter your traffic sources and any notes for the advertiser
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="traffic">Traffic Source</Label>
                      <Input 
                        id="traffic" 
                        value={trafficSource} 
                        onChange={(e) => setTrafficSource(e.target.value)} 
                        placeholder="e.g., Social Media, Email Marketing" 
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="notes">Additional Notes</Label>
                      <Textarea 
                        id="notes" 
                        placeholder="Any additional information you want to share with the advertiser" 
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="secondary"
                      onClick={() => setOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      onClick={() => applyForOfferMutation.mutate(offer.id)}
                      disabled={applyForOfferMutation.isPending}
                    >
                      {applyForOfferMutation.isPending ? 'Submitting...' : 'Submit Application'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ) : applicationStatus === 'approved' ? (
              <Button size="sm" onClick={() => navigate(`/links?offer=${offer.id}`)}>
                Create Links
              </Button>
            ) : (
              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                <Info className="h-4 w-4" />
                <span>
                  {applicationStatus === 'pending' 
                    ? 'Application under review' 
                    : 'Application was rejected'}
                </span>
              </div>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default OfferDetailView;
