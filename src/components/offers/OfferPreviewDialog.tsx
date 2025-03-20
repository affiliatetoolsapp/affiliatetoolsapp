
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
import { Eye } from "lucide-react"

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

  // If open/onOpenChange props are provided, use a controlled dialog
  if (open !== undefined && onOpenChange) {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{offer.name || 'Offer Preview'}</AlertDialogTitle>
            <AlertDialogDescription>
              Here is a preview of how the offer will look.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Offer Details</CardTitle>
                  <CardDescription>Details about the offer</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Name</p>
                    <p>{offer.name || 'N/A'}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Description</p>
                    <p>{offer.description || 'N/A'}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">URL</p>
                    <a href={offer.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{offer.url || 'N/A'}</a>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Niche</p>
                    <p>{offer.niche || 'N/A'}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Status</p>
                    <Badge variant={offer.status === 'active' ? 'default' : 'secondary'}>{offer.status || 'draft'}</Badge>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Commission Details</CardTitle>
                  <CardDescription>Details about the commission</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Type</p>
                    <p>{offer.commission_type || 'N/A'}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Amount</p>
                    <p>{offer.commission_amount !== undefined ? offer.commission_amount : 'N/A'}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Percent</p>
                    <p>{offer.commission_percent !== undefined ? offer.commission_percent : 'N/A'}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Geo Targets</p>
                    <p>{geoTargetsList}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
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
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{offer.name || 'Offer Preview'}</AlertDialogTitle>
          <AlertDialogDescription>
            Here is a preview of how the offer will look.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Offer Details</CardTitle>
                <CardDescription>Details about the offer</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Name</p>
                  <p>{offer.name || 'N/A'}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Description</p>
                  <p>{offer.description || 'N/A'}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">URL</p>
                  <a href={offer.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{offer.url || 'N/A'}</a>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Niche</p>
                  <p>{offer.niche || 'N/A'}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Status</p>
                  <Badge variant={offer.status === 'active' ? 'default' : 'secondary'}>{offer.status || 'draft'}</Badge>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Commission Details</CardTitle>
                <CardDescription>Details about the commission</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Type</p>
                  <p>{offer.commission_type || 'N/A'}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Amount</p>
                  <p>{offer.commission_amount !== undefined ? offer.commission_amount : 'N/A'}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Percent</p>
                  <p>{offer.commission_percent !== undefined ? offer.commission_percent : 'N/A'}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Geo Targets</p>
                  <p>{geoTargetsList}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction>Okay</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
