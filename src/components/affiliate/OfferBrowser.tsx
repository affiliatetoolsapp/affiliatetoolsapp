import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Offer } from '@/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export default function OfferBrowser() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [trafficSource, setTrafficSource] = useState('');
  const [notes, setNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [nicheFilter, setNicheFilter] = useState('');
  
  // Get all offers available for applications
  const { data: availableOffers, isLoading: offersLoading } = useQuery({
    queryKey: ['available-offers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .eq('status', 'active');
      
      if (error) throw error;
      
      // Add is_featured if it doesn't exist in the database yet
      return data.map(offer => ({
        ...offer,
        is_featured: offer.is_featured || false
      }));
    },
    enabled: !!user && user.role === 'affiliate',
  });
  
  // Get affiliate's existing applications
  const { data: existingApplications } = useQuery({
    queryKey: ['affiliate-applications', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('affiliate_offers')
        .select('offer_id, status')
        .eq('affiliate_id', user.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user && user.role === 'affiliate',
  });
  
  // Apply for offer mutation
  const applyForOfferMutation = useMutation({
    mutationFn: async (offerId: string) => {
      if (!user) throw new Error("User not authenticated");
      
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
      toast({
        title: "Application Submitted",
        description: "Your application has been submitted successfully",
      });
      setOpen(false);
      setTrafficSource('');
      setNotes('');
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to submit application",
      });
    }
  });
  
  // Filter offers based on search query and niche
  const filteredOffers = availableOffers?.filter(offer => {
    const searchMatch = offer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (offer.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
    const nicheMatch = nicheFilter === '' || offer.niche === nicheFilter;
    return searchMatch && nicheMatch;
  });
  
  // Get unique list of niches
  const niches = [...new Set(availableOffers?.map(offer => offer.niche).filter(Boolean))];
  
  // Check if affiliate has already applied for an offer
  const hasApplied = (offerId: string) => {
    return existingApplications?.some(app => app.offer_id === offerId);
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Marketplace</h1>
        <p className="text-muted-foreground">
          Browse available offers and apply to become an affiliate
        </p>
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search" 
            placeholder="Search offers..." 
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" role="combobox" aria-expanded={open} className="justify-between">
              {nicheFilter ? nicheFilter : "Filter by Niche"}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0">
            <Command>
              <CommandInput placeholder="Search niche..." />
              <CommandList>
                <CommandItem
                  onSelect={() => {
                    setNicheFilter("");
                  }}
                >
                  All Niches
                </CommandItem>
                <CommandSeparator />
                {niches.map((niche) => (
                  <CommandItem
                    key={niche}
                    onSelect={() => {
                      setNicheFilter(niche);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        nicheFilter === niche ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {niche}
                  </CommandItem>
                ))}
                {niches.length === 0 && (
                  <CommandEmpty>No niches found.</CommandEmpty>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      
      {offersLoading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredOffers?.length ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredOffers.map((offer) => (
            <Card key={offer.id} className="overflow-hidden">
              <CardHeader className="p-4">
                <CardTitle className="text-lg">{offer.name}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {offer.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0 grid gap-2">
                <div className="text-sm">
                  <span className="font-medium">Commission: </span>
                  {offer.commission_type === 'RevShare' 
                    ? `${offer.commission_percent}% Revenue Share` 
                    : `$${offer.commission_amount} per ${offer.commission_type.slice(2)}`}
                </div>
                
                {offer.niche && (
                  <div className="text-sm">
                    <span className="font-medium">Niche: </span>
                    {offer.niche}
                  </div>
                )}
                
                <div className="mt-4 flex justify-between">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => window.open(offer.url, '_blank')}
                  >
                    Preview
                  </Button>
                  
                  {hasApplied(offer.id) ? (
                    <Button variant="secondary" size="sm" disabled>
                      Application Sent
                    </Button>
                  ) : (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" onClick={() => setSelectedOffer(offer)}>
                          Apply Now
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Apply for {selectedOffer?.name}</DialogTitle>
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
                            onClick={() => {
                              if (selectedOffer) {
                                applyForOfferMutation.mutate(selectedOffer.id);
                              }
                            }}
                          >
                            Submit Application
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No offers found</p>
        </Card>
      )}
    </div>
  );
}
