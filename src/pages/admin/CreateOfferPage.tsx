import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import CreateOffer from '@/components/offers/CreateOffer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface Advertiser {
  id: string;
  email: string;
}

export default function CreateOfferPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selectedAdvertiser, setSelectedAdvertiser] = useState<string>('');

  // Fetch advertisers
  const { data: advertisers, isLoading, error: queryError } = useQuery({
    queryKey: ['advertisers'],
    queryFn: async () => {
      console.log('Fetching advertisers...');
      
      const { data, error } = await supabase
        .from('users')
        .select('id, email')
        .eq('role', 'advertiser')
        .order('email');

      console.log('Query response:', { data, error });

      if (error) {
        console.error('Error fetching advertisers:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to fetch advertisers: ' + error.message,
        });
        throw error;
      }

      if (!data || data.length === 0) {
        console.log('No advertisers found');
        toast({
          title: 'No Advertisers',
          description: 'No advertisers found in the system.',
        });
        return [];
      }

      return data as Advertiser[];
    },
  });

  // Check if user is admin
  useEffect(() => {
    const checkUserRole = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      console.log('Current user:', authUser);
      
      if (!authUser) {
        console.log('No authenticated user found');
        navigate('/');
        return;
      }

      const { data: userData, error: roleError } = await supabase
        .from('users')
        .select('role')
        .eq('id', authUser.id)
        .single();
      
      console.log('User role data:', userData);

      if (roleError) {
        console.error('Error checking user role:', roleError);
        navigate('/');
        return;
      }
      
      if (userData?.role !== 'admin') {
        console.log('User is not an admin:', userData?.role);
        navigate('/');
      }
    };
    checkUserRole();
  }, [navigate]);

  if (queryError) {
    return (
      <div className="p-4">
        <p className="text-red-500">Error loading advertisers: {queryError.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Create New Offer</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Advertiser</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <>
              <Select
                value={selectedAdvertiser}
                onValueChange={setSelectedAdvertiser}
              >
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Select an advertiser" />
                </SelectTrigger>
                <SelectContent>
                  {advertisers?.map((advertiser) => (
                    <SelectItem key={advertiser.id} value={advertiser.id}>
                      {advertiser.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {advertisers && advertisers.length === 0 && (
                <p className="text-sm text-muted-foreground mt-2">No advertisers found</p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {selectedAdvertiser && (
        <CreateOffer advertiserId={selectedAdvertiser} />
      )}
    </div>
  );
} 