
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Offer, AffiliateOffer } from '@/types';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Search, Filter, ExternalLink, Tag } from 'lucide-react';

export default function OfferBrowser() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null);
  const [selectedCommissionType, setSelectedCommissionType] = useState<string | null>(null);
  const [offerToApply, setOfferToApply] = useState<Offer | null>(null);
  const [trafficSource, setTrafficSource] = useState('');
  const [applicationNotes, setApplicationNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get all public offers
  const { data: offers, isLoading: offersLoading } = useQuery({
    queryKey: ['public-offers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .eq('status', 'active');
      
      if (error) throw error;
      return data as Offer[];
    },
    enabled: !!user && user.role === 'affiliate',
  });
  
  // Get already applied offers for this affiliate
  const { data: myApplications, isLoading: applicationsLoading } = useQuery({
    queryKey: ['my-applications'],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('affiliate_offers')
        .select('*, offer:offers(*)')
        .eq('affiliate_id', user.id);
      
      if (error) throw error;
      return data as (AffiliateOffer & { offer: Offer })[];
    },
    enabled: !!user && user.role === 'affiliate',
  });
  
  // Extract unique niches for filtering
  const niches = offers ? [...new Set(offers.filter(o => o.niche).map(o => o.niche!))] : [];
  
  // Apply filters to offers
  const filteredOffers = offers?.filter(offer => {
    const matchesSearch = searchQuery === '' || 
      offer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (offer.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      (offer.niche?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
    
    const matchesNiche = !selectedNiche || offer.niche === selectedNiche;
    const matchesCommissionType = !selectedCommissionType || offer.commission_type === selectedCommissionType;
    
    return matchesSearch && matchesNiche && matchesCommissionType;
  });
  
  // Check if user has already applied to an offer
  const hasApplied = (offerId: string) => {
    return myApplications?.some(app => app.offer_id === offerId);
  };
  
  // Get application status for an offer
  const getApplicationStatus = (offerId: string) => {
    const application = myApplications?.find(app => app.offer_id === offerId);
    return application?.status || null;
  };
  
  // Handle offer application
  const handleApplyToOffer = async () => {
    if (!user || !offerToApply) return;
    
    try {
      setIsSubmitting(true);
      
      const { error } = await supabase
        .from('affiliate_offers')
        .insert({
          affiliate_id: user.id,
          offer_id: offerToApply.id,
          traffic_source: trafficSource,
          notes: applicationNotes,
          status: 'pending',
          applied_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      toast({
        title: 'Application Submitted',
        description: 'Your application has been submitted for review.',
      });
      
      // Reset form
      setOfferToApply(null);
      setTrafficSource('');
      setApplicationNotes('');
      
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to submit application',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Find Offers</h1>
          <p className="text-muted-foreground">
            Browse and apply to available offers for your traffic
          </p>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex-1 max-w-sm relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search offers..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={selectedNiche || ''} onValueChange={(value) => setSelectedNiche(value || null)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filter by niche" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All niches</SelectItem>
              {niches.map((niche) => (
                <SelectItem key={niche} value={niche}>{niche}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select 
            value={selectedCommissionType || ''} 
            onValueChange={(value) => setSelectedCommissionType(value || null)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by commission" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All types</SelectItem>
              <SelectItem value="CPC">CPC (Cost Per Click)</SelectItem>
              <SelectItem value="CPL">CPL (Cost Per Lead)</SelectItem>
              <SelectItem value="CPA">CPA (Cost Per Action)</SelectItem>
              <SelectItem value="CPS">CPS (Cost Per Sale)</SelectItem>
              <SelectItem value="RevShare">Revenue Share</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Tabs defaultValue="available">
        <TabsList>
          <TabsTrigger value="available">Available Offers</TabsTrigger>
          <TabsTrigger value="applied">My Applications</TabsTrigger>
        </TabsList>
        
        <TabsContent value="available" className="space-y-4">
          {offersLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredOffers?.length ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredOffers.map((offer) => {
                const applicationStatus = getApplicationStatus(offer.id);
                
                return (
                  <Card key={offer.id} className="overflow-hidden">
                    <CardHeader className="p-4">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{offer.name}</CardTitle>
                        {offer.is_featured && (
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary">
                            Featured
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="line-clamp-2">{offer.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 grid gap-2">
                      <div className="text-sm">
                        <span className="font-medium">Commission: </span>
                        {offer.commission_type === 'RevShare' 
                          ? `${offer.commission_percent}% Revenue Share` 
                          : `$${offer.commission_amount} per ${offer.commission_type.slice(2)}`}
                      </div>
                      
                      {offer.niche && (
                        <div className="text-sm flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          <span>{offer.niche}</span>
                        </div>
                      )}
                      
                      <div className="mt-4">
                        {applicationStatus ? (
                          <Badge className={
                            applicationStatus === 'approved' ? 'bg-green-500' :
                            applicationStatus === 'rejected' ? 'bg-destructive' :
                            'bg-yellow-500'
                          }>
                            {applicationStatus === 'approved' ? 'Approved' :
                             applicationStatus === 'rejected' ? 'Rejected' :
                             'Pending Review'}
                          </Badge>
                        ) : (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                onClick={() => setOfferToApply(offer)}
                                disabled={hasApplied(offer.id)}
                              >
                                {hasApplied(offer.id) ? 'Already Applied' : 'Apply to Promote'}
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Apply to Promote {offer.name}</DialogTitle>
                                <DialogDescription>
                                  Provide information about how you plan to promote this offer.
                                  The advertiser will review your application.
                                </DialogDescription>
                              </DialogHeader>
                              
                              <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                  <Label htmlFor="traffic-source">Traffic Source *</Label>
                                  <Select
                                    value={trafficSource}
                                    onValueChange={setTrafficSource}
                                    required
                                  >
                                    <SelectTrigger id="traffic-source">
                                      <SelectValue placeholder="Select your traffic source" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="social">Social Media</SelectItem>
                                      <SelectItem value="search">Search / SEO</SelectItem>
                                      <SelectItem value="email">Email Marketing</SelectItem>
                                      <SelectItem value="content">Content / Blogging</SelectItem>
                                      <SelectItem value="paid">Paid Advertising</SelectItem>
                                      <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                <div className="grid gap-2">
                                  <Label htmlFor="notes">Additional Notes</Label>
                                  <Textarea
                                    id="notes"
                                    placeholder="Tell the advertiser more about how you plan to promote this offer"
                                    value={applicationNotes}
                                    onChange={(e) => setApplicationNotes(e.target.value)}
                                    rows={4}
                                  />
                                </div>
                              </div>
                              
                              <DialogFooter>
                                <DialogClose asChild>
                                  <Button type="button" variant="outline">
                                    Cancel
                                  </Button>
                                </DialogClose>
                                <Button 
                                  onClick={handleApplyToOffer} 
                                  disabled={!trafficSource || isSubmitting}
                                >
                                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No matching offers found</p>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="applied">
          {applicationsLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : myApplications?.length ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {myApplications.map((application) => (
                <Card key={application.id} className="overflow-hidden">
                  <CardHeader className="p-4">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{application.offer.name}</CardTitle>
                      <Badge className={
                        application.status === 'approved' ? 'bg-green-500' :
                        application.status === 'rejected' ? 'bg-destructive' :
                        'bg-yellow-500'
                      }>
                        {application.status === 'approved' ? 'Approved' :
                         application.status === 'rejected' ? 'Rejected' :
                         'Pending Review'}
                      </Badge>
                    </div>
                    <CardDescription>{application.offer.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 grid gap-2">
                    <div className="text-sm">
                      <span className="font-medium">Applied on: </span>
                      {new Date(application.applied_at).toLocaleDateString()}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Traffic Source: </span>
                      {application.traffic_source}
                    </div>
                    {application.status === 'approved' && (
                      <div className="mt-4">
                        <Button
                          asChild
                          variant="outline"
                          className="w-full"
                        >
                          <a href={`/links?offer=${application.offer_id}`}>
                            Generate Tracking Links
                          </a>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">You haven't applied to any offers yet</p>
              <Button className="mt-4" onClick={() => document.querySelector('[data-value="available"]')?.click()}>
                Browse Available Offers
              </Button>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
