
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Offer } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save } from 'lucide-react';
import EditOfferForm from '@/components/offers/EditOfferForm';

export default function EditOfferPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Fetch offer details
  useEffect(() => {
    if (!id || !user) return;

    console.log("EditOfferPage: Fetching offer with ID:", id);

    const fetchOffer = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('offers')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error("EditOfferPage: Error fetching offer data:", error);
          throw error;
        }
        
        console.log("EditOfferPage: Fetched offer data:", data);
        
        // Check if user is authorized to edit this offer
        const authorized = 
          user.role === 'admin' || 
          (user.role === 'advertiser' && data.advertiser_id === user.id);
        
        setIsAuthorized(authorized);
        setOffer(data as Offer);

        if (!authorized) {
          toast({
            variant: 'destructive',
            title: 'Access denied',
            description: 'You do not have permission to edit this offer',
          });
          navigate('/offers');
        }
      } catch (error) {
        console.error('EditOfferPage: Error fetching offer:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load offer details',
        });
        navigate('/offers');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOffer();
  }, [id, user, navigate, toast]);

  const handleEditComplete = () => {
    toast({
      title: 'Success',
      description: 'Offer has been updated successfully',
    });
    navigate(`/offers/${id}`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!offer || !isAuthorized) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold">Offer Not Available</h2>
        <p className="text-muted-foreground mt-2">
          The offer you're looking for doesn't exist or you don't have permission to edit it.
        </p>
        <Button className="mt-4" onClick={() => navigate('/offers')}>
          Back to Offers
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Offer</h1>
          <p className="text-muted-foreground">
            Update the details for your offer "{offer.name}"
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate(`/offers/${id}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Offer
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Offer Details</CardTitle>
        </CardHeader>
        <CardContent>
          <EditOfferForm offer={offer} onComplete={handleEditComplete} />
        </CardContent>
      </Card>
    </div>
  );
}
