
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Edit, Eye, MoreVertical, Pencil, Play, Pause, Trash2 } from 'lucide-react';
import { Offer } from '@/types';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';

interface OfferTableProps {
  offers: Offer[];
  userRole: 'advertiser' | 'affiliate' | 'admin';
  onViewDetails: (offerId: string) => void;
  onEdit?: (offerId: string) => void;
  onRowClick?: (offerId: string) => void;
  onStatusUpdate?: (offerId: string, newStatus: 'active' | 'inactive') => void;
  onDelete?: (offerId: string) => void;
}

const OfferTable: React.FC<OfferTableProps> = ({ 
  offers, 
  userRole, 
  onViewDetails, 
  onEdit, 
  onRowClick,
  onStatusUpdate,
  onDelete
}) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Payout</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {offers.map((offer) => (
            <TableRow 
              key={offer.id} 
              className={onRowClick ? "cursor-pointer" : ""}
              onClick={onRowClick ? () => onRowClick(offer.id) : undefined}
            >
              <TableCell className="font-medium">
                <div>{offer.name}</div>
                {offer.description && (
                  <div className="text-xs text-muted-foreground line-clamp-1">{offer.description}</div>
                )}
              </TableCell>
              <TableCell>
                {offer.commission_type === 'RevShare' ? (
                  <Badge variant="outline">{offer.commission_percent}% RevShare</Badge>
                ) : (
                  <Badge variant="outline">${offer.commission_amount}</Badge>
                )}
              </TableCell>
              <TableCell>
                <Badge 
                  variant={offer.status === 'active' ? 'default' : 'secondary'}
                  className="capitalize"
                >
                  {offer.status}
                </Badge>
              </TableCell>
              <TableCell className="capitalize">
                <Badge variant="outline">
                  {offer.commission_type}
                </Badge>
              </TableCell>
              <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onViewDetails(offer.id)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    
                    {userRole === 'advertiser' && onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(offer.id)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit Offer
                      </DropdownMenuItem>
                    )}
                    
                    {userRole === 'advertiser' && onStatusUpdate && (
                      <DropdownMenuItem onClick={() => onStatusUpdate(offer.id, offer.status === 'active' ? 'inactive' : 'active')}>
                        {offer.status === 'active' ? (
                          <>
                            <Pause className="h-4 w-4 mr-2" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Activate
                          </>
                        )}
                      </DropdownMenuItem>
                    )}

                    {userRole === 'advertiser' && onDelete && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => onDelete(offer.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default OfferTable;
