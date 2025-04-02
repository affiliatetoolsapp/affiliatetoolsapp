
import React from 'react';
import { Offer } from '@/types';
import { formatGeoTargets } from '@/components/affiliate/utils/offerUtils';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface OfferPreviewDialogProps {
  offer: Offer;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const OfferPreviewDialog: React.FC<OfferPreviewDialogProps> = ({
  offer,
  open,
  onOpenChange
}) => {
  const formattedGeoTargets = React.useMemo(() => formatGeoTargets(offer), [offer]);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{offer.name}</DialogTitle>
          <DialogDescription>
            {offer.description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4 space-y-4">
          {/* Offer details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium">Commission</h3>
              <p>
                {offer.commission_type === 'RevShare' 
                  ? `${offer.commission_percent}%` 
                  : `$${offer.commission_amount}`
                }
                <Badge className="ml-2">{offer.commission_type}</Badge>
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium">Status</h3>
              <Badge>{offer.status}</Badge>
            </div>
            
            <div>
              <h3 className="text-sm font-medium">Niche</h3>
              <p>{offer.niche || 'Not specified'}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium">Target Audience</h3>
              <p>{offer.target_audience || 'Not specified'}</p>
            </div>
          </div>
          
          {/* Geo Targets */}
          <div>
            <h3 className="text-sm font-medium mb-2">Geo Targets</h3>
            {formattedGeoTargets.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {formattedGeoTargets.map((geo, i) => (
                  <Badge key={i} variant="outline">
                    {geo.flag} {geo.code}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No geo targets specified</p>
            )}
          </div>
          
          {/* Traffic Sources */}
          <div>
            <h3 className="text-sm font-medium mb-2">Allowed Traffic Sources</h3>
            {offer.allowed_traffic_sources && offer.allowed_traffic_sources.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {offer.allowed_traffic_sources.map((source, i) => (
                  <Badge key={i} variant="outline">
                    {source}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No traffic sources specified</p>
            )}
          </div>
          
          {/* Conversion Requirements */}
          <div>
            <h3 className="text-sm font-medium">Conversion Requirements</h3>
            <p className="text-sm">{offer.conversion_requirements || 'Not specified'}</p>
          </div>
          
          {/* Restrictions */}
          <div>
            <h3 className="text-sm font-medium">Restrictions</h3>
            <p className="text-sm">{offer.restrictions || 'Not specified'}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
