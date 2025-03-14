
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Offer, AffiliateOffer, TrackingLink } from '@/types';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Link, QrCode, Copy, Download, RefreshCw, Filter, ChevronDown, ArrowUpDown } from 'lucide-react';
import { TrackingLinkWithOffer } from '@/types';
import { useNavigate } from 'react-router-dom';

interface TrackingLinkGeneratorProps {
  preselectedOfferId?: string | null;
}

export default function TrackingLinkGenerator({ preselectedOfferId = null }: TrackingLinkGeneratorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedOfferId, setSelectedOfferId] = useState<string>("");
  const [customParams, setCustomParams] = useState<Record<string, string>>({
    sub1: "",
    sub2: "",
  });
  const [linkType, setLinkType] = useState<"direct" | "shortened" | "qr">("direct");
  const [isGenerating, setIsGenerating] = useState(false);

  // New state for filtering and sorting tracking links
  const [filterOfferId, setFilterOfferId] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  // Set preselected offer when component loads or when preselectedOfferId changes
  useEffect(() => {
    if (preselectedOfferId) {
      setSelectedOfferId(preselectedOfferId);
    }
  }, [preselectedOfferId]);

  // Get approved offers for this affiliate
  const { data: approvedOffers, isLoading: offersLoading } = useQuery({
    queryKey: ['approved-offers', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('affiliate_offers')
        .select(`
          offer_id,
          offer:offers(*)
        `)
        .eq('affiliate_id', user.id)
        .eq('status', 'approved');
      
      if (error) throw error;
      
      return data.map((item: any) => item.offer) as Offer[];
    },
    enabled: !!user && user.role === 'affiliate',
  });
  
  // Get tracking links for this affiliate
  const { data: trackingLinks, isLoading: linksLoading } = useQuery({
    queryKey: ['tracking-links', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('tracking_links')
        .select(`
          *,
          offer:offers(name, commission_type, commission_amount, commission_percent)
        `)
        .eq('affiliate_id', user.id);
      
      if (error) throw error;
      
      return data as (TrackingLink & { offer: Partial<Offer> })[];
    },
    enabled: !!user && user.role === 'affiliate',
  });
  
  // Create tracking link mutation
  const createTrackingLinkMutation = useMutation({
    mutationFn: async (variables: { 
      offerId: string; 
      customParams: Record<string, string>; 
      linkType: "direct" | "shortened" | "qr";
    }) => {
      if (!user) throw new Error("User not authenticated");
      
      // Filter out empty custom params
      const filteredParams: Record<string, string> = {};
      Object.entries(variables.customParams).forEach(([key, value]) => {
        if (value.trim() !== "") {
          filteredParams[key] = value.trim();
        }
      });
      
      // Generate a random tracking code (more secure than exposing database info)
      const trackingCode = crypto.randomUUID().substring(0, 8);
      
      const { data, error } = await supabase
        .from('tracking_links')
        .insert({
          affiliate_id: user.id,
          offer_id: variables.offerId,
          tracking_code: trackingCode,
          custom_params: Object.keys(filteredParams).length > 0 ? filteredParams : null,
          link_type: variables.linkType,
          created_at: new Date().toISOString()
        })
        .select();
      
      if (error) throw error;
      
      return data[0] as TrackingLink;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracking-links', user?.id] });
      toast({
        title: "Tracking Link Generated",
        description: "Your tracking link has been created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to generate tracking link",
      });
    }
  });

  // New mutation for regenerating tracking links
  const regenerateTrackingLinkMutation = useMutation({
    mutationFn: async (trackingLinkId: string) => {
      if (!user) throw new Error("User not authenticated");
      
      // Get the existing tracking link
      const { data: existingLink, error: fetchError } = await supabase
        .from('tracking_links')
        .select('*')
        .eq('id', trackingLinkId)
        .single();
        
      if (fetchError) throw fetchError;
      
      // Generate a new tracking code (more secure)
      const newTrackingCode = crypto.randomUUID().substring(0, 8);
      
      // Update the tracking link with the new code
      const { data, error } = await supabase
        .from('tracking_links')
        .update({
          tracking_code: newTrackingCode
        })
        .eq('id', trackingLinkId)
        .select();
      
      if (error) throw error;
      
      return data[0] as TrackingLink;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracking-links', user?.id] });
      toast({
        title: "Tracking Link Regenerated",
        description: "Your tracking link has been updated with a new code",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to regenerate tracking link",
      });
    }
  });
  
  // Handle tracking link generation
  const handleGenerateLink = () => {
    if (!selectedOfferId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select an offer",
      });
      return;
    }
    
    setIsGenerating(true);
    createTrackingLinkMutation.mutate({
      offerId: selectedOfferId,
      customParams,
      linkType
    });
    setIsGenerating(false);
    
    // Reset form
    if (!preselectedOfferId) {
      setSelectedOfferId("");
    }
    setCustomParams({ sub1: "", sub2: "" });
    setLinkType("direct");
  };
  
  // Handle copy link to clipboard
  const handleCopyLink = (trackingCode: string) => {
    const baseUrl = window.location.origin;
    const linkUrl = `${baseUrl}/r/${trackingCode}`;
    
    navigator.clipboard.writeText(linkUrl).then(() => {
      toast({
        title: "Link Copied",
        description: "Tracking link copied to clipboard",
      });
    });
  };

  // Handle regenerating a tracking link
  const handleRegenerateLink = (linkId: string) => {
    regenerateTrackingLinkMutation.mutate(linkId);
  };

  // Navigate to offer details page
  const handleViewOffer = (offerId: string) => {
    navigate(`/offers/${offerId}`);
  };

  // Download QR code
  const handleDownloadQR = (trackingCode: string) => {
    const baseUrl = window.location.origin;
    const trackingUrl = `${baseUrl}/r/${trackingCode}`;
    
    // Create QR code URL - this would typically use a service or library
    // For this implementation, we'll use an external service
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(trackingUrl)}`;
    
    // Trigger download
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `qrcode-${trackingCode}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "QR Code Downloaded",
      description: "Your QR code has been downloaded",
    });
  };
  
  // Add more custom param fields
  const handleAddCustomParam = () => {
    const nextIndex = Object.keys(customParams).length + 1;
    if (nextIndex <= 10) { // Max 10 custom params
      setCustomParams({
        ...customParams,
        [`sub${nextIndex}`]: ""
      });
    }
  };
  
  // Update custom param value
  const handleCustomParamChange = (key: string, value: string) => {
    setCustomParams({
      ...customParams,
      [key]: value
    });
  };

  // Filter and sort tracking links
  const filteredAndSortedLinks = trackingLinks
    ? trackingLinks
        .filter(link => filterOfferId === "all" || link.offer_id === filterOfferId)
        .sort((a, b) => {
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
        })
    : [];
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tracking Links</h1>
        <p className="text-muted-foreground">
          Generate and manage tracking links for your approved offers
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Generate New Tracking Link</CardTitle>
          <CardDescription>
            Create a tracking link for an offer you've been approved to promote
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="offer">Select Offer *</Label>
              <Select value={selectedOfferId} onValueChange={setSelectedOfferId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an offer" />
                </SelectTrigger>
                <SelectContent>
                  {offersLoading ? (
                    <SelectItem value="loading" disabled>Loading offers...</SelectItem>
                  ) : approvedOffers?.length ? (
                    approvedOffers.map((offer) => (
                      <SelectItem key={offer.id} value={offer.id}>
                        {offer.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>No approved offers</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="link-type">Link Type</Label>
              <Select value={linkType} onValueChange={(value: "direct" | "shortened" | "qr") => setLinkType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select link type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="direct">Direct Link</SelectItem>
                  <SelectItem value="shortened">Shortened Link</SelectItem>
                  <SelectItem value="qr">QR Code</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label>Custom Parameters (optional)</Label>
              {Object.keys(customParams).length < 10 && (
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={handleAddCustomParam}
                >
                  Add Parameter
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(customParams).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <div className="w-20 shrink-0">
                    <Label className="text-muted-foreground">{key}</Label>
                  </div>
                  <Input 
                    placeholder={`Value for ${key}`}
                    value={value}
                    onChange={(e) => handleCustomParamChange(key, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
          
          <div className="pt-2">
            <Button 
              onClick={handleGenerateLink} 
              disabled={!selectedOfferId || isGenerating}
            >
              <Link className="mr-2 h-4 w-4" />
              {isGenerating ? "Generating..." : "Generate Tracking Link"}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>My Tracking Links</CardTitle>
              <CardDescription>
                All your generated tracking links for approved offers
              </CardDescription>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {/* Filter dropdown */}
              <Select value={filterOfferId} onValueChange={setFilterOfferId}>
                <SelectTrigger className="w-[180px]">
                  <div className="flex items-center">
                    <Filter className="mr-2 h-4 w-4" />
                    <span>Filter by Offer</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Offers</SelectItem>
                  {approvedOffers?.map((offer) => (
                    <SelectItem key={offer.id} value={offer.id}>
                      {offer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Sort dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="default">
                    <ArrowUpDown className="mr-2 h-4 w-4" />
                    {sortOrder === "newest" ? "Newest First" : "Oldest First"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSortOrder("newest")}>
                    Newest First
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortOrder("oldest")}>
                    Oldest First
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {linksLoading ? (
            <div className="flex justify-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredAndSortedLinks.length > 0 ? (
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-3 text-left font-medium">Offer</th>
                      <th className="p-3 text-left font-medium">Commission</th>
                      <th className="p-3 text-left font-medium">Tracking Link</th>
                      <th className="p-3 text-left font-medium">Created</th>
                      <th className="p-3 text-center font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSortedLinks.map((link: TrackingLinkWithOffer) => {
                      const baseUrl = window.location.origin;
                      const trackingUrl = `${baseUrl}/r/${link.tracking_code}`;
                      
                      return (
                        <tr key={link.id} className="border-b hover:bg-muted/50">
                          <td className="p-3">
                            <button 
                              className="font-medium text-left hover:underline focus:outline-none focus:underline"
                              onClick={() => handleViewOffer(link.offer_id)}
                            >
                              {link.offer.name}
                            </button>
                          </td>
                          <td className="p-3">
                            {link.offer.commission_type === 'RevShare' 
                              ? `${link.offer.commission_percent}%` 
                              : `$${link.offer.commission_amount}`}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="font-mono text-sm truncate max-w-[180px]">
                                {trackingUrl}
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6"
                                onClick={() => handleCopyLink(link.tracking_code)}
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                          <td className="p-3">
                            {new Date(link.created_at).toLocaleDateString()}
                          </td>
                          <td className="p-3">
                            <div className="flex justify-center gap-2">
                              {link.link_type === 'qr' && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleDownloadQR(link.tracking_code)}
                                >
                                  <Download className="h-4 w-4 mr-1" />
                                  QR
                                </Button>
                              )}
                              <Button 
                                variant="outline" 
                                size="icon"
                                onClick={() => handleRegenerateLink(link.id)}
                                title="Generate a new tracking code"
                              >
                                <RefreshCw className="h-4 w-4" />
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
            <div className="text-center py-6 border rounded-md">
              {filterOfferId !== "all" ? (
                <p className="text-muted-foreground">No tracking links found for this offer</p>
              ) : (
                <p className="text-muted-foreground">You haven't created any tracking links yet</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
