import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Offer } from '@/types';
import { formatGeoTargets } from './utils/offerUtils';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { DollarSign, Calendar, Tag, MapPin, Globe, Eye, Link as LinkIcon, Award, ExternalLink } from 'lucide-react';
import OfferTable from '@/components/offers/OfferTable';

interface ActiveOffersProps {
  offers: Offer[];
  viewMode: 'grid' | 'table';
  isLoading: boolean;
  onViewOfferDetails: (offerId: string) => void;
  onGenerateLinks: (offerId: string) => void;
}

const ActiveOffers: React.FC<ActiveOffersProps> = ({ 
  offers, 
  viewMode, 
  isLoading, 
  onViewOfferDetails, 
  onGenerateLinks 
}) => {
  const navigate = useNavigate();
  
  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!offers?.length) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground mb-4">You don't have any approved offers yet</p>
        <Button 
          onClick={() => navigate('/marketplace')}
        >
          Browse Marketplace
        </Button>
      </Card>
    );
  }

  if (viewMode === 'grid') {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {offers.map((offer) => {
          if (!offer) return null;
          
          return (
            <Card key={offer.id} className="relative">
              {offer.is_featured && (
                <Badge variant="secondary" className="absolute top-2 right-2">
                  Featured
                </Badge>
              )}
              <div className="p-6">
                <h3 className="text-lg font-semibold">{offer.name}</h3>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  {offer.description}
                </p>
                
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Commission:</span>
                    <span className="font-medium">
                      {offer.commission_type === 'RevShare' 
                        ? `${offer.commission_percent}%`
                        : `$${offer.commission_amount}`
                      }
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant="outline">{offer.status}</Badge>
                  </div>
                </div>
                
                <div className="mt-6 flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => onViewOfferDetails(offer.id)}
                  >
                    View Details
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => onGenerateLinks(offer.id)}
                  >
                    Generate Links
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    );
  }

  // Table view - Using the OfferTable component
  return (
    <OfferTable 
      offers={offers}
      userRole="affiliate"
      onViewDetails={onViewOfferDetails}
      onGenerateLinks={onGenerateLinks}
    />
  );
};

export default ActiveOffers;
