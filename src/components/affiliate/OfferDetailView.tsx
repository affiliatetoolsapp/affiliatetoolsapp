import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Offer } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import countryCodes from '@/components/offers/countryCodes';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, Star, ExternalLink, Calendar, Tag, Landmark, Users, Info, Globe, AlertTriangle, 
  Target, DollarSign, MapPin, ChevronRight, BarChart3, Link as LinkIcon, Clock, 
  FileText, CheckCircle, HelpCircle, ShieldAlert, ClipboardList, AlertCircle
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
  const [open, setOpen] = useState(false);
  const [trafficSource, setTrafficSource] = useState('');
  const [notes, setNotes] = useState('');

  // Improved mutation with better error handling and debugging
  const applyForOfferMutation = useMutation({
    mutationFn: async (offerId: string) => {
      if (!user) throw new Error("User not authenticated");
      
      console.log(`Applying for offer ${offerId} as affiliate ${user.id}`, {
        affiliate_id: user.id,
        offer_id: offerId,
        traffic_source: trafficSource,
        notes: notes
      });
      
      const application = {
        affiliate_id: user.id,
        offer_id: offerId,
        traffic_source: trafficSource,
        notes: notes,
        applied_at: new Date().toISOString(),
        status: 'pending'
      };
      
      // First check if an application already exists to prevent duplicates
      const { data: existingApp, error: checkError } = await supabase
        .from('affiliate_offers')
        .select('id')
        .eq('affiliate_id', user.id)
        .eq('offer_id', offerId)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned" - expected if no app exists
        console.error("Error checking for existing application:", checkError);
        throw new Error(`Failed to check for existing application: ${checkError.message}`);
      }
      
      if (existingApp) {
        console.log("Application already exists:", existingApp);
        throw new Error("You have already applied for this offer");
      }
      
      // Insert the new application
      const { data, error } = await supabase
        .from('affiliate_offers')
        .insert(application)
        .select();
      
      if (error) {
        console.error("Error creating application:", error);
        throw new Error(`Failed to create application: ${error.message}`);
      }
      
      console.log("Application created successfully:", data);
      return data[0];
    },
    onSuccess: (data) => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['affiliate-applications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['affiliate-offers', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['affiliate-pending-offers', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['available-offers'] });
      queryClient.invalidateQueries({ queryKey: ['pending-applications-count'] });
      
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

  // Improved cancel application mutation with better error handling
  const cancelApplicationMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("User not authenticated");
      
      console.log(`Cancelling application for offer ${offer.id} by affiliate ${user.id}`);
      
      // Find the application record
      const { data: applicationData, error: findError } = await supabase
        .from('affiliate_offers')
        .select('id')
        .eq('affiliate_id', user.id)
        .eq('offer_id', offer.id)
        .eq('status', 'pending')
        .single();
      
      if (findError) {
        console.error("Error finding application:", findError);
        throw new Error(`Could not find application: ${findError.message}`);
      }
      
      if (!applicationData) {
        throw new Error("Application not found");
      }
      
      console.log("Found application to cancel:", applicationData);
      
      // Delete the application
      const { error: deleteError } = await supabase
        .from('affiliate_offers')
        .delete()
        .eq('id', applicationData.id);
      
      if (deleteError) {
        console.error("Error deleting application:", deleteError);
        throw new Error(`Failed to cancel application: ${deleteError.message}`);
      }
      
      console.log("Application cancelled successfully");
      return { success: true, applicationId: applicationData.id };
    },
    onSuccess: (data) => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['affiliate-applications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['affiliate-offers', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['affiliate-pending-offers', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['available-offers'] });
      queryClient.invalidateQueries({ queryKey: ['pending-applications-count'] });
      
      toast({
        title: "Application Cancelled",
        description: "Your application has been cancelled. You can reapply if needed.",
      });
    },
    onError: (error: any) => {
      console.error("Error cancelling application:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to cancel application",
      });
    }
  });

  const handleApplyClick = () => setOpen(true);
  
  const handleApplySubmit = () => {
    if (!trafficSource.trim()) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please specify your traffic source",
      });
      return;
    }
    
    console.log("Submitting application for offer:", offer.id);
    applyForOfferMutation.mutate(offer.id);
  };
  
  const handleCancelClick = () => {
    if (confirm("Are you sure you want to cancel your application?")) {
      cancelApplicationMutation.mutate();
    }
  };
  
  // Format geo targets for display with country names and codes
  const formatGeoTargets = () => {
    if (!offer.geo_targets) return [{ code: "WW", name: "Worldwide", flag: "🌐" }];
    
    try {
      let geoCodes: string[] = [];
      
      // Handle different types of geo_targets
      if (Array.isArray(offer.geo_targets)) {
        geoCodes = offer.geo_targets;
      } else if (typeof offer.geo_targets === 'string') {
        try {
          // Try to parse as JSON first
          const parsed = JSON.parse(offer.geo_targets);
          if (Array.isArray(parsed)) {
            geoCodes = parsed;
          } else if (typeof parsed === 'object' && parsed !== null) {
            geoCodes = Object.keys(parsed);
          } else {
            geoCodes = [parsed];
          }
        } catch {
          // If not JSON, treat as single country code
          geoCodes = [offer.geo_targets];
        }
      } else if (typeof offer.geo_targets === 'object' && offer.geo_targets !== null) {
        geoCodes = Object.keys(offer.geo_targets);
      }
      
      // If no valid country codes found, return worldwide
      if (geoCodes.length === 0) {
        return [{ code: "WW", name: "Worldwide", flag: "🌐" }];
      }
      
      // Map country codes to full country info
      return geoCodes.map(country => {
        const countryInfo = countryCodes.find(c => c.code === country.toUpperCase());
        return {
          code: country.toUpperCase(),
          name: countryInfo?.name || country,
          flag: countryInfo?.flag || "🌐"
        };
      });
    } catch (e) {
      console.error("Error parsing geo targets:", e);
      return [{ code: "WW", name: "Worldwide", flag: "🌐" }];
    }
  };
  
  // Format restricted geos for display with country names and codes
  const getRestrictedGeos = () => {
    if (!offer.restricted_geos || !Array.isArray(offer.restricted_geos) || offer.restricted_geos.length === 0) {
      return [];
    }
    
    return offer.restricted_geos.map(country => {
      const countryInfo = countryCodes.find(c => c.code === country.toUpperCase());
      return {
        code: country.toUpperCase(),
        name: countryInfo?.name || country,
        flag: countryInfo?.flag || "🌐"
      };
    });
  };

  // Get allowed traffic sources
  const getAllowedTrafficSources = () => {
    if (!offer.allowed_traffic_sources || !Array.isArray(offer.allowed_traffic_sources) || offer.allowed_traffic_sources.length === 0) {
      return ["All sources allowed"];
    }
    
    return offer.allowed_traffic_sources;
  };

  const targetedGeos = formatGeoTargets();
  const restrictedGeos = getRestrictedGeos();
  const allowedTrafficSources = getAllowedTrafficSources();

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
        <div className="flex items-start gap-3 justify-between">
          <div>
            <h1 className="text-3xl font-bold">{offer.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              {offer.is_featured && (
                <Badge variant="outline" className="bg-yellow-100 dark:bg-yellow-900">
                  <Star className="h-3 w-3 mr-1 text-yellow-500" />
                  Featured Offer
                </Badge>
              )}
              <Badge variant={offer.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                {offer.status}
              </Badge>
            </div>
          </div>
          {applicationStatus === 'approved' && (
            <Button 
              onClick={() => navigate(`/links?offer=${offer.id}`)}
              size="sm"
              className="flex items-center"
            >
              <LinkIcon className="h-4 w-4 mr-2" />
              Generate Links
            </Button>
          )}
        </div>
        <p className="mt-3 text-muted-foreground">{offer.description}</p>
      </div>
      
      <Tabs defaultValue="details">
        <TabsList className="grid grid-cols-4 sm:flex">
          <TabsTrigger value="details">Offer Details</TabsTrigger>
          <TabsTrigger value="requirements">Requirements</TabsTrigger>
          <TabsTrigger value="geo">Geo Targeting</TabsTrigger>
          {applicationStatus === 'approved' && <TabsTrigger value="tracking">Tracking</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Offer Details</CardTitle>
              <CardDescription>Key information about this offer</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">Commission Model</Label>
                  <p className="font-medium flex items-center">
                    <DollarSign className="h-4 w-4 mr-1 text-green-500" />
                    {offer.commission_type === 'RevShare' 
                      ? `${offer.commission_percent}% Revenue Share` 
                      : `$${offer.commission_amount} per ${offer.commission_type.slice(2)}`}
                  </p>
                </div>
                
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">Niche</Label>
                  <p className="font-medium flex items-center">
                    <Tag className="h-4 w-4 mr-1 text-blue-500" />
                    {offer.niche || 'General'}
                  </p>
                </div>
                
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">Added</Label>
                  <p className="font-medium flex items-center">
                    <Calendar className="h-4 w-4 mr-1 text-indigo-500" />
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
                  <Landmark className="h-4 w-4 mr-1 text-slate-500" />
                  {offer.advertiser_name || 'Company Name'}
                </p>
              </div>
              
              {applicationStatus === 'approved' && (
                <>
                  <Separator />
                  
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">Offer URL</Label>
                    <div className="flex items-center">
                      <p className="font-mono text-sm truncate">{offer.url}</p>
                      <Button variant="ghost" size="sm" className="px-2 ml-1" asChild>
                        <a href={offer.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      This is the direct offer URL. Use tracking links for your promotions.
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Detailed Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none dark:prose-invert">
                <p>{offer.description}</p>
                
                {offer.marketing_materials && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium">Marketing Materials</h3>
                    <p className="mt-2 text-muted-foreground">
                      {typeof offer.marketing_materials === 'string' 
                        ? offer.marketing_materials
                        : JSON.stringify(offer.marketing_materials) || 'Additional marketing materials will be provided after approval.'}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="requirements" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ClipboardList className="h-6 w-6 text-blue-500" />
                <div>
                  <CardTitle>Requirements & Expectations</CardTitle>
                  <CardDescription>What's expected from affiliates</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium flex items-center gap-2">
                  <Globe className="h-5 w-5 text-emerald-500" />
                  Allowed Traffic Sources
                </h3>
                <div className="flex flex-wrap gap-1 ml-6">
                  {allowedTrafficSources.map((source, index) => (
                    <Badge key={index} variant="outline">{source}</Badge>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <h3 className="font-medium flex items-center gap-2">
                  <Users className="h-5 w-5 text-violet-500" />
                  Target Audience
                </h3>
                <p className="text-sm text-muted-foreground">
                  {offer.target_audience || 'This offer is targeted at a general audience.'}
                </p>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <h3 className="font-medium flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  Restrictions
                </h3>
                <p className="text-sm text-muted-foreground">
                  {offer.restrictions || 'No specific restrictions for this offer.'}
                </p>
              </div>
              
              {offer.conversion_requirements && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h3 className="font-medium flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      Conversion Requirements
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {offer.conversion_requirements}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="geo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Geo Targeting Information</CardTitle>
              <CardDescription>Geographical targeting requirements for this offer</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium flex items-center mb-3">
                  <Globe className="h-5 w-5 mr-2 text-blue-500" />
                  Targeted Countries
                </h3>
                {targetedGeos.length === 1 && targetedGeos[0].code === "WW" ? (
                  <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md">
                    <p className="text-blue-700 dark:text-blue-300">
                      This offer is available worldwide with no country restrictions.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {targetedGeos.map((geo, index) => (
                      <Badge key={index} className="justify-start px-3 py-1.5" variant="outline">
                        <span className="mr-1.5">{geo.flag}</span>
                        {geo.code}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              
              {restrictedGeos.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium flex items-center mb-3">
                    <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
                    Restricted Countries
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {restrictedGeos.map((geo, index) => (
                      <Badge 
                        key={index} 
                        className="justify-start px-3 py-1.5 bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800"
                      >
                        <span className="mr-1.5">{geo.flag}</span>
                        {geo.code}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {applicationStatus === 'approved' && (
          <TabsContent value="tracking" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tracking Information</CardTitle>
                <CardDescription>Important details for implementing this offer</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-medium flex items-center">
                    <BarChart3 className="h-4 w-4 mr-2 text-indigo-500" />
                    Performance Metrics
                  </h3>
                  <p className="text-sm text-muted-foreground ml-6">
                    This offer is tracked based on {offer.commission_type === 'RevShare' ? 'revenue share' : 
                      offer.commission_type === 'CPA' ? 'actions' : 
                      offer.commission_type === 'CPC' ? 'clicks' : 
                      offer.commission_type === 'CPL' ? 'leads' : 
                      offer.commission_type === 'CPS' ? 'sales' : 'conversions'}.
                  </p>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <h3 className="font-medium flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-orange-500" />
                    Cookie Duration
                  </h3>
                  <p className="text-sm text-muted-foreground ml-6">
                    Tracking cookies for this offer last for 30 days by default.
                  </p>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <h3 className="font-medium flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-green-500" />
                    Tracking Implementation
                  </h3>
                  <div className="ml-6">
                    <p className="text-sm text-muted-foreground mb-2">
                      To promote this offer, create tracking links from the "Generate Links" button. These links will automatically:
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-4">
                      <li>Track visitor clicks</li>
                      <li>Attribute conversions to your account</li> 
                      <li>Pass additional parameters to the advertiser</li>
                    </ul>
                  </div>
                </div>
                
                <Separator />
                
                <div className="bg-muted p-4 rounded-md">
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 mr-2 text-green-500 mt-0.5" />
                    <div>
                      <h3 className="font-medium">Ready to Promote</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        This offer is ready for promotion. Generate your tracking links and start driving traffic!
                      </p>
                      <Button 
                        className="mt-2" 
                        size="sm"
                        onClick={() => navigate(`/links?offer=${offer.id}`)}
                      >
                        Generate Tracking Links
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
      
      <Card>
        <CardFooter className="flex justify-between p-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center space-x-1" asChild>
                  <a href={offer.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Preview Offer
                  </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Preview the offer landing page (no tracking)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {!applicationStatus ? (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button 
                  size="sm" 
                  onClick={handleApplyClick}
                  disabled={applyForOfferMutation.isPending}
                >
                  {applyForOfferMutation.isPending ? 'Applying...' : 'Apply Now'}
                </Button>
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
                    <Label htmlFor="traffic">Traffic Source <span className="text-red-500">*</span></Label>
                    <Input 
                      id="traffic" 
                      value={trafficSource} 
                      onChange={(e) => setTrafficSource(e.target.value)} 
                      placeholder="e.g., Social Media, Email Marketing" 
                      required
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
                    disabled={applyForOfferMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    onClick={handleApplySubmit}
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
          ) : applicationStatus === 'pending' ? (
            <Button 
              size="sm" 
              variant="destructive" 
              onClick={handleCancelClick}
              disabled={cancelApplicationMutation.isPending}
            >
              {cancelApplicationMutation.isPending ? 'Cancelling...' : 'Cancel Application'}
            </Button>
          ) : (
            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
              <Info className="h-4 w-4" />
              <span>
                Application was rejected
              </span>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default OfferDetailView;
