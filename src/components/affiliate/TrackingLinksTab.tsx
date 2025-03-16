
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TrackingLinkWithOffer } from '@/types';
import { formatTrackingUrl } from './utils/offerUtils';

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Eye, Copy, Trash } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

interface TrackingLinksTabProps {
  links: TrackingLinkWithOffer[];
  viewMode: 'grid' | 'list';
  isLoading: boolean;
  onDeleteLink: (linkId: string) => void;
  onViewOfferDetails: (offerId: string) => void;
}

const TrackingLinksTab: React.FC<TrackingLinksTabProps> = ({
  links,
  viewMode,
  isLoading,
  onDeleteLink,
  onViewOfferDetails
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Copy tracking link to clipboard
  const handleCopyLink = (trackingCode: string) => {
    const trackingUrl = formatTrackingUrl(trackingCode);
    
    navigator.clipboard.writeText(trackingUrl).then(() => {
      toast({
        title: "Link Copied",
        description: "Tracking link copied to clipboard",
      });
    });
  };

  // Download QR code
  const handleDownloadQR = (trackingCode: string) => {
    const trackingUrl = formatTrackingUrl(trackingCode);
    
    // Create QR code URL 
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(trackingUrl)}`;
    
    // Trigger download
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `qrcode-${trackingCode}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "QR Code Downloaded",
      description: "Your QR code has been downloaded",
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!links?.length) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground mb-4">You don't have any tracking links yet</p>
        <Button 
          onClick={() => {
            navigate('/links');
          }}
        >
          Generate New Links
        </Button>
      </Card>
    );
  }

  if (viewMode === 'grid') {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {links.map((link) => {
          const trackingUrl = formatTrackingUrl(link.tracking_code);
          
          return (
            <Card key={link.id} className="overflow-hidden">
              <CardHeader className="p-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {link.offer?.name || 'Unknown Offer'}
                  </CardTitle>
                  <Badge variant={link.link_type === 'qr' ? 'outline' : 'secondary'} className="capitalize">
                    {link.link_type}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0 grid gap-2">
                <div className="text-sm">
                  <span className="font-medium">Commission: </span>
                  <span>
                    {link.offer?.commission_type === 'RevShare' 
                      ? `${link.offer?.commission_percent}%` 
                      : `$${link.offer?.commission_amount}`}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="font-medium">Created: </span>
                  {new Date(link.created_at).toLocaleDateString()}
                </div>
                <div className="text-sm font-medium mt-2">Tracking Link:</div>
                <div className="flex items-center gap-2 bg-muted p-2 rounded">
                  <div className="font-mono text-sm truncate flex-1">
                    {trackingUrl}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 flex-shrink-0"
                    onClick={() => handleCopyLink(link.tracking_code)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
              <CardFooter className="p-4 pt-0 flex justify-between gap-2">
                <div className="flex gap-2">
                  {link.link_type === 'qr' && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDownloadQR(link.tracking_code)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      QR
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onViewOfferDetails(link.offer_id)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View Offer
                  </Button>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-destructive"
                    >
                      <Trash className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Tracking Link</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this tracking link? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => onDeleteLink(link.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          );
        })}
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
            <TableHead>Tracking Link</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {links.map((link) => {
            const trackingUrl = formatTrackingUrl(link.tracking_code);
            
            return (
              <TableRow key={link.id}>
                <TableCell className="font-medium">{link.offer?.name || 'Unknown Offer'}</TableCell>
                <TableCell>
                  {link.offer?.commission_type === 'RevShare' 
                    ? `${link.offer?.commission_percent}%` 
                    : `$${link.offer?.commission_amount}`}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="font-mono text-sm truncate max-w-[180px]">
                      {trackingUrl}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={() => handleCopyLink(link.tracking_code)}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  {new Date(link.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex justify-center gap-2">
                    {link.link_type === 'qr' && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDownloadQR(link.tracking_code)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        QR
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onViewOfferDetails(link.offer_id)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Offer
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-destructive"
                        >
                          <Trash className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Tracking Link</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this tracking link? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => onDeleteLink(link.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default TrackingLinksTab;
