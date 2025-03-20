
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Offer } from '@/types';
import { formatGeoTargets } from './utils/offerUtils';
import { toast } from '@/hooks/use-toast';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronsUpDown, Check, Loader2, Search } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { cn } from '@/lib/utils';

const ITEMS_PER_PAGE = 12;

export default function OfferBrowser() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalOffers, setTotalOffers] = useState(0);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Get initial search query from URL
  useEffect(() => {
    const initialSearchQuery = searchParams.get('search') || '';
    setSearchQuery(initialSearchQuery);
  }, [searchParams]);
  
  // Get initial niche from URL
  useEffect(() => {
    const initialNiche = searchParams.get('niche') || null;
    setSelectedNiche(initialNiche);
  }, [searchParams]);
  
  // Update URL when search query changes
  useEffect(() => {
    const newParams = new URLSearchParams(searchParams);
    if (searchQuery) {
      newParams.set('search', searchQuery);
    } else {
      newParams.delete('search');
    }
    setSearchParams(newParams);
  }, [searchQuery, setSearchParams, searchParams]);
  
  // Update URL when niche changes
  useEffect(() => {
    const newParams = new URLSearchParams(searchParams);
    if (selectedNiche) {
      newParams.set('niche', selectedNiche);
    } else {
      newParams.delete('niche');
    }
    setSearchParams(newParams);
  }, [selectedNiche, setSearchParams, searchParams]);
  
  // Fetch offers based on search query, niche, and pagination
  const { data: offers, isLoading, error } = useQuery({
    queryKey: ['offers', searchQuery, selectedNiche, page],
    queryFn: async () => {
      let query = supabase
        .from('affiliate_offer_details')
        .select('*', { count: 'exact' })
        .order('offer_name', { ascending: true })
        .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1);
      
      if (searchQuery) {
        query = query.ilike('offer_name', `%${searchQuery}%`);
      }
      
      if (selectedNiche) {
        query = query.eq('niche', selectedNiche);
      }
      
      if (user?.id) {
        query = query.eq('affiliate_id', user.id);
      }
      
      const { data, error, count } = await query;
      
      if (error) {
        console.error("Error fetching offers:", error);
        throw error;
      }
      
      setTotalOffers(count || 0);
      return data as unknown as Offer[];
    },
  });
  
  // Calculate total number of pages
  const totalPages = Math.ceil(totalOffers / ITEMS_PER_PAGE);
  
  // Handle search query change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1); // Reset to the first page when searching
  };
  
  // Handle niche selection
  const handleNicheSelect = (niche: string | null) => {
    setSelectedNiche(niche);
    setPage(1); // Reset to the first page when filtering by niche
    setIsFilterOpen(false); // Close the filter popover
  };
  
  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };
  
  // Handle apply for offer
  const handleApplyForOffer = async (offerId: string) => {
    if (!user?.id) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to apply for offers.',
      });
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('affiliate_offers')
        .insert([{ offer_id: offerId, affiliate_id: user.id, status: 'pending', applied_at: new Date().toISOString() }]);
      
      if (error) {
        console.error("Error applying for offer:", error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to apply for offer. Please try again.',
        });
        return;
      }
      
      toast({
        title: 'Application Sent',
        description: 'Your application has been submitted and is awaiting approval.',
      });
    } catch (error) {
      console.error("Error applying for offer:", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to apply for offer. Please try again.',
      });
    }
  };
  
  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Browse Offers</h1>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
            <Input
              type="text"
              placeholder="Search offers..."
              className="pl-10"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" aria-expanded={isFilterOpen} className="justify-between">
                {selectedNiche || 'Select Niche'}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="end">
              <Command>
                <CommandInput placeholder="Search niche..." />
                <CommandEmpty>No niche found.</CommandEmpty>
                <CommandGroup>
                  <CommandItem onSelect={() => handleNicheSelect(null)}>
                    <Check className={cn("mr-2 h-4 w-4", selectedNiche === null ? "opacity-100" : "opacity-0")} />
                    All Niches
                  </CommandItem>
                  <CommandItem onSelect={() => handleNicheSelect('health_fitness')}>
                    <Check className={cn("mr-2 h-4 w-4", selectedNiche === 'health_fitness' ? "opacity-100" : "opacity-0")} />
                    Health & Fitness
                  </CommandItem>
                  <CommandItem onSelect={() => handleNicheSelect('finance')}>
                    <Check className={cn("mr-2 h-4 w-4", selectedNiche === 'finance' ? "opacity-100" : "opacity-0")} />
                    Finance
                  </CommandItem>
                  <CommandItem onSelect={() => handleNicheSelect('ecommerce')}>
                    <Check className={cn("mr-2 h-4 w-4", selectedNiche === 'ecommerce' ? "opacity-100" : "opacity-0")} />
                    E-commerce
                  </CommandItem>
                  <CommandItem onSelect={() => handleNicheSelect('education')}>
                    <Check className={cn("mr-2 h-4 w-4", selectedNiche === 'education' ? "opacity-100" : "opacity-0")} />
                    Education
                  </CommandItem>
                  <CommandItem onSelect={() => handleNicheSelect('software')}>
                    <Check className={cn("mr-2 h-4 w-4", selectedNiche === 'software' ? "opacity-100" : "opacity-0")} />
                    Software
                  </CommandItem>
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(ITEMS_PER_PAGE)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <CardTitle><Skeleton className="h-5 w-4/5" /></CardTitle>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <p className="text-red-500">Error: {error.message}</p>
      ) : offers && offers.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {offers.map((offer) => {
              // When using formatGeoTargets, pass the full offer object, not just geo_targets
              const geoList = formatGeoTargets(offer);
              
              return (
                <Card key={offer.id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{offer.offer_name}</CardTitle>
                    {offer.is_featured && <Badge variant="secondary">Featured</Badge>}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-4 py-2">
                      <Avatar>
                        <AvatarImage src={offer.offer_image || `https://avatar.vercel.sh/${offer.advertiser_name}.png`} />
                        <AvatarFallback>{offer.advertiser_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <h4 className="text-sm font-semibold">{offer.advertiser_name}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">{offer.description?.substring(0, 100)}...</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {geoList.map((geo) => (
                        <Badge key={geo.code} variant="outline">{geo.flag} {geo.code}</Badge>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between items-center">
                    <Button variant="secondary" size="sm" onClick={() => navigate(`/offers/${offer.o_id}`)}>
                      View Offer
                    </Button>
                    {offer.application_status === 'approved' ? (
                      <Badge variant="default" className="bg-green-500">Approved</Badge>
                    ) : offer.application_status === 'pending' ? (
                      <Badge variant="outline" className="text-amber-500 border-amber-500">Pending</Badge>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => handleApplyForOffer(offer.o_id as string)}>
                        Apply Now
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <div className="join">
                <Button
                  className="join-item"
                  disabled={page === 1}
                  onClick={() => handlePageChange(page - 1)}
                >
                  «
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
                  <Button
                    key={pageNumber}
                    className="join-item"
                    variant={pageNumber === page ? 'default' : 'outline'}
                    onClick={() => handlePageChange(pageNumber)}
                  >
                    {pageNumber}
                  </Button>
                ))}
                <Button
                  className="join-item"
                  disabled={page === totalPages}
                  onClick={() => handlePageChange(page + 1)}
                >
                  »
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <p>No offers found.</p>
      )}
    </div>
  );
}
