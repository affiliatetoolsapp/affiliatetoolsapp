
import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Offer, AffiliateOffer, TrackingLink } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Copy, Link, ExternalLink, Plus, Loader2, Clipboard, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function LinksPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOffer, setSelectedOffer] = useState<string | null>(null);
  const [customParams, setCustomParams] = useState<Array<{ key: string; value: string }>>([
    { key: '', value: '' }
  ]);

  // Get user's approved offers
  const { data: affiliateOffers } = useQuery({
    queryKey: ['affiliate-approved-offers', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('affiliate_offers')
        .select('*, offers(*)')
        .eq('affiliate_id', user.id)
        .eq('status', 'approved');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Get user's tracking links
  const { data: trackingLinks, refetch: refetchTrackingLinks } = useQuery({
    queryKey: ['tracking-links', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('tracking_links')
        .select('*, offers(*)')
        .eq('affiliate_id', user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Get stats for links
  const { data: clickStats } = useQuery({
    queryKey: ['link-clicks', trackingLinks],
    queryFn: async () => {
      if (!trackingLinks || trackingLinks.length === 0) return {};
      
      const trackingCodes = trackingLinks.map((link: any) => link.tracking_code);
      
      const { data, error } = await supabase
        .from('clicks')
        .select('tracking_code, count')
        .in('tracking_code', trackingCodes)
        .execute();
        
      if (error) throw error;
      
      const stats: Record<string, number> = {};
      data.forEach((row: any) => {
        stats[row.tracking_code] = parseInt(row.count);
      });
      
      return stats;
    },
    enabled: !!(trackingLinks && trackingLinks.length > 0),
  });

  // Get conversion stats
  const { data: conversionStats } = useQuery({
    queryKey: ['link-conversions', trackingLinks],
    queryFn: async () => {
      if (!trackingLinks || trackingLinks.length === 0) return {};
      
      const trackingCodes = trackingLinks.map((link: any) => link.tracking_code);
      
      const { data, error } = await supabase
        .from('clicks')
        .select('click_id, tracking_code')
        .in('tracking_code', trackingCodes);
        
      if (error) throw error;
      
      if (!data || data.length === 0) return {};
      
      const clickIds = data.map((click: any) => click.click_id);
      
      const { data: conversions, error: convError } = await supabase
        .from('conversions')
        .select('click_id, count')
        .in('click_id', clickIds)
        .execute();
        
      if (convError) throw convError;
      
      const clickIdToTrackingCode: Record<string, string> = {};
      data.forEach((click: any) => {
        clickIdToTrackingCode[click.click_id] = click.tracking_code;
      });
      
      const stats: Record<string, number> = {};
      conversions.forEach((conv: any) => {
        const trackingCode = clickIdToTrackingCode[conv.click_id];
        if (trackingCode) {
          stats[trackingCode] = (stats[trackingCode] || 0) + parseInt(conv.count);
        }
      });
      
      return stats;
    },
    enabled: !!(trackingLinks && trackingLinks.length > 0),
  });

  const handleAddParam = () => {
    setCustomParams([...customParams, { key: '', value: '' }]);
  };

  const handleRemoveParam = (index: number) => {
    setCustomParams(customParams.filter((_, i) => i !== index));
  };

  const handleParamChange = (index: number, field: 'key' | 'value', value: string) => {
    const updatedParams = [...customParams];
    updatedParams[index][field] = value;
    setCustomParams(updatedParams);
  };

  const generateTrackingLink = async () => {
    if (!user || !selectedOffer) {
      toast({
        title: "Error",
        description: "Please select an offer",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Filter out empty params
      const filteredParams = customParams.filter(param => param.key && param.value);
      
      // Convert array to object
      const paramsObject: Record<string, string> = {};
      filteredParams.forEach(param => {
        paramsObject[param.key] = param.value;
      });
      
      // Generate a unique tracking code
      const trackingCode = `${user.id.slice(0, 8)}-${selectedOffer.slice(0, 8)}-${Date.now().toString(36)}`;
      
      // Create tracking link
      const { error } = await supabase
        .from('tracking_links')
        .insert({
          affiliate_id: user.id,
          offer_id: selectedOffer,
          tracking_code: trackingCode,
          custom_params: Object.keys(paramsObject).length > 0 ? paramsObject : null,
        });
        
      if (error) throw error;
      
      toast({
        title: "Link created",
        description: "Your tracking link has been generated successfully",
      });
      
      // Reset form
      setSelectedOffer(null);
      setCustomParams([{ key: '', value: '' }]);
      
      // Refetch links
      refetchTrackingLinks();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate tracking link",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyTrackingLink = (trackingCode: string) => {
    const baseUrl = window.location.origin;
    const trackingUrl = `${baseUrl}/click/${trackingCode}`;
    
    navigator.clipboard.writeText(trackingUrl);
    
    toast({
      title: "Link copied",
      description: "Tracking link copied to clipboard",
    });
  };

  const filteredLinks = trackingLinks?.filter((link: any) => {
    if (!searchTerm) return true;
    return (
      link.offers.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.tracking_code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  if (!user || user.role !== 'affiliate') return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tracking Links</h1>
          <p className="text-muted-foreground">
            Generate and manage your affiliate links
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Link
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Create Tracking Link</DialogTitle>
              <DialogDescription>
                Generate a new tracking link for an approved offer
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="offer" className="text-right">
                  Offer
                </Label>
                <div className="col-span-3">
                  <Select value={selectedOffer || ''} onValueChange={setSelectedOffer}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an offer" />
                    </SelectTrigger>
                    <SelectContent>
                      {affiliateOffers?.map((offer: any) => (
                        <SelectItem key={offer.offer_id} value={offer.offer_id}>
                          {offer.offers.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Custom Parameters (Optional)</Label>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddParam}>
                    <Plus className="h-3 w-3 mr-1" />
                    Add Parameter
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {customParams.map((param, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        placeholder="Key"
                        value={param.key}
                        onChange={(e) => handleParamChange(index, 'key', e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        placeholder="Value"
                        value={param.value}
                        onChange={(e) => handleParamChange(index, 'value', e.target.value)}
                        className="flex-1"
                      />
                      {index > 0 && (
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleRemoveParam(index)}
                          className="px-2"
                        >
                          &times;
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                
                <p className="text-xs text-muted-foreground">
                  Parameters will be added to your tracking URL for campaign tracking
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={generateTrackingLink} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Link
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by offer name or tracking code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>
      
      <Tabs defaultValue="grid">
        <TabsList>
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="table">Table View</TabsTrigger>
        </TabsList>
        
        <TabsContent value="grid" className="space-y-4 mt-4">
          {filteredLinks?.length ? (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {filteredLinks.map((link: any) => {
                const baseUrl = window.location.origin;
                const trackingUrl = `${baseUrl}/click/${link.tracking_code}`;
                const clickCount = clickStats?.[link.tracking_code] || 0;
                const conversionCount = conversionStats?.[link.tracking_code] || 0;
                
                return (
                  <Card key={link.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="truncate text-base">{link.offers.name}</CardTitle>
                      <CardDescription className="flex items-center truncate">
                        <Link className="h-3 w-3 mr-1 flex-shrink-0" />
                        <span className="truncate">{link.tracking_code}</span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-muted rounded-md p-2 font-mono text-xs break-all overflow-hidden">
                        {trackingUrl}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div className="border rounded-md p-2 text-center">
                          <div className="text-sm text-muted-foreground">Clicks</div>
                          <div className="text-xl font-bold">{clickCount}</div>
                        </div>
                        <div className="border rounded-md p-2 text-center">
                          <div className="text-sm text-muted-foreground">Conversions</div>
                          <div className="text-xl font-bold">{conversionCount}</div>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => copyTrackingLink(link.tracking_code)}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy Link
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          asChild
                        >
                          <a href={link.offers.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Visit Offer
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 border rounded-md">
              <p className="text-muted-foreground">No tracking links found</p>
              {!trackingLinks?.length && (
                <p className="text-sm text-muted-foreground mt-2">
                  Get started by creating your first tracking link
                </p>
              )}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="table" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {filteredLinks?.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-3">Offer</th>
                        <th className="text-left p-3">Tracking Code</th>
                        <th className="text-left p-3">Created</th>
                        <th className="text-left p-3">Clicks</th>
                        <th className="text-left p-3">Conversions</th>
                        <th className="text-left p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLinks.map((link: any) => {
                        const clickCount = clickStats?.[link.tracking_code] || 0;
                        const conversionCount = conversionStats?.[link.tracking_code] || 0;
                        
                        return (
                          <tr key={link.id} className="border-b">
                            <td className="p-3">{link.offers.name}</td>
                            <td className="p-3 font-mono text-xs">{link.tracking_code}</td>
                            <td className="p-3">{new Date(link.created_at).toLocaleDateString()}</td>
                            <td className="p-3">{clickCount}</td>
                            <td className="p-3">{conversionCount}</td>
                            <td className="p-3">
                              <div className="flex space-x-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => copyTrackingLink(link.tracking_code)}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  asChild
                                >
                                  <a href={link.offers.url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4" />
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
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">No tracking links found</p>
                  {!trackingLinks?.length && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Get started by creating your first tracking link
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
