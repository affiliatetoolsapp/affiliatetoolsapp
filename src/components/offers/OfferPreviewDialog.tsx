
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Offer } from "@/types"
import { Eye, DollarSign, Globe, AlertTriangle, Tag, Target } from "lucide-react"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import countryCodes from "./countryCodes"

interface OfferPreviewDialogProps {
  offer: Partial<Offer>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onConfirm?: () => void;
  isSubmitting?: boolean;
}

export function OfferPreviewDialog({ 
  offer, 
  open, 
  onOpenChange, 
  onConfirm, 
  isSubmitting 
}: OfferPreviewDialogProps) {

  // Fix the type checking for geo_targets to prevent TypeScript errors
  const geoTargetsList = offer.geo_targets 
  ? (Array.isArray(offer.geo_targets) 
      ? offer.geo_targets.join(', ') 
      : typeof offer.geo_targets === 'string' 
        ? offer.geo_targets 
        : JSON.stringify(offer.geo_targets))
  : 'Global';

  // Format geo targets for display
  const formatGeoTargets = (offer: Partial<Offer>) => {
    if (!offer.geo_targets || !Array.isArray(offer.geo_targets) || offer.geo_targets.length === 0) {
      return [];
    }

    return offer.geo_targets.map(code => {
      const country = countryCodes.find(c => c.code === code);
      return {
        code,
        flag: country?.flag || '🌐',
        name: country?.name || code
      };
    });
  };

  // Get min and max commission amounts if there are geo-specific commissions
  const getCommissionRange = () => {
    if (!offer.geo_commissions || !Array.isArray(offer.geo_commissions) || offer.geo_commissions.length <= 1) {
      return null;
    }

    // Fix the type issue by safely extracting amount value from each geo_commission object
    const amounts = offer.geo_commissions.map(gc => {
      // Handle different possible types of geo_commission
      if (typeof gc === 'object' && gc !== null) {
        const amount = (gc as any).amount;
        return typeof amount === 'string' ? parseFloat(amount) : typeof amount === 'number' ? amount : 0;
      }
      return 0;
    }).filter(amount => !isNaN(amount));
    
    if (amounts.length === 0) return null;
    
    const min = Math.min(...amounts);
    const max = Math.max(...amounts);
    
    return { min, max };
  };

  const commissionRange = getCommissionRange();
  const formattedGeoTargets = formatGeoTargets(offer);

  // Render tabs for grid view and list view previews
  const renderPreviewTabs = () => (
    <Tabs defaultValue="grid" className="w-full">
      <TabsList className="grid grid-cols-2 mb-4">
        <TabsTrigger value="grid">Grid View</TabsTrigger>
        <TabsTrigger value="list">List View</TabsTrigger>
      </TabsList>
      
      <TabsContent value="grid">
        <Card className="overflow-hidden">
          <CardHeader className="p-4">
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg">{offer.name || 'Offer Name'}</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="flex items-center bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                  <DollarSign className="h-3 w-3 mr-1" />
                  {commissionRange 
                    ? `${commissionRange.min}-${commissionRange.max}` 
                    : offer.commission_amount || '0.00'}
                </Badge>
                {offer.commission_type && (
                  <Badge variant="outline" className="text-xs">
                    {offer.commission_type.slice(2) || 'CPA'}
                  </Badge>
                )}
              </div>
            </div>
            <CardDescription className="line-clamp-2">{offer.description || 'Offer description will appear here'}</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 grid gap-2">
            {offer.offer_image && (
              <div className="mb-3 rounded-md overflow-hidden h-32 bg-gray-100">
                <img 
                  src={offer.offer_image} 
                  alt={offer.name || 'Offer preview'} 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
              {offer.niche && (
                <div className="text-sm flex items-center">
                  <Tag className="h-4 w-4 mr-1 text-blue-500" />
                  <span className="font-medium mr-1">Niche:</span>
                  <Badge variant="outline" className="text-xs ml-1">
                    {offer.niche}
                  </Badge>
                </div>
              )}
              
              {/* Geo targets display */}
              <div className="text-sm flex items-center">
                <Globe className="h-4 w-4 mr-1 text-indigo-500" />
                <span className="font-medium mr-1">Geo:</span>
                {formattedGeoTargets.length > 0 ? (
                  <HoverCard openDelay={0} closeDelay={0}>
                    <HoverCardTrigger asChild>
                      <Badge variant="outline" className="text-xs cursor-pointer ml-1">
                        {formattedGeoTargets.length} {formattedGeoTargets.length === 1 ? 'country' : 'countries'}
                      </Badge>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-auto p-3 shadow-lg border border-gray-200 bg-white dark:bg-gray-800 z-[9999]">
                      <div className="font-medium mb-2">Targeted GEO's:</div>
                      <div className="flex flex-wrap gap-1 max-w-[300px]">
                        {formattedGeoTargets.map((geo, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {geo.flag} {geo.code}
                          </Badge>
                        ))}
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                ) : (
                  <span className="text-muted-foreground ml-1">Global</span>
                )}
              </div>
              
              {offer.allowed_traffic_sources && Array.isArray(offer.allowed_traffic_sources) && offer.allowed_traffic_sources.length > 0 && (
                <div className="text-sm flex items-center">
                  <Target className="h-4 w-4 mr-1 text-purple-500" />
                  <span className="font-medium mr-1">Traffic:</span>
                  <HoverCard openDelay={0} closeDelay={0}>
                    <HoverCardTrigger asChild>
                      <Badge variant="outline" className="text-xs cursor-pointer ml-1">
                        {offer.allowed_traffic_sources.length} {offer.allowed_traffic_sources.length === 1 ? 'source' : 'sources'}
                      </Badge>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-auto p-3 shadow-lg border border-gray-200 bg-white dark:bg-gray-800 z-[9999]">
                      <div className="font-medium mb-2">Traffic Sources:</div>
                      <div className="flex flex-wrap gap-1 max-w-[300px]">
                        {offer.allowed_traffic_sources.map((source, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {source}
                          </Badge>
                        ))}
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                </div>
              )}
              
              {/* Restricted geos display */}
              {offer.restricted_geos && Array.isArray(offer.restricted_geos) && offer.restricted_geos.length > 0 && (
                <div className="text-sm flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-1 text-amber-500" />
                  <span className="font-medium mr-1">Restricted:</span>
                  <HoverCard openDelay={0} closeDelay={0}>
                    <HoverCardTrigger asChild>
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 text-xs cursor-pointer ml-1">
                        {offer.restricted_geos.length} {offer.restricted_geos.length === 1 ? 'country' : 'countries'}
                      </Badge>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-auto p-3 shadow-lg border border-gray-200 bg-white dark:bg-gray-800 z-[9999]">
                      <div className="font-medium mb-2">Restricted GEO's:</div>
                      <div className="flex flex-wrap gap-1 max-w-[300px]">
                        {offer.restricted_geos.map((geo, i) => (
                          <Badge key={i} variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 text-xs">
                            {geo}
                          </Badge>
                        ))}
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="list">
        <div className="border rounded-md overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-3 font-medium">Offer</th>
                <th className="text-left p-3 font-medium">Niche</th>
                <th className="text-left p-3 font-medium">Commission</th>
                <th className="text-left p-3 font-medium">Geo Targeting</th>
                <th className="text-left p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-muted/50">
                <td className="p-3">
                  <div className="font-medium">{offer.name || 'Offer Name'}</div>
                  <div className="text-sm text-muted-foreground line-clamp-1">
                    {offer.description || 'Offer description will appear here'}
                  </div>
                </td>
                <td className="p-3">
                  {offer.niche ? (
                    <Badge variant="outline" className="text-xs">
                      {offer.niche}
                    </Badge>
                  ) : '-'}
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="flex items-center bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                      <DollarSign className="h-3 w-3 mr-1" />
                      {commissionRange 
                        ? `${commissionRange.min}-${commissionRange.max}` 
                        : offer.commission_amount || '0.00'}
                    </Badge>
                    {offer.commission_type && (
                      <Badge variant="outline" className="text-xs">
                        {offer.commission_type.slice(2) || 'CPA'}
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1">
                      <div className="text-xs font-medium">Targeted:</div>
                      {formattedGeoTargets.length > 0 ? (
                        <HoverCard openDelay={0} closeDelay={0}>
                          <HoverCardTrigger asChild>
                            <Badge variant="outline" className="text-xs cursor-pointer">
                              <Globe className="h-3 w-3 mr-1" />
                              {formattedGeoTargets.length} GEO's
                            </Badge>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-auto p-3 shadow-lg border border-gray-200 bg-white z-[9999]">
                            <div className="font-medium mb-2">Targeted GEO's:</div>
                            <div className="flex flex-wrap gap-1 max-w-[300px]">
                              {formattedGeoTargets.map((geo, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {geo.flag} {geo.code}
                                </Badge>
                              ))}
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      ) : (
                        <span className="text-xs text-muted-foreground">Global</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </TabsContent>
    </Tabs>
  );

  // If open/onOpenChange props are provided, use a controlled dialog
  if (open !== undefined && onOpenChange) {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent className="max-w-4xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{offer.name || 'Offer Preview'}</AlertDialogTitle>
            <AlertDialogDescription>
              Here is a preview of how the offer will look in the marketplace.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            {renderPreviewTabs()}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirm} disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Offer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  // Default uncontrolled dialog with trigger
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="mr-2 h-4 w-4" />
          Preview
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-4xl">
        <AlertDialogHeader>
          <AlertDialogTitle>{offer.name || 'Offer Preview'}</AlertDialogTitle>
          <AlertDialogDescription>
            Here is a preview of how the offer will look in the marketplace.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          {renderPreviewTabs()}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Close</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
