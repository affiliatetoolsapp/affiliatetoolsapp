
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AffiliateOfferWithOffer } from '@/types';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { X } from 'lucide-react';

interface RejectedApplicationsProps {
  applications: AffiliateOfferWithOffer[];
  viewMode: 'grid' | 'list' | 'table';
  isLoading: boolean;
}

const RejectedApplications: React.FC<RejectedApplicationsProps> = ({
  applications,
  viewMode,
  isLoading
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
        <p className="text-muted-foreground">You don't have any rejected applications</p>
      </Card>
    );
  }

  if (viewMode === 'grid') {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {applications.map((application) => (
          <Card key={application.id} className="overflow-hidden">
            <CardHeader className="p-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-md">{application.offer.name}</CardTitle>
                <Badge variant="destructive" className="ml-2">
                  <X className="h-3 w-3 mr-1" />
                  Rejected
                </Badge>
              </div>
              <CardDescription className="line-clamp-2 text-xs">
                {application.offer.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 pt-0 grid gap-1">
              <div className="text-xs">
                <span className="font-medium">Applied on: </span>
                {new Date(application.applied_at || '').toLocaleDateString()}
              </div>
              <div className="text-xs">
                <span className="font-medium">Reviewed on: </span>
                {application.reviewed_at ? 
                  new Date(application.reviewed_at).toLocaleDateString() : 
                  'Not yet reviewed'}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => navigate('/marketplace')}
              >
                Find Similar Offers
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (viewMode === 'table') {
    // Table view
    return (
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Offer</TableHead>
              <TableHead>Applied On</TableHead>
              <TableHead>Reviewed On</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.map((application) => (
              <TableRow key={application.id}>
                <TableCell className="font-medium">{application.offer.name}</TableCell>
                <TableCell>{new Date(application.applied_at || '').toLocaleDateString()}</TableCell>
                <TableCell>
                  {application.reviewed_at ? 
                    new Date(application.reviewed_at).toLocaleDateString() : 
                    'Not yet reviewed'}
                </TableCell>
                <TableCell>
                  <Badge variant="destructive">
                    <X className="h-3 w-3 mr-1" />
                    Rejected
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate('/marketplace')}
                  >
                    Find Similar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
            <TableHead>Reviewed On</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.map((application) => (
            <TableRow key={application.id}>
              <TableCell className="font-medium">{application.offer.name}</TableCell>
              <TableCell>{new Date(application.applied_at || '').toLocaleDateString()}</TableCell>
              <TableCell>
                {application.reviewed_at ? 
                  new Date(application.reviewed_at).toLocaleDateString() : 
                  'Not yet reviewed'}
              </TableCell>
              <TableCell>
                <Badge variant="destructive">
                  <X className="h-3 w-3 mr-1" />
                  Rejected
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default RejectedApplications;
