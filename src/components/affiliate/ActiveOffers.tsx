import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AffiliateOfferWithOffer } from '@/types';
import { formatGeoTargets } from './utils/offerUtils';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { DollarSign, Calendar, Tag, MapPin, Globe, Eye, Link as LinkIcon, Award } from 'lucide-react';
import OfferTable from '@/components/offers/OfferTable';

interface ActiveOffersProps {
  offers: AffiliateOfferWithOffer[];
  viewMode: 'grid' | 'list';
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
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {offers.map((affiliateOffer) => {
          
          return (
            <Card key={affiliateOffer.id} className="overflow-hidden">
              <CardHeader className="p-4 pb-0">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {affiliateOffer.offer.is_featured && (
                        <Badge variant="outline" className="mr-1 bg-yellow-100 dark:bg-yellow-900">
                          <Award className="h-3 w-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                      {affiliateOffer.offer.name}
                    </CardTitle>
                  </div>
                  <Badge variant="default" className="capitalize">
                    Approved
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2 mt-2">
                  {affiliateOffer.offer.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-2 grid gap-2">
                <div className="text-sm flex items-center">
                  <DollarSign className="h-4 w-4 mr-1 text-green-500" />
                  <span className="font-medium">Commission: </span> 
                  <span className="ml-1">
                    {affiliateOffer.offer.commission_type === 'RevShare' 
                      ? `${affiliateOffer.offer.commission_percent}% Revenue Share` 
                      : `$${affiliateOffer.offer.commission_amount} per ${affiliateOffer.offer.commission_type.slice(2)}`}
                  </span>
                </div>
                
                {affiliateOffer.offer.niche && (
                  <div className="text-sm flex items-center">
                    <Tag className="h-4 w-4 mr-1 text-blue-500" />
                    <span className="font-medium">Niche: </span>
                    <span className="ml-1">{affiliateOffer.offer.niche}</span>
                  </div>
                )}
                
                <div className="text-sm flex items-center">
                  <Calendar className="h-4 w-4 mr-1 text-purple-500" />
                  <span className="font-medium">Joined: </span>
                  <span className="ml-1">{affiliateOffer.reviewed_at ? new Date(affiliateOffer.reviewed_at).toLocaleDateString() : 'Recently'}</span>
                </div>
                
                <div className="text-sm flex items-start">
                  <Globe className="h-4 w-4 mr-1 text-indigo-500 mt-0.5" />
                  <span className="font-medium mr-1">Geo: </span>
                  <div className="flex flex-wrap gap-1">
                    {formatGeoTargets(affiliateOffer.offer).length <= 3 ? (
                      // If 3 or fewer GEO's, show them all
                      formatGeoTargets(affiliateOffer.offer).map((geo, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {geo.flag} {geo.code}
                        </Badge>
                      ))
                    ) : (
                      // Updated HoverCard implementation with proper z-index
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="outline" className="text-xs cursor-pointer">
                              <Globe className="h-3 w-3 mr-1" />
                              {formatGeoTargets(affiliateOffer.offer).length} countries
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="w-auto p-3 z-50" sideOffset={5}>
                            <div className="font-medium mb-2">Targeted countries:</div>
                            <div className="flex flex-wrap gap-1 max-w-[300px]">
                              {formatGeoTargets(affiliateOffer.offer).map((geo, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {geo.flag} {geo.code}
                                </Badge>
                              ))}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </div>
                
                {affiliateOffer.traffic_source && (
                  <div className="text-sm flex items-center">
                    <MapPin className="h-4 w-4 mr-1 text-red-500" />
                    <span className="font-medium">Traffic Source: </span>
                    <span className="ml-1">{affiliateOffer.traffic_source}</span>
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="p-4 pt-0 flex justify-between gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onViewOfferDetails(affiliateOffer.offer_id)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Offer
                </Button>
                
                <Button
                  size="sm"
                  onClick={() => onGenerateLinks(affiliateOffer.offer_id)}
                >
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Generate Links
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    );
  }

  // List view - UPDATED to use the reusable OfferTable
  return (
    <OfferTable 
      offers={offers.map(affiliateOffer => affiliateOffer.offer)}
      userRole="affiliate"
      onViewDetails={onViewOfferDetails}
      onGenerateLinks={onGenerateLinks}
    />
  );
};

export default ActiveOffers;
