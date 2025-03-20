
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Offer } from "@/types";
import { Button } from "@/components/ui/button";
import { MoreVertical, Edit, Trash2, Pause, Play } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";

// Update props to include onDelete handler
interface OfferTableProps {
  offers: Offer[];
  userRole: 'admin' | 'advertiser' | 'affiliate';
  onViewDetails?: (offerId: string) => void;
  onEdit?: (offerId: string) => void;
  onDelete?: (offerId: string) => void;
  onToggleStatus?: (offerId: string, currentStatus: string) => void;
  onRowClick?: (offerId: string) => void;
}

// Update component to use the new onDelete handler
const OfferTable: React.FC<OfferTableProps> = ({
  offers,
  userRole,
  onViewDetails,
  onEdit,
  onDelete,
  onToggleStatus,
  onRowClick,
}) => {
  const navigate = useNavigate();

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Offer</TableHead>
            <TableHead>Niche</TableHead>
            <TableHead>Commission</TableHead>
            <TableHead>Targeting</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {offers.map((offer) => (
            <TableRow key={offer.id} onClick={() => onRowClick?.(offer.id)} className="cursor-pointer">
              <TableCell className="font-medium">{offer.name}</TableCell>
              <TableCell>{offer.niche}</TableCell>
              <TableCell>{offer.commission_amount}</TableCell>
              <TableCell>{offer.geo_targets?.join(', ')}</TableCell>
              <TableCell className="capitalize">{offer.status}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                      <span className="sr-only">Open menu</span>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onViewDetails && (
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        onViewDetails(offer.id);
                      }}>
                        <Edit className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                    )}
                    {onEdit && (
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        onEdit(offer.id);
                      }}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    {onToggleStatus && (
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        onToggleStatus(offer.id, offer.status);
                      }}>
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
                    {onDelete && (
                      <DropdownMenuItem 
                        className="text-destructive" 
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(offer.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
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
