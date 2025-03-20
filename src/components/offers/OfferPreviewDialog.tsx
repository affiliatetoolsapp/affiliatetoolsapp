
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
import { Check, X } from 'lucide-react';

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

  // Helper function to safely format geo_targets for display
  const formatGeoTargets = (geoTargets: Offer['geo_targets']): string => {
    if (!geoTargets) return '';
    
    if (Array.isArray(geoTargets)) {
      return geoTargets.slice(0, 3).join(', ') + (geoTargets.length > 3 ? '...' : '');
    }
    
    if (typeof geoTargets === 'string') {
      return geoTargets;
    }
    
    // For object type geo_targets
    if (typeof geoTargets === 'object') {
      return 'Multiple countries';
    }
    
    return '';
  };

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
                  {formatGeoTargets(offer.geo_targets)}
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
                {offer.geo_targets && (
                  <Badge variant="outline" className="text-xs">
                    {Array.isArray(offer.geo_targets) ? 
                      `${offer.geo_targets.length} countries` : 
                      '0 countries'}
                  </Badge>
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
