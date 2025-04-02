import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Search, 
  Filter, 
  PlusCircle, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Pause, 
  Play, 
  Grid, 
  SortAsc, 
  SortDesc,
  ArrowDownAZ,
  ArrowUpAZ,
  Globe,
  Table as TableIcon,
  Award,
  Target,
  Users,
  DollarSign,
  Tag,
  MoreHorizontal,
  Plus,
  Loader2,
  Image,
  Link,
  Copy,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatGeoTargets, getCountryFlag } from '@/components/affiliate/utils/offerUtils';
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
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatCurrency } from '@/lib/utils';
import { Offer } from '@/types';

interface UserMetadata {
  display_name?: string;
}

interface DatabaseUser {
  id: string;
  email: string;
  metadata?: UserMetadata;
}

interface GeoCommission {
  geo: string;
  amount: string;
}

interface DatabaseOffer {
  id: string;
  name: string;
  status: string;
  description?: string;
  niche?: string;
  commission_type: string;
  commission_amount?: number;
  commission_percent?: number;
  geo_targets?: any[];
  geo_commissions?: any[];
  allowed_traffic_sources?: string[];
  restricted_geos?: string[];
  offer_image?: string;
  created_at: string;
  advertiser_id?: string;
  is_featured?: boolean;
  url?: string;
  marketing_materials?: string[];
  target_audience?: string;
  restrictions?: string;
  conversion_requirements?: string;
}

type OfferWithAdvertiser = Omit<Offer, 'advertiser'> & {
  advertiser: {
    id: string;
    email: string;
    name: string;
  };
};

interface OfferDetailViewProps {
  offer: Offer;
  applicationStatus: string | null;
  onBack: () => void;
}

export default function OfferDetailView({ offer, applicationStatus, onBack }: OfferDetailViewProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isApplying, setIsApplying] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [trackingLink, setTrackingLink] = useState('');
  const [showPostbackSetup, setShowPostbackSetup] = useState(false);
  
  // Function to apply for the offer
  const applyForOffer = async () => {
    if (!user || !offer) return;
    
    setIsApplying(true);
    try {
      const { data, error } = await supabase
        .from('affiliate_offers')
        .insert([
          { 
            affiliate_id: user.id, 
            offer_id: offer.id, 
            status: 'pending',
            applied_at: new Date().toISOString()
          }
        ]);
      
      if (error) throw error;
      
      // Invalidate queries to update the UI
      await queryClient.invalidateQueries({ queryKey: ['offer-application', offer.id, user.id] });
      
      toast({
        title: "Application Submitted",
        description: "Your application has been submitted and is awaiting approval.",
        variant: "default"
      });
    } catch (error) {
      console.error("Error applying for offer:", error);
      toast({
        title: "Error",
        description: "Failed to submit application. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsApplying(false);
    }
  };
  
  // Function to cancel the application
  const cancelApplication = async () => {
    if (!user || !offer) return;
    
    setIsCancelling(true);
    try {
      const { data, error } = await supabase
        .from('affiliate_offers')
        .delete()
        .eq('affiliate_id', user.id)
        .eq('offer_id', offer.id);
      
      if (error) throw error;
      
      // Invalidate queries to update the UI
      await queryClient.invalidateQueries({ queryKey: ['offer-application', offer.id, user.id] });
      
      toast({
        title: "Application Cancelled",
        description: "Your application has been cancelled.",
        variant: "default"
      });
    } catch (error) {
      console.error("Error cancelling application:", error);
      toast({
        title: "Error",
        description: "Failed to cancel application. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCancelling(false);
    }
  };
  
  // Function to generate tracking link
  const generateTrackingLink = async () => {
    if (!user || !offer) return;
    
    try {
      // Check if a tracking link already exists for this offer and affiliate
      const { data: existingLink, error: linkError } = await supabase
        .from('tracking_links')
        .select('tracking_code')
        .eq('affiliate_id', user.id)
        .eq('offer_id', offer.id)
        .single();
      
      if (linkError && linkError.code !== 'PGRST116') {
        console.error("Error checking existing tracking link:", linkError);
        throw linkError;
      }
      
      if (existingLink) {
        // If a link already exists, use it
        setTrackingLink(existingLink.tracking_code);
        return;
      }
      
      // If no link exists, create a new one
      const trackingCode = `t_${Math.random().toString(36).substring(2, 15)}`;
      
      const { data, error } = await supabase
        .from('tracking_links')
        .insert([
          { 
            affiliate_id: user.id, 
            offer_id: offer.id, 
            tracking_code: trackingCode,
            link_type: 'direct'
          }
        ]);
      
      if (error) throw error;
      
      setTrackingLink(trackingCode);
    } catch (error) {
      console.error("Error generating tracking link:", error);
      toast({
        title: "Error",
        description: "Failed to generate tracking link. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Function to copy the tracking link to clipboard
  const copyToClipboard = () => {
    if (!offer || !trackingLink) return;
    
    const fullTrackingLink = `${offer.url}?tracking_code=${trackingLink}`;
    
    navigator.clipboard.writeText(fullTrackingLink)
      .then(() => {
        setIsCopying(true);
        toast({
          title: "Link Copied",
          description: "The tracking link has been copied to your clipboard.",
          variant: "default"
        });
        setTimeout(() => setIsCopying(false), 2000);
      })
      .catch(err => {
        console.error("Failed to copy link:", err);
        toast({
          title: "Error",
          description: "Failed to copy the tracking link. Please try again.",
          variant: "destructive"
        });
      });
  };
  
  useEffect(() => {
    if (offer) {
      generateTrackingLink();
    }
  }, [offer, user]);
  
  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack}>
        ← Back to Offers
      </Button>
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{offer.name}</CardTitle>
            <div className="flex items-center gap-2">
              {applicationStatus === 'pending' ? (
                <Badge variant="secondary">Pending Approval</Badge>
              ) : applicationStatus === 'approved' ? (
                <Badge variant="default">Approved</Badge>
              ) : applicationStatus === 'rejected' ? (
                <Badge variant="destructive">Rejected</Badge>
              ) : null}
              
              {offer.is_featured && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Award className="h-4 w-4 text-yellow-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      This is a featured offer
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
          <CardDescription>{offer.description}</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {offer.offer_image ? (
              <img 
                src={offer.offer_image} 
                alt={offer.name}
                className="w-full h-48 object-cover rounded-md"
              />
            ) : (
              <div className="w-full h-48 bg-muted rounded-md flex items-center justify-center">
                <Image className="w-12 h-12 text-muted-foreground" />
              </div>
            )}
            
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Tag className="h-4 w-4 text-[#3B82F6]" />
                <span className="text-sm">{offer.niche}</span>
              </div>
              
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1">
                  <span className="text-[#10B981] text-sm font-medium">
                    ${Number(offer.commission_amount).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm text-muted-foreground">
                    {offer.commission_type}
                  </span>
                </div>
                <Badge variant="outline" className="w-fit text-xs bg-[#EFF6FF] text-[#3B82F6] border-[#93C5FD]">
                  {offer.payout_frequency}
                </Badge>
              </div>
              
              <div className="flex items-center gap-1.5">
                <Globe className="h-4 w-4 text-[#3B82F6]" />
                <span className="text-sm">{offer.geo_targets?.length || 0} country</span>
              </div>
              
              <div className="flex items-center gap-1.5">
                <Target className="h-4 w-4 text-[#8B5CF6]" />
                <span className="text-sm">{offer.allowed_traffic_sources?.length || 0} source</span>
              </div>
              
              {offer.restricted_geos?.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <Badge variant="destructive" className="w-fit text-xs bg-[#FEE2E2] text-[#EF4444] border-none">
                    {offer.restricted_geos.length} restricted
                  </Badge>
                </div>
              )}
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <h3 className="text-md font-medium">Offer Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium">Target Audience</h4>
                <p className="text-sm text-muted-foreground">
                  {offer.target_audience || 'N/A'}
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium">Conversion Requirements</h4>
                <p className="text-sm text-muted-foreground">
                  {offer.conversion_requirements || 'N/A'}
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium">Restrictions</h4>
                <p className="text-sm text-muted-foreground">
                  {offer.restrictions || 'N/A'}
                </p>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <h3 className="text-md font-medium">Tracking</h3>
            
            {applicationStatus === 'approved' ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Link className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {offer.url}?tracking_code=
                  </p>
                  <Input 
                    type="text"
                    value={trackingLink}
                    readOnly
                    className="w-32 text-center"
                  />
                </div>
                
                <Button 
                  size="sm"
                  onClick={copyToClipboard}
                  disabled={isCopying}
                >
                  {isCopying ? (
                    <>
                      <Copy className="h-4 w-4 mr-2 animate-pulse" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Link
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <p className="text-sm text-muted-foreground">
                  You must be approved to generate a tracking link.
                </p>
              </div>
            )}
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <h3 className="text-md font-medium">Actions</h3>
            
            {applicationStatus === null ? (
              <Button 
                onClick={applyForOffer}
                disabled={isApplying}
              >
                {isApplying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Applying...
                  </>
                ) : (
                  "Apply for Offer"
                )}
              </Button>
            ) : applicationStatus === 'pending' ? (
              <Button 
                variant="destructive"
                onClick={cancelApplication}
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  "Cancel Application"
                )}
              </Button>
            ) : applicationStatus === 'approved' ? (
              <div className="flex items-center gap-2">
                <Button onClick={() => setShowPostbackSetup(true)}>
                  Setup Postback
                </Button>
                
                <Button variant="secondary">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Visit Offer Page
                </Button>
              </div>
            ) : applicationStatus === 'rejected' ? (
              <p className="text-sm text-muted-foreground">
                Your application for this offer was rejected.
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>
      
      <AlertDialog open={showPostbackSetup} onOpenChange={setShowPostbackSetup}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Postback URL Setup</AlertDialogTitle>
            <AlertDialogDescription>
              Configure your postback URL to receive real-time conversion updates.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Enter your postback URL:
            </p>
            <Input 
              type="text"
              placeholder="https://your-domain.com/postback"
              className="mt-2"
            />
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Save Changes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
