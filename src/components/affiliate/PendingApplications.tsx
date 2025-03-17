import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AffiliateOfferWithOffer } from '@/types';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Clock, Trash } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface PendingApplicationsProps {
  applications: AffiliateOfferWithOffer[];
  viewMode: 'grid' | 'list';
  isLoading: boolean;
  onCancelApplication: (applicationId: string) => void;
}

const PendingApplications: React.FC<PendingApplicationsProps> = ({
  applications,
  viewMode,
  isLoading,
  onCancelApplication
}) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!applications?.length) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">You don't have any pending applications</p>
        <Button 
          onClick={() => navigate('/marketplace')}
          className="mt-4"
        >
          Browse Marketplace
        </Button>
      </Card>
    );
  }

  if (viewMode === 'grid') {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {applications.map((application) => (
          <Card key={application.id} className="overflow-hidden">
            <CardHeader className="p-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{application.offer?.name}</CardTitle>
                <Badge variant="outline" className="ml-2">
                  <Clock className="h-3 w-3 mr-1" />
                  Pending
                </Badge>
              </div>
              <CardDescription className="line-clamp-2">
                {application.offer?.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 grid gap-2">
              <div className="text-sm">
                <span className="font-medium">Applied on: </span>
                {new Date(application.applied_at || '').toLocaleDateString()}
              </div>
              <div className="text-sm">
                <span className="font-medium">Traffic Source: </span>
                {application.traffic_source}
              </div>
              {application.notes && (
                <div className="text-sm">
                  <span className="font-medium">Your Notes: </span>
                  {application.notes}
                </div>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="mt-2 text-destructive">
                    <Trash className="h-4 w-4 mr-2" />
                    Cancel Application
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Application</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to cancel your application for "{application.offer?.name}"? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>No, keep it</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onCancelApplication(application.id)}>
                      Yes, cancel application
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
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
            <TableHead>Applied On</TableHead>
            <TableHead>Traffic Source</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.map((application) => (
            <TableRow key={application.id}>
              <TableCell className="font-medium">{application.offer.name}</TableCell>
              <TableCell>{new Date(application.applied_at || '').toLocaleDateString()}</TableCell>
              <TableCell>{application.traffic_source || '-'}</TableCell>
              <TableCell>
                <Badge variant="secondary">
                  <Clock className="h-3 w-3 mr-1" />
                  Pending
                </Badge>
              </TableCell>
              <TableCell>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-destructive">
                      <Trash className="h-3 w-3 mr-1" />
                      Cancel
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel Application</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to cancel your application for "{application.offer.name}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>No, keep it</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onCancelApplication(application.id)}>
                        Yes, cancel application
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default PendingApplications;
