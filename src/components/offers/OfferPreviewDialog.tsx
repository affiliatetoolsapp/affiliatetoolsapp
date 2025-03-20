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
  offer: Offer
}

export function OfferPreviewDialog({ offer }: OfferPreviewDialogProps) {

  // Fix the type checking for geo_targets to prevent TypeScript errors
  const geoTargetsList = offer.geo_targets 
  ? (Array.isArray(offer.geo_targets) 
      ? offer.geo_targets.join(', ') 
      : typeof offer.geo_targets === 'string' 
        ? offer.geo_targets 
        : JSON.stringify(offer.geo_targets))
  : 'Global';

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
          <AlertDialogTitle>{offer.name}</AlertDialogTitle>
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
                  <p>{offer.name}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Description</p>
                  <p>{offer.description}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">URL</p>
                  <a href={offer.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{offer.url}</a>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Niche</p>
                  <p>{offer.niche}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Status</p>
                  <Badge variant={offer.status === 'active' ? 'default' : 'secondary'}>{offer.status}</Badge>
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
                  <p>{offer.commission_type}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Amount</p>
                  <p>{offer.commission_amount}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Percent</p>
                  <p>{offer.commission_percent}</p>
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
