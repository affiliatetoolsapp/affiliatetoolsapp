import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Offer } from '@/types';
import { formatGeoTargets, getCountryFlag } from '@/components/affiliate/utils/offerUtils';
import { Badge } from '@/components/ui/badge';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Button } from '@/components/ui/button';
import { OffersFilter, FilterOptions } from './OffersFilter';
import { useOfferFilters } from '@/hooks/useOfferFilters';
import {
  Award,
  DollarSign,
  Globe,
  Target,
  Tag,
  AlertTriangle,
  Check,
  Pause,
  X,
  Eye,
  MoreHorizontal,
  Link,
  TagIcon,
  Clock,
  Pencil,
  Play,
  Trash2
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface OfferTableProps {
  offers: Offer[];
  userRole?: string;
  onViewDetails?: (offerId: string) => void;
  onApply?: (offerId: string) => void;
  onGenerateLinks?: (offerId: string) => void;
  onEdit?: (offerId: string) => void;
  onDelete?: (offerId: string) => void;
  onRowClick?: (offerId: string) => void;
}

export default function OfferTable({ 
  offers, 
  userRole, 
  onViewDetails, 
  onApply, 
  onGenerateLinks,
  onEdit,
  onDelete,
  onRowClick
}: OfferTableProps) {
  const navigate = useNavigate();
  const isAdvertiser = userRole === 'advertiser';
  const [filters, setFilters] = useState<FilterOptions>({
    niche: [],
    payoutMin: null,
    payoutMax: null,
    offerTypes: [],
    geos: [],
    trafficTypes: [],
    status: []
  });

  const filteredOffers = useOfferFilters(offers, filters);

  // Get full commission type name
  const getFullCommissionType = (shortType: string): string => {
    if (!shortType || !shortType.startsWith('CP')) return shortType;
    
    // Extract the last character of the commission type (e.g., 'A' from 'CPA')
    const typeCode = shortType.slice(2);
    
    switch (typeCode) {
      case 'A': return 'CPA'; // Cost Per Action
      case 'L': return 'CPL'; // Cost Per Lead
      case 'S': return 'CPS'; // Cost Per Sale
      case 'I': return 'CPI'; // Cost Per Install
      case 'C': return 'CPC'; // Cost Per Click
      case 'M': return 'CPM'; // Cost Per Mille (Thousand)
      case 'O': return 'CPO'; // Cost Per Order
      case 'R': return 'CPR'; // Cost Per Registration
      default: return shortType;
    }
  };

  // Get icon for commission type
  const getCommissionTypeIcon = (commissionType: string) => {
    switch (commissionType) {
      case 'CPL': return <TagIcon className="h-3 w-3 mr-1" />;
      case 'CPA': return <Check className="h-3 w-3 mr-1" />;
      case 'CPS': return <TagIcon className="h-3 w-3 mr-1" />;
      default: return <TagIcon className="h-3 w-3 mr-1" />;
    }
  };

  // Get commission range if there are geo-specific commissions
  const getCommissionRange = (offer: Offer) => {
    if (!offer.geo_commissions || !Array.isArray(offer.geo_commissions) || offer.geo_commissions.length <= 1) {
      return null;
    }

    // Fix: Safely extract amount values from each geo_commission object
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

  // Get status icon based on offer status
  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-amber-500" />;
      case 'inactive':
      case 'rejected':
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const handleViewDetails = (offerId: string) => {
    if (onViewDetails) {
      onViewDetails(offerId);
    } else {
      navigate(`/offers/${offerId}`);
    }
  };

  const handleApply = (offerId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click event from firing
    if (onApply) {
      onApply(offerId);
    }
  };

  const handleGenerateLinks = (offerId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click event from firing
    if (onGenerateLinks) {
      onGenerateLinks(offerId);
    }
  };

  const handleEdit = (offerId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click event from firing
    if (onEdit) {
      onEdit(offerId);
    }
  };

  const handleDelete = (offerId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click event from firing
    if (onDelete) {
      onDelete(offerId);
    }
  };

  const handleRowClick = (offerId: string) => {
    if (onRowClick) {
      onRowClick(offerId);
    } else if (onViewDetails) {
      onViewDetails(offerId);
    } else {
      navigate(`/offers/${offerId}`);
    }
  };

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end items-center gap-4">
        <div className="text-sm text-muted-foreground">
          {filteredOffers.length} {filteredOffers.length === 1 ? 'offer' : 'offers'} found
        </div>
        <OffersFilter
          offers={offers}
          onFilterChange={handleFilterChange}
        />
      </div>
      
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">Offer</TableHead>
              <TableHead>Niche</TableHead>
              <TableHead>Payout</TableHead>
              <TableHead>Targeting</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOffers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No offers found.
                </TableCell>
              </TableRow>
            ) : (
              filteredOffers.map((offer) => {
                const geoTargets = formatGeoTargets(offer);
                const commissionRange = getCommissionRange(offer);
                
                return (
                  <TableRow 
                    key={offer.id} 
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleRowClick(offer.id)}
                  >
                    {/* Offer column */}
                    <TableCell>
                      <div className="flex gap-3">
                        <div className="relative">
                          {offer.offer_image ? (
                            <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                              <img 
                                src={offer.offer_image} 
                                alt={offer.name} 
                                className="w-full h-full object-cover"
                              />
                              {offer.is_featured && (
                                <div className="absolute -top-1 -right-1">
                                  <Badge className="bg-yellow-500 text-white border-0 shadow-md">
                                    <Award className="h-3 w-3 mr-1" />
                                    Featured
                                  </Badge>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="w-16 h-16 rounded-md bg-gray-100 flex-shrink-0 flex items-center justify-center text-gray-400 relative">
                              No image
                              {offer.is_featured && (
                                <div className="absolute -top-1 -right-1">
                                  <Badge className="bg-yellow-500 text-white border-0 shadow-md">
                                    <Award className="h-3 w-3 mr-1" />
                                    Featured
                                  </Badge>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <div className="font-medium hover:text-primary">{offer.name}</div>
                          {offer.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {offer.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    
                    {/* Niche column */}
                    <TableCell>
                      {offer.niche ? (
                        <div className="flex items-center gap-1">
                          <Tag className="h-4 w-4 text-blue-500" />
                          <Badge variant="outline" className="text-xs">
                            {offer.niche}
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    
                    {/* Payout column */}
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {/* Commission amount badge */}
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                            <DollarSign className="h-3 w-3 mr-1" />
                            ${commissionRange
                              ? `${commissionRange.min}-${commissionRange.max}`
                              : `${offer.commission_amount}`}
                          </Badge>
                        </div>
                        
                        {/* Commission type badge */}
                        <div className="flex items-center gap-1">
                          {offer.commission_type !== 'RevShare' ? (
                            <Badge variant="secondary" className="text-xs">
                              {getCommissionTypeIcon(offer.commission_type)}
                              {getFullCommissionType(offer.commission_type)}
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              <TagIcon className="h-3 w-3 mr-1" />
                              {offer.commission_percent}% RevShare
                            </Badge>
                          )}
                        </div>
                        
                        {/* Payout frequency */}
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">
                            <Clock className="h-3 w-3 mr-1" />
                            {offer.payout_frequency || 'Monthly'}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    
                    {/* Targeting column */}
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {/* Geo targeting */}
                        <div className="flex items-center text-sm">
                          <Globe className="h-4 w-4 mr-1 text-indigo-500" />
                          {geoTargets.length > 0 ? (
                            <HoverCard>
                              <HoverCardTrigger asChild>
                                <Badge 
                                  variant="outline" 
                                  className="text-xs cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  {geoTargets.length} {geoTargets.length === 1 ? 'country' : 'countries'}
                                </Badge>
                              </HoverCardTrigger>
                              <HoverCardContent 
                                side="right" 
                                align="start" 
                                className="w-auto p-3 shadow-lg border border-gray-200 bg-white dark:bg-gray-800 z-[9999]"
                              >
                                <div className="font-medium mb-2">Targeted GEO's:</div>
                                <div className="flex flex-wrap gap-1 max-w-[300px]">
                                  {geoTargets.map((geo, i) => (
                                    <Badge key={i} variant="outline" className="text-xs">
                                      {geo.flag} {geo.code}
                                    </Badge>
                                  ))}
                                </div>
                              </HoverCardContent>
                            </HoverCard>
                          ) : (
                            <span className="text-muted-foreground text-xs">Global</span>
                          )}
                        </div>
                        
                        {/* Traffic sources */}
                        {offer.allowed_traffic_sources && offer.allowed_traffic_sources.length > 0 && (
                          <div className="flex items-center text-sm">
                            <Target className="h-4 w-4 mr-1 text-purple-500" />
                            <HoverCard>
                              <HoverCardTrigger asChild>
                                <Badge 
                                  variant="outline" 
                                  className="text-xs cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  {offer.allowed_traffic_sources.length} {offer.allowed_traffic_sources.length === 1 ? 'source' : 'sources'}
                                </Badge>
                              </HoverCardTrigger>
                              <HoverCardContent 
                                side="right" 
                                align="start" 
                                className="w-auto p-3 shadow-lg border border-gray-200 bg-white dark:bg-gray-800 z-[9999]"
                              >
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
                        
                        {/* Restricted geos */}
                        {offer.restricted_geos && offer.restricted_geos.length > 0 && (
                          <div className="flex items-center text-sm">
                            <AlertTriangle className="h-4 w-4 mr-1 text-amber-500" />
                            <HoverCard>
                              <HoverCardTrigger asChild>
                                <Badge 
                                  variant="outline" 
                                  className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 text-xs cursor-pointer hover:bg-red-100"
                                >
                                  {offer.restricted_geos.length} restricted
                                </Badge>
                              </HoverCardTrigger>
                              <HoverCardContent 
                                side="right" 
                                align="start" 
                                className="w-auto p-3 shadow-lg border border-gray-200 bg-white dark:bg-gray-800 z-[9999]"
                              >
                                <div className="font-medium mb-2">Restricted GEO's:</div>
                                <div className="flex flex-wrap gap-1 max-w-[300px]">
                                  {offer.restricted_geos.map((geo, i) => (
                                    <Badge 
                                      key={i} 
                                      variant="outline" 
                                      className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 text-xs"
                                    >
                                      {getCountryFlag(geo)} {geo}
                                    </Badge>
                                  ))}
                                </div>
                              </HoverCardContent>
                            </HoverCard>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    
                    {/* Status column */}
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(offer.status)}
                        <span className="text-sm capitalize">
                          {offer.status || 'Active'}
                        </span>
                      </div>
                    </TableCell>
                    
                    {/* Actions column - Updated with stopPropagation to prevent row click */}
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={(e) => e.stopPropagation()} // Prevent row click
                            className="hover-card-disable-row-click"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="dropdown-trigger">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(offer.id);
                          }}>
                            <Eye className="h-4 w-4 mr-2" />
                            {isAdvertiser ? 'Manage' : 'View Details'}
                          </DropdownMenuItem>
                          
                          {isAdvertiser && onEdit && (
                            <DropdownMenuItem onClick={(e) => handleEdit(offer.id, e)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit Offer
                            </DropdownMenuItem>
                          )}
                          
                          {!isAdvertiser && onApply && (
                            <DropdownMenuItem onClick={(e) => handleApply(offer.id, e)}>
                              <Check className="h-4 w-4 mr-2" />
                              Apply
                            </DropdownMenuItem>
                          )}
                          
                          {onGenerateLinks && (
                            <DropdownMenuItem onClick={(e) => handleGenerateLinks(offer.id, e)}>
                              <Link className="h-4 w-4 mr-2" />
                              Generate Links
                            </DropdownMenuItem>
                          )}
                          
                          {isAdvertiser && onDelete && (
                            <DropdownMenuItem onClick={(e) => handleDelete(offer.id, e)} className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
