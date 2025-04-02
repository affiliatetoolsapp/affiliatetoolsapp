import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Edit, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { transformOfferData } from '@/utils/offerTransformations';

export default function OffersPage() {
  const { offerId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isEditMode, setIsEditMode] = useState(false);

  const { data: offerData, isLoading: offerLoading } = useQuery({
    queryKey: ['offer', offerId],
    queryFn: async () => {
      if (!offerId) return null;

      const { data, error } = await supabase
        .from('offers')
        .select(`
          *,
          advertiser:advertiser_id (
            id,
            email,
            company_name,
            contact_name
          )
        `)
        .eq('id', offerId)
        .single();

      if (error) {
        console.error("Error fetching offer:", error);
        throw error;
      }

      return data;
    },
    enabled: !!offerId,
  });

  const offer = offerData ? transformOfferData(offerData) : null;

  const handleEditClick = () => {
    setIsEditMode(true);
    navigate(`/admin/offers/${offerId}/edit`);
  };

  const handleBackClick = () => {
    navigate('/admin/offers');
  };

  if (offerLoading) {
    return (
      <div className="container mx-auto p-4">
        <Card className="w-full max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle><Skeleton className="h-6 w-32" /></CardTitle>
            <CardDescription><Skeleton className="h-4 w-64" /></CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="container mx-auto p-4">
        <Card className="w-full max-w-3xl mx-auto">
          <CardContent>
            Offer not found.
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch user data
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['user', offer.advertiser_id],
    queryFn: async () => {
      if (!offer.advertiser_id) return null;

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', offer.advertiser_id)
        .single();

      if (error) {
        console.error("Error fetching user:", error);
        return null;
      }

      return data;
    },
    enabled: !!offer.advertiser_id,
  });

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">
            {offer.name}
          </CardTitle>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={handleBackClick}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button size="sm" onClick={handleEditClick}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Offer
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="md:grid md:grid-cols-2 gap-4">
            <div>
              <div className="mb-4">
                <h4 className="text-sm font-medium leading-none">Description</h4>
                <p className="text-sm text-muted-foreground">
                  {offer.description || 'No description provided.'}
                </p>
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-medium leading-none">URL</h4>
                <a href={offer.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline">
                  {offer.url}
                </a>
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-medium leading-none">Status</h4>
                <Badge variant="secondary">{offer.status}</Badge>
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-medium leading-none">Niche</h4>
                <p className="text-sm text-muted-foreground">{offer.niche || 'N/A'}</p>
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-medium leading-none">Commission</h4>
                <p className="text-sm text-muted-foreground">
                  {offer.commission_type}: ${offer.commission_amount}
                </p>
              </div>

              {offer.payout_frequency && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium leading-none">Payout Frequency</h4>
                  <p className="text-sm text-muted-foreground">{offer.payout_frequency}</p>
                </div>
              )}
            </div>

            <div>
              <div className="mb-4">
                <h4 className="text-sm font-medium leading-none">Advertiser</h4>
                {userLoading ? (
                  <Skeleton className="h-10 w-40" />
                ) : userData ? (
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src={`https://avatar.vercel.sh/${userData.email}.png`} />
                      <AvatarFallback>{userData.contact_name?.charAt(0) || userData.email.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold">{userData.contact_name || userData.email}</p>
                      <p className="text-sm text-muted-foreground">{userData.email}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Advertiser information not available.</p>
                )}
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-medium leading-none">Target Audience</h4>
                <p className="text-sm text-muted-foreground">
                  {offer.target_audience || 'Not specified.'}
                </p>
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-medium leading-none">Conversion Requirements</h4>
                <p className="text-sm text-muted-foreground">
                  {offer.conversion_requirements || 'Not specified.'}
                </p>
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-medium leading-none">Restrictions</h4>
                <p className="text-sm text-muted-foreground">
                  {offer.restrictions || 'None.'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
