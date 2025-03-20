
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Offer } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatGeoTargets } from '@/components/affiliate/utils/offerUtils';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Award, Clock, DollarSign, Globe, Info, Loader2, Search, Star, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { LoadingState } from '@/components/LoadingState';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function MarketplaceOverview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNiche, setSelectedNiche] = useState<string>('all');
  const [selectedTab, setSelectedTab] = useState<string>('featured');
  
  // Fetch offers
  const { data: offers, isLoading, error } = useQuery({
    queryKey: ['marketplace-offers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('offers')
        .select('*, users!offers_advertiser_id_fkey(company_name)')
        .eq('status', 'active');
      
      if (error) {
        console.error('Error fetching offers:', error);
        throw new Error('Failed to fetch offers');
      }
      
      // Transform the data to include advertiser_name
      return data.map(offer => ({
        ...offer,
        advertiser_name: offer.users?.company_name || 'Unknown Advertiser'
      })) as unknown as Offer[];
    },
  });
  
  // Filter offers based on search term, niche, and tab
  const filteredOffers = offers?.filter(offer => {
    // Filter by search term
    const matchesSearch = searchTerm === '' || 
      offer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      offer.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      offer.advertiser_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by niche
    const matchesNiche = selectedNiche === 'all' || offer.niche === selectedNiche;
    
    // Filter by tab
    const matchesTab = 
      (selectedTab === 'featured' && offer.is_featured) ||
      (selectedTab === 'all') ||
      (selectedTab === 'new' && new Date(offer.created_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days
    
    return matchesSearch && matchesNiche && matchesTab;
  });
  
  // Get unique niches for the filter
  const niches = offers ? [...new Set(offers.filter(o => o.niche).map(o => o.niche))] : [];
  
  // Handle view offer details
  const handleViewOffer = (offerId: string) => {
    navigate(`/offers/${offerId}`);
  };
  
  if (isLoading) {
    return <LoadingState />;
  }
  
  if (error) {
    return (
      <div className="container mx-auto py-10">
        <Alert variant="destructive">
          <Info className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load marketplace offers. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:space-y-0 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Marketplace</h1>
          <p className="text-muted-foreground">
            Discover and explore available offers from our advertisers
          </p>
        </div>
        
        {user?.role === 'advertiser' && (
          <Button onClick={() => navigate('/offers/create')}>
            Create New Offer
          </Button>
        )}
      </div>
      
      <div className="grid gap-6">
        {/* Filters and search */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search offers..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="w-full md:w-[200px]">
                <Select
                  value={selectedNiche}
                  onValueChange={setSelectedNiche}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select niche" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Niches</SelectItem>
                    {niches.map((niche) => (
                      <SelectItem key={niche} value={niche}>
                        {niche.charAt(0).toUpperCase() + niche.slice(1).replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Tabs and offers list */}
        <Tabs defaultValue="featured" value={selectedTab} onValueChange={setSelectedTab}>
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="featured" className="flex items-center gap-1">
                <Star className="h-4 w-4" />
                <span>Featured</span>
              </TabsTrigger>
              <TabsTrigger value="new" className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>New</span>
              </TabsTrigger>
              <TabsTrigger value="all" className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>All Offers</span>
              </TabsTrigger>
            </TabsList>
            
            <div className="text-sm text-muted-foreground">
              {filteredOffers?.length || 0} offers found
            </div>
          </div>
          
          <TabsContent value="featured" className="mt-6">
            <OfferGrid offers={filteredOffers || []} onViewOffer={handleViewOffer} />
          </TabsContent>
          
          <TabsContent value="new" className="mt-6">
            <OfferGrid offers={filteredOffers || []} onViewOffer={handleViewOffer} />
          </TabsContent>
          
          <TabsContent value="all" className="mt-6">
            <OfferGrid offers={filteredOffers || []} onViewOffer={handleViewOffer} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

interface OfferGridProps {
  offers: Offer[];
  onViewOffer: (id: string) => void;
}

function OfferGrid({ offers, onViewOffer }: OfferGridProps) {
  if (offers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Search className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No offers found</h3>
        <p className="text-muted-foreground mt-1">
          Try adjusting your search or filters to find what you're looking for.
        </p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {offers.map((offer) => (
        <OfferCard key={offer.id} offer={offer} onViewOffer={onViewOffer} />
      ))}
    </div>
  );
}

interface OfferCardProps {
  offer: Offer;
  onViewOffer: (id: string) => void;
}

function OfferCard({ offer, onViewOffer }: OfferCardProps) {
  // Format geo targets for display
  const geoList = formatGeoTargets(offer);
  
  // Format commission for display
  const formatCommission = () => {
    if (offer.commission_type === 'RevShare') {
      return `${offer.commission_percent}% Revenue Share`;
    } else {
      return `$${offer.commission_amount.toFixed(2)} per ${
        offer.commission_type === 'CPA' ? 'Action' :
        offer.commission_type === 'CPL' ? 'Lead' : 'Sale'
      }`;
    }
  };
  
  return (
    <Card className="overflow-hidden flex flex-col h-full">
      {offer.is_featured && (
        <div className="bg-yellow-500 text-white text-xs font-medium px-2 py-1 absolute right-0 top-0 rounded-bl-md flex items-center">
          <Award className="h-3 w-3 mr-1" />
          Featured
        </div>
      )}
      
      <div className="relative h-40 bg-muted">
        {offer.offer_image ? (
          <img 
            src={offer.offer_image} 
            alt={offer.name} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="text-center p-4">
              <h3 className="font-medium text-lg text-primary">{offer.name}</h3>
              <p className="text-sm text-muted-foreground">{offer.advertiser_name}</p>
            </div>
          </div>
        )}
      </div>
      
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{offer.name}</CardTitle>
            <CardDescription className="line-clamp-1">
              {offer.advertiser_name}
            </CardDescription>
          </div>
          
          {offer.niche && (
            <Badge variant="outline" className="ml-2 capitalize">
              {offer.niche.replace('_', ' ')}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-2 flex-grow">
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {offer.description || "No description provided."}
        </p>
        
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center">
            <DollarSign className="h-4 w-4 mr-1 text-green-600" />
            <span>{formatCommission()}</span>
          </div>
          
          <div className="flex items-center">
            <Globe className="h-4 w-4 mr-1 text-blue-600" />
            <span>
              {geoList.length > 0 
                ? geoList.length > 3 
                  ? `${geoList.length} Countries` 
                  : geoList.map(g => g.code).join(', ')
                : 'Global'}
            </span>
          </div>
        </div>
      </CardContent>
      
      <Separator />
      
      <CardFooter className="p-4">
        <Button 
          variant="default" 
          className="w-full"
          onClick={() => onViewOffer(offer.id)}
        >
          View Details
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
