
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Offer } from '@/types';
import { Check, X, Info } from 'lucide-react';
import { 
  HoverCard,
  HoverCardTrigger,
  HoverCardContent 
} from '@/components/ui/hover-card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface OfferPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offer: Partial<Offer>;
  onConfirm: () => void;
  isSubmitting: boolean;
}

export function OfferPreviewDialog({
  open,
  onOpenChange,
  offer,
  onConfirm,
  isSubmitting
}: OfferPreviewDialogProps) {
  if (!offer) return null;

  // Helper functions for display formatting
  const getTrafficSources = (): string[] => {
    if (!offer.allowed_traffic_sources || !Array.isArray(offer.allowed_traffic_sources) || offer.allowed_traffic_sources.length === 0) {
      return ["All traffic sources allowed"];
    }
    return offer.allowed_traffic_sources;
  };

  const getDisplayedTrafficSources = (): string => {
    const sources = getTrafficSources();
    if (sources.length <= 3) return sources.join(', ');
    return `${sources.slice(0, 3).join(', ')} +${sources.length - 3} more`;
  };

  // Function to safely format geo_targets for display
  const formatGeoTargetsDisplay = (): string => {
    const geoTargets = offer.geo_targets;
    if (!geoTargets) return '';
    
    if (Array.isArray(geoTargets)) {
      const displayedGeos = geoTargets.slice(0, 3);
      return displayedGeos.join(', ') + (geoTargets.length > 3 ? ` +${geoTargets.length - 3} more` : '');
    }
    
    if (typeof geoTargets === 'string') {
      return geoTargets;
    }
    
    // For object type geo_targets
    if (typeof geoTargets === 'object') {
      const countries = Object.keys(geoTargets);
      if (countries.length === 0) return '';
      
      const displayedCountries = countries.slice(0, 3);
      return displayedCountries.join(', ') + (countries.length > 3 ? ` +${countries.length - 3} more` : '');
    }
    
    return '';
  };

  const trafficSources = getTrafficSources();
  const displaySources = getDisplayedTrafficSources();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Preview Your Offer</DialogTitle>
          <p className="text-sm text-muted-foreground">
            This is how your offer will appear in the marketplace.
          </p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <h3 className="text-lg font-medium">Card View</h3>
          <Card className="w-full max-w-sm mx-auto overflow-hidden">
            {offer.offer_image && (
              <div className="relative h-48 bg-muted">
                <img 
                  src={offer.offer_image} 
                  alt={offer.name} 
                  className="object-cover w-full h-full"
                />
                {offer.is_featured && (
                  <Badge className="absolute top-2 right-2 bg-yellow-500/90 text-primary-foreground">
                    Featured
                  </Badge>
                )}
              </div>
            )}
            <CardContent className="p-4">
              <h3 className="font-bold truncate">{offer.name || 'Offer Name'}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2 h-10 mt-1">
                {offer.description || 'Offer description will appear here'}
              </p>
              <div className="flex mt-4 gap-2 flex-wrap">
                {offer.niche && (
                  <Badge variant="outline" className="text-xs">
                    {offer.niche}
                  </Badge>
                )}
                {offer.commission_type && (
                  <Badge variant="outline" className="text-xs">
                    {offer.commission_type}
                  </Badge>
                )}
              </div>
            </CardContent>
            <CardFooter className="bg-muted/50 p-3 flex justify-between">
              <div className="text-sm font-medium">
                {offer.commission_type === 'RevShare' ? (
                  <span>{offer.commission_percent}% Rev Share</span>
                ) : (
                  <span>${offer.commission_amount} {offer.commission_type}</span>
                )}
              </div>
              {offer.geo_targets && (
                <div className="text-xs text-muted-foreground">
                  {formatGeoTargetsDisplay()}
                </div>
              )}
            </CardFooter>
          </Card>

          <h3 className="text-lg font-medium mt-8">List View</h3>
          <div className="border rounded-md p-4 flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-24 h-24 bg-muted rounded flex-shrink-0">
              {offer.offer_image ? (
                <img 
                  src={offer.offer_image} 
                  alt={offer.name} 
                  className="object-cover w-full h-full rounded"
                />
              ) : (
                <div className="w-full h-full bg-muted rounded"></div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <h3 className="font-bold truncate">{offer.name || 'Offer Name'}</h3>
                <div className="text-sm font-medium">
                  {offer.commission_type === 'RevShare' ? (
                    <span>{offer.commission_percent}% Rev Share</span>
                  ) : (
                    <span>${offer.commission_amount} {offer.commission_type}</span>
                  )}
                </div>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {offer.description || 'Offer description will appear here'}
              </p>
              <div className="flex mt-2 gap-2 flex-wrap">
                {offer.niche && (
                  <Badge variant="outline" className="text-xs">
                    {offer.niche}
                  </Badge>
                )}
                {offer.commission_type && (
                  <Badge variant="outline" className="text-xs">
                    {offer.commission_type}
                  </Badge>
                )}
                
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <Badge variant="outline" className="text-xs cursor-help flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      <span>Traffic Sources: {trafficSources.length > 1 ? `${trafficSources.length} sources` : '1 source'}</span>
                    </Badge>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-72 p-3">
                    <h4 className="text-sm font-medium mb-2">Allowed Traffic Sources</h4>
                    <div className="space-y-1">
                      {trafficSources.map((source, index) => (
                        <div key={index} className="text-xs px-2 py-1 bg-muted/50 rounded">{source}</div>
                      ))}
                    </div>
                  </HoverCardContent>
                </HoverCard>
                
                {offer.geo_targets && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="text-xs">
                          {Array.isArray(offer.geo_targets) ? 
                            `${offer.geo_targets.length} countries` : 
                            'Multiple countries'}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Available in {formatGeoTargetsDisplay()}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button onClick={onConfirm} disabled={isSubmitting}>
            <Check className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Creating...' : 'Confirm & Create Offer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
