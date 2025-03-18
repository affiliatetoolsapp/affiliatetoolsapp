
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AffiliateOfferWithOffer } from '@/types';
import { formatGeoTargets } from './utils/offerUtils';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { DollarSign, Calendar, Tag, MapPin, Globe, Eye, Link as LinkIcon } from 'lucide-react';

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
        {offers.map((affiliateOffer) => (
          <Card key={affiliateOffer.id} className="overflow-hidden">
            <CardHeader className="p-4 pb-0">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">
                    {affiliateOffer.offer.name}
                  </CardTitle>
                  {affiliateOffer.offer.is_featured && (
                    <Badge variant="outline" className="mt-1 bg-yellow-100 dark:bg-yellow-900">
                      Featured Offer
                    </Badge>
                  )}
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
                    // If more than 3 GEO's, show globe icon with hover
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <Badge variant="outline" className="text-xs cursor-pointer">
                          <Globe className="h-3 w-3 mr-1" />
                          {formatGeoTargets(affiliateOffer.offer).length} GEO's
                        </Badge>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-auto p-2">
                        <div className="font-medium mb-2">Targeted GEO's:</div>
                        <div className="flex flex-wrap gap-1 max-w-[300px]">
                          {formatGeoTargets(affiliateOffer.offer).map((geo, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {geo.flag} {geo.code}
                            </Badge>
                          ))}
                        </div>
                      </HoverCardContent>
                    </HoverCard>
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
        ))}
      </div>
    );
  }

  // List view
  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Offer</TableHead>
            <TableHead>Commission</TableHead>
            <TableHead>Niche</TableHead>
            <TableHead>Traffic Source</TableHead>
            <TableHead>Geo Targeting</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {offers.map((affiliateOffer) => (
            <TableRow key={affiliateOffer.id}>
              <TableCell className="font-medium">
                <div className="flex flex-col">
                  {affiliateOffer.offer.name}
                  {affiliateOffer.offer.is_featured && (
                    <Badge variant="outline" className="w-fit mt-1 text-xs bg-yellow-100 dark:bg-yellow-900">
                      Featured
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {affiliateOffer.offer.commission_type === 'RevShare' 
                  ? `${affiliateOffer.offer.commission_percent}% RevShare` 
                  : `$${affiliateOffer.offer.commission_amount} per ${affiliateOffer.offer.commission_type.slice(2)}`}
              </TableCell>
              <TableCell>{affiliateOffer.offer.niche || '-'}</TableCell>
              <TableCell>{affiliateOffer.traffic_source || '-'}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {formatGeoTargets(affiliateOffer.offer).length <= 2 ? (
                    // If 2 or fewer GEO's, show them all
                    formatGeoTargets(affiliateOffer.offer).map((geo, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {geo.flag} {geo.code}
                      </Badge>
                    ))
                  ) : (
                    // If more than 2 GEO's, show globe icon with hover
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <Badge variant="outline" className="text-xs cursor-pointer">
                          <Globe className="h-3 w-3 mr-1" />
                          {formatGeoTargets(affiliateOffer.offer).length} GEO's
                        </Badge>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-auto p-2">
                        <div className="font-medium mb-2">Targeted GEO's:</div>
                        <div className="flex flex-wrap gap-1 max-w-[300px]">
                          {formatGeoTargets(affiliateOffer.offer).map((geo, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {geo.flag} {geo.code}
                            </Badge>
                          ))}
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onViewOfferDetails(affiliateOffer.offer_id)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  
                  <Button
                    size="sm"
                    onClick={() => onGenerateLinks(affiliateOffer.offer_id)}
                  >
                    <LinkIcon className="h-4 w-4 mr-1" />
                    Links
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ActiveOffers;
