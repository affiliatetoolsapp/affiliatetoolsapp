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
  FileText
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
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-start gap-3 justify-between">
            <div className="flex gap-4 items-start">
              {offer.offer_image && (
                <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                  <img 
                    src={offer.offer_image} 
                    alt={`${offer.name} offer`}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold">{offer.name}</h1>
                <div className="flex items-center gap-2 mt-2">
                  {offer.is_featured && (
                    <Badge variant="outline" className="bg-yellow-100 dark:bg-yellow-900">
                      <Award className="h-3 w-3 mr-1 text-yellow-500" />
                      Featured Offer
                    </Badge>
                  )}
                  <Badge variant={offer.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                    {offer.status}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
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
        </div>
      </div>

      <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex w-fit">
          <TabsTrigger value="details">Offer Details</TabsTrigger>
          <TabsTrigger value="affiliates">Affiliates</TabsTrigger>
          <TabsTrigger value="conversions">Conversions</TabsTrigger>
          <TabsTrigger value="tracking">Tracking</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <Card className="border-0 bg-background/40 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6 border-b">
              <div>
                <CardTitle className="text-xl font-semibold">Offer Details</CardTitle>
                <CardDescription>Key information about this offer</CardDescription>
              </div>
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
            <CardContent className="pt-6">
              <div className="grid gap-8">
                {/* Key Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Commission Details */}
                  <Card className="border bg-muted/40">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-4">
                        <DollarSign className="h-5 w-5 text-green-500" />
                        <h3 className="font-semibold">Commission Details</h3>
                      </div>
                      <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                            <DollarSign className="h-3 w-3 mr-1" />
                            {(() => {
                              // Default commission display
                              const defaultCommission = offer.commission_type === 'RevShare' 
                                ? (offer.commission_percent ? `${offer.commission_percent}%` : '0%')
                                : (offer.commission_amount ? `$${offer.commission_amount}` : '$0');

                              // Check for geo commissions
                              const geoCommissions = (offer.geo_commissions as unknown) as GeoCommission[];
                              if (!Array.isArray(geoCommissions) || geoCommissions.length === 0) {
                                return defaultCommission;
                              }

                              // Filter valid amounts
                              const amounts = geoCommissions
                                .map(gc => {
                                  const amount = offer.commission_type === 'RevShare' 
                                    ? Number(gc.commission_percent)
                                    : Number(gc.commission_amount);
                                  return isNaN(amount) ? null : amount;
                                })
                                .filter((amount): amount is number => amount !== null);

                              if (amounts.length === 0) {
                                return defaultCommission;
                              }

                              const min = Math.min(...amounts);
                              const max = Math.max(...amounts);

                              if (min === max) {
                                return offer.commission_type === 'RevShare'
                                  ? `${min}%`
                                  : `$${min}`;
                              }

                              return offer.commission_type === 'RevShare'
                                ? `${min}-${max}%`
                                : `$${min}-$${max}`;
                            })()}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {(() => {
                              const typeMap: Record<string, string> = {
                                'C2A': 'CPA',
                                'C2L': 'CPL',
                                'C2S': 'CPS',
                                'C2C': 'CPC',
                                'RevShare': 'Revenue Share'
                              };
                              return typeMap[offer.commission_type] || offer.commission_type;
                            })()}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            {offer.payout_frequency || 'Monthly'}
                          </Badge>
                        </div>

                        {/* Geo-Specific Rates */}
                        {offer.geo_commissions && Array.isArray(offer.geo_commissions) && offer.geo_commissions.length > 0 && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium flex items-center">
                              <Globe className="h-4 w-4 mr-2 text-blue-500" />
                              Geo-Specific Rates
                            </Label>
                            <div className="flex flex-wrap gap-2">
                              {(offer.geo_commissions as any[])
                                .sort((a, b) => (a?.country || '').localeCompare(b?.country || ''))
                                .map((gc, idx) => {
                                  if (!gc?.country) return null;
                                  
                                  const flag = getCountryFlag(gc.country);
                                  const commissionValue = offer.commission_type === 'RevShare'
                                    ? Number(gc.commission_percent)
                                    : Number(gc.commission_amount);
                                  
                                  const amount = !isNaN(commissionValue)
                                    ? offer.commission_type === 'RevShare'
                                      ? `${commissionValue}%`
                                      : `$${commissionValue}`
                                    : offer.commission_type === 'RevShare' ? '0%' : '$0';
                                  
                                  return (
                                    <Badge key={idx} variant="outline" className="text-xs flex items-center gap-1.5">
                                      <span>{flag}</span>
                                      <span>{gc.country}</span>
                                      <span className="font-medium text-green-600 dark:text-green-400">{amount}</span>
                                    </Badge>
                                  );
                                })}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Niche & URL */}
                  <Card className="border bg-muted/40">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Tag className="h-5 w-5 text-blue-500" />
                        <h3 className="font-semibold">Niche & URL</h3>
                      </div>
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="flex items-center">
                            <Tag className="h-3 w-3 mr-1 text-blue-500" />
                            {offer.niche || 'General'}
                          </Badge>
                          <Button variant="ghost" size="icon" asChild className="h-6 w-6">
                            <a href={offer.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                        <code className="text-xs px-2 py-1 bg-muted rounded-md font-mono block truncate">
                          {offer.url}
                        </code>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Status & Created */}
                  <Card className="border bg-muted/40">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-4">
                        <AlertCircle className="h-5 w-5 text-orange-500" />
                        <h3 className="font-semibold">Status & Info</h3>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Badge variant={offer.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                            {offer.status}
                          </Badge>
                          <Badge variant="outline" className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(offer.created_at).toLocaleDateString()}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Geographic Targeting and Traffic Sources - Side by Side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Geographic Targeting */}
                  <Card className="border bg-muted/40">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Globe className="h-5 w-5 text-violet-500" />
                        <h3 className="font-semibold">Geographic Targeting</h3>
                      </div>
                      <div className="grid gap-6">
                        {/* Targeted Countries */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium flex items-center">
                            <Globe className="h-4 w-4 mr-2 text-blue-500" />
                            Targeted Countries
                          </Label>
                          {(!offer.geo_targets || !isStringArray(offer.geo_targets) || offer.geo_targets.length === 0) ? (
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                🌐 Available Worldwide
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                This offer can be promoted in any country
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              {offer.geo_targets.map((code, idx) => {
                                const flag = getCountryFlag(code);
                                return (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {flag} {code.toUpperCase()}
                                  </Badge>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Restricted Countries */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium flex items-center">
                            <Ban className="h-4 w-4 mr-2 text-red-500" />
                            Restricted Countries
                          </Label>
                          {(!offer.restricted_geos || !isStringArray(offer.restricted_geos) || offer.restricted_geos.length === 0) ? (
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                                No Geographic Restrictions
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                This offer has no country restrictions
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              {offer.restricted_geos.map((code, idx) => {
                                const flag = getCountryFlag(code);
                                return (
                                  <Badge key={idx} variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
                                    {flag} {code.toUpperCase()}
                                  </Badge>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Traffic Sources & Restrictions */}
                  <Card className="border bg-muted/40">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Target className="h-5 w-5 text-indigo-500" />
                        <h3 className="font-semibold">Traffic Sources & Restrictions</h3>
                      </div>
                      <div className="grid gap-6">
                        {/* Traffic Sources - Always visible */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium flex items-center">
                            <Target className="h-4 w-4 mr-2 text-violet-500" />
                            Traffic Sources
                          </Label>
                          {(!offer.allowed_traffic_sources || !Array.isArray(offer.allowed_traffic_sources) || offer.allowed_traffic_sources.length === 0) ? (
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                🎯 All Traffic Sources
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                This offer accepts all traffic sources
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              {offer.allowed_traffic_sources.map((source, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {source}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Restrictions - Always visible */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium flex items-center">
                            <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                            Restrictions
                          </Label>
                          {!offer.restrictions ? (
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                                No Traffic Restrictions
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                This offer has no traffic restrictions
                              </span>
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {offer.restrictions}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Description */}
                {offer.description && (
                  <Card className="border bg-muted/40">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-4">
                        <FileText className="h-5 w-5 text-gray-500" />
                        <h3 className="font-semibold">Description</h3>
                      </div>
                      <p className="text-sm leading-relaxed text-muted-foreground">{offer.description}</p>
                    </CardContent>
                  </Card>
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
                        <th className="px-4 py-3 text-left text-sm font-medium">Clicks</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Conv.</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                        <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {affiliates.map((affiliate) => (
                        <tr key={affiliate.id}>
                          <td className="px-4 py-3 text-sm">
                            Affiliate ID: {affiliate.affiliate.id}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {new Date(affiliate.applied_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {affiliate.traffic_source || 'Not specified'}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {affiliate.stats?.[0]?.clicks?.toLocaleString() || '0'}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {affiliate.stats?.[0]?.conversions?.toLocaleString() || '0'}
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
    </div>
  );
}
