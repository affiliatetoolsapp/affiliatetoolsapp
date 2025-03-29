import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdvertiserPostbackSetup from '@/components/advertiser/AdvertiserPostbackSetup';
import { getCountryFlag } from '@/components/affiliate/utils/offerUtils';
import { 
  Pencil, 
  DollarSign, 
  Tag, 
  Globe, 
  Target, 
  AlertTriangle, 
  Calendar,
  Clock,
  Award,
  ExternalLink,
  AlertCircle,
  Link,
  Ban,
  FileText,
  Users,
  LineChart
} from 'lucide-react';
import type { Offer, GeoCommission, Json } from '@/types/index';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

// Type guard for GeoCommission
function isGeoCommission(value: any): value is GeoCommission {
  return typeof value === 'object' && value !== null &&
    typeof value.country === 'string' &&
    (typeof value.commission_amount === 'number' || typeof value.commission_amount === 'string') &&
    (typeof value.commission_percent === 'number' || typeof value.commission_percent === 'string');
}

// Type guard for GeoCommission array
function isGeoCommissionArray(value: unknown): value is GeoCommission[] {
  return Array.isArray(value) && value.length > 0 && value.every(isGeoCommission);
}

// Type guard for string array
function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
}

export default function OfferDetails({ offerId }: { offerId: string }) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('details');
  const [isTrackingMounted, setIsTrackingMounted] = useState(false);
  
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
      // First get the affiliate applications
      const { data: applications, error: appError } = await supabase
        .from('affiliate_offers')
        .select(`
          id,
          status,
          applied_at,
          reviewed_at,
          traffic_source,
          notes,
          affiliate_id,
          affiliate:affiliate_id(
            id
          )
        `)
        .eq('offer_id', offerId);
      
      if (appError) throw appError;

      // For each application, get their stats
      const affiliatesWithStats = await Promise.all(applications.map(async (app) => {
        // Get clicks
        const { data: clicks, error: clicksError } = await supabase
          .from('clicks')
          .select('click_id, created_at')
          .eq('affiliate_id', app.affiliate_id)
          .eq('offer_id', offerId);
          
        if (clicksError) console.error('Error fetching clicks:', clicksError);
        
        const totalClicks = clicks?.length || 0;
        
        // Get conversions
        let conversions = [];
        let totalPayout = 0;
        
        if (totalClicks > 0) {
          const clickIds = clicks.map(c => c.click_id);
          
          const { data: convData, error: convError } = await supabase
            .from('conversions')
            .select('*')
            .in('click_id', clickIds);
            
          if (convError) console.error('Error fetching conversions:', convError);
          
          conversions = convData || [];
          totalPayout = conversions.reduce((sum, conv) => sum + (conv.commission || 0), 0);
        }
        
        const totalConversions = conversions.length;
        
        return {
          ...app,
          stats: [{
            clicks: totalClicks,
            conversions: totalConversions,
            revenue: totalPayout
          }]
        };
      }));

      return affiliatesWithStats;
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
  
  // Add effect to handle tracking tab mount
  useEffect(() => {
    if (activeTab === 'tracking') {
      setIsTrackingMounted(true);
    }
  }, [activeTab]);

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
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => navigate('/offers')} className="gap-2">
          ← Back to offers
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
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold">{offer.name}</h1>
          <Badge variant="default" className={offer.status === 'active' ? 'bg-blue-500' : ''}>
            {offer.status === 'active' ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{offer?.subtitle ?? 'Test offer 1'}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-[#F8F9FC] w-full justify-start rounded-lg p-1 h-auto">
          <TabsTrigger 
            value="details" 
            className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2 text-muted-foreground data-[state=active]:text-foreground"
          >
            Offer Details
          </TabsTrigger>
          <TabsTrigger 
            value="affiliates"
            className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2 text-muted-foreground data-[state=active]:text-foreground"
          >
            Requirements
          </TabsTrigger>
          <TabsTrigger 
            value="conversions"
            className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2 text-muted-foreground data-[state=active]:text-foreground"
          >
            Geo Targeting
          </TabsTrigger>
          <TabsTrigger 
            value="tracking"
            className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2 text-muted-foreground data-[state=active]:text-foreground"
          >
            Tracking
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl mb-2">Offer Details</h2>
              <p className="text-sm text-muted-foreground">Key information about this offer</p>
            </div>

            <div className="space-y-8">
              <div className="grid grid-cols-2">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-medium mb-2">Commission Model</h3>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-green-500">
                        <span className="text-lg">$</span>
                        <span className="text-lg">{offer.commission_amount}</span>
                      </div>
                      <Badge variant="secondary">{offer.commission_type}</Badge>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{offer.payout_frequency}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-medium mb-2">Added</h3>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(offer.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-medium mb-2">Advertiser</h3>
                    <div className="font-mono text-sm">
                      Advertiser ID: {offer.advertiser_id}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-medium mb-2 text-muted-foreground">Niche</h3>
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      <span>{offer.niche}</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-medium mb-2 text-muted-foreground">Status</h3>
                    <Badge variant="default" className={offer.status === 'active' ? 'bg-blue-500' : ''}>
                      {offer.status === 'active' ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-base font-medium mb-2">Offer URL</h3>
                <div className="space-y-2">
                  <a href={offer.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline flex items-center gap-1">
                    {offer.url} <ExternalLink className="h-4 w-4" />
                  </a>
                  <p className="text-sm text-muted-foreground">This is the direct offer URL. Use tracking links for your promotions.</p>
                </div>
              </div>
            </div>

            {offer.description && (
              <div>
                <h2 className="text-2xl mb-4">Detailed Description</h2>
                <div className="bg-card rounded-lg border p-6">
                  <p className="whitespace-pre-wrap">{offer.description}</p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="affiliates">
          <Card>
            <CardHeader>
              <CardTitle>Requirements</CardTitle>
              <CardDescription>Traffic requirements and restrictions for this offer</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Traffic Sources</h3>
                <div className="flex flex-wrap gap-2">
                  {offer?.allowed_traffic_sources?.map((source: string) => (
                    <Badge key={source} variant="outline">
                      {source}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Restrictions</h3>
                <p className="text-sm text-muted-foreground">
                  {offer?.restrictions || 'No specific restrictions'}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversions">
          <Card>
            <CardHeader>
              <CardTitle>Geographic Targeting</CardTitle>
              <CardDescription>Countries where this offer is available</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Targeted Countries</h3>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(offer?.geo_targets) && offer?.geo_targets?.map((country: string) => (
                    <Badge key={country} variant="outline" className="flex items-center gap-1">
                      {getCountryFlag(country)} {country}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Restricted Countries</h3>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(offer?.restricted_geos) && offer?.restricted_geos?.map((country: string) => (
                    <Badge key={country} variant="outline" className="flex items-center gap-1 bg-red-100/10">
                      {getCountryFlag(country)} {country}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tracking">
          {activeTab === 'tracking' && isTrackingMounted && (
            <AdvertiserPostbackSetup />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
