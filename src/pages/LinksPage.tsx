
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link, Copy, ExternalLink, Plus, RefreshCw } from 'lucide-react';

export default function LinksPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState('');
  const [searchParams, setSearchParams] = useState('');
  
  // Get all approved offers for the user
  const { data: approvedOffers } = useQuery({
    queryKey: ['approved-offers', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('affiliate_offers')
        .select(`
          *,
          offers(*)
        `)
        .eq('affiliate_id', user.id)
        .eq('status', 'approved');
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
  
  // Get user's tracking links
  const { data: trackingLinks, isLoading } = useQuery({
    queryKey: ['tracking-links', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('tracking_links')
        .select(`
          *,
          offers(*)
        `)
        .eq('affiliate_id', user.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
  
  // Create tracking link mutation
  const createTrackingLink = useMutation({
    mutationFn: async () => {
      if (!user || !selectedOffer) {
        throw new Error('Missing required information');
      }
      
      // Generate a unique tracking code
      const trackingCode = `${user.id.slice(0, 8)}-${selectedOffer.slice(0, 8)}-${Date.now().toString(36)}`;
      
      // Parse custom params if any
      let customParams = null;
      if (searchParams.trim()) {
        try {
          // Convert "param1=value1&param2=value2" to an object
          const paramsObj = Object.fromEntries(
            searchParams.split('&').map(param => {
              const [key, value] = param.split('=');
              return [key.trim(), value.trim()];
            })
          );
          customParams = paramsObj;
        } catch (e) {
          console.error('Error parsing custom params', e);
        }
      }
      
      const { data, error } = await supabase
        .from('tracking_links')
        .insert({
          affiliate_id: user.id,
          offer_id: selectedOffer,
          tracking_code: trackingCode,
          custom_params: customParams
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracking-links'] });
      toast({
        title: 'Success',
        description: 'Tracking link created successfully',
      });
      setIsDialogOpen(false);
      setSelectedOffer('');
      setSearchParams('');
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create tracking link',
      });
      console.error(error);
    },
  });
  
  // Copy tracking link to clipboard
  const copyTrackingLink = (trackingCode: string) => {
    const baseUrl = window.location.origin;
    const trackingUrl = `${baseUrl}/click/${trackingCode}`;
    
    navigator.clipboard.writeText(trackingUrl);
    
    toast({
      title: 'Link Copied',
      description: 'Tracking link copied to clipboard',
    });
  };
  
  // Handle link creation
  const handleCreateLink = () => {
    if (!selectedOffer) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select an offer',
      });
      return;
    }
    
    createTrackingLink.mutate();
  };
  
  if (!user) return null;
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tracking Links</h1>
          <p className="text-muted-foreground">
            Create and manage your tracking links for offers
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Link
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Tracking Link</DialogTitle>
              <DialogDescription>
                Generate a new tracking link for an approved offer
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="offer">Select Offer</Label>
                <Select
                  value={selectedOffer}
                  onValueChange={setSelectedOffer}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an offer" />
                  </SelectTrigger>
                  <SelectContent>
                    {approvedOffers?.map((item: any) => (
                      <SelectItem key={item.offer_id} value={item.offer_id}>
                        {item.offers.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="params">Custom Parameters (Optional)</Label>
                <Input
                  id="params"
                  placeholder="param1=value1&param2=value2"
                  value={searchParams}
                  onChange={(e) => setSearchParams(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Add custom parameters to track different campaigns
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                onClick={handleCreateLink} 
                disabled={!selectedOffer || createTrackingLink.isPending}
              >
                {createTrackingLink.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : 'Create Link'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Your Tracking Links</CardTitle>
          <CardDescription>
            Use these links to send traffic to your approved offers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : trackingLinks?.length ? (
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-2 text-left font-medium">Offer</th>
                      <th className="p-2 text-left font-medium">Tracking Link</th>
                      <th className="p-2 text-left font-medium">Created</th>
                      <th className="p-2 text-left font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trackingLinks.map((link: any) => {
                      const baseUrl = window.location.origin;
                      const trackingUrl = `${baseUrl}/click/${link.tracking_code}`;
                      
                      return (
                        <tr key={link.id} className="border-b hover:bg-muted/50">
                          <td className="p-2">{link.offers.name}</td>
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              <div className="font-mono text-xs truncate max-w-[200px]">
                                {trackingUrl}
                              </div>
                            </div>
                          </td>
                          <td className="p-2">
                            {new Date(link.created_at).toLocaleDateString()}
                          </td>
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => copyTrackingLink(link.tracking_code)}
                              >
                                <Copy className="h-4 w-4 mr-1" />
                                Copy
                              </Button>
                              
                              <Button variant="ghost" size="sm" asChild>
                                <a href={trackingUrl} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4 mr-1" />
                                  Test
                                </a>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 border rounded-md">
              <Link className="h-14 w-14 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-lg font-medium mb-2">No Tracking Links Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create tracking links for your approved offers to start earning commissions
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Link
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Tips for Using Tracking Links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-medium">Best Practices</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Create separate tracking links for different traffic sources</li>
              <li>Use custom parameters to track specific campaigns or placements</li>
              <li>Test your links before launching campaigns</li>
              <li>Monitor performance and optimize your highest converting offers</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium">Custom Parameters</h3>
            <p className="text-sm">
              You can add custom parameters like <code>source=email</code> or <code>campaign=summer</code> to track different marketing efforts. These will be passed to the advertiser and visible in your reports.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
