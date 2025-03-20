
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Offer } from '@/types';
import { format, parseISO } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from '@/components/ui/badge';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from '@/hooks/use-toast';
import { formatGeoTargets } from '@/components/affiliate/utils/offerUtils';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export default function OffersList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [selectedOfferIds, setSelectedOfferIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  const { data: offersData, isLoading, error } = useQuery({
    queryKey: ['offers'],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from('offers')
        .select(`*, advertiser:advertiser_id(company_name)`)
        .order('created_at', { ascending: false });

      if (user.role === 'advertiser') {
        query = query.eq('advertiser_id', user.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching offers:", error);
        throw error;
      }

      return data.map(offer => ({
        ...offer,
        advertiser_name: offer.advertiser?.company_name || 'Unknown'
      })) as unknown as Offer[];
    },
  });

  useEffect(() => {
    if (offersData) {
      setOffers(offersData);
    }
  }, [offersData]);

  useEffect(() => {
    if (offers) {
      setSelectAll(selectedOfferIds.length === offers.length && offers.length > 0);
    } else {
      setSelectAll(false);
    }
  }, [selectedOfferIds, offers]);

  const mutation = useMutation({
    mutationFn: async (offerId: string) => {
      const { error } = await supabase
        .from('offers')
        .delete()
        .eq('id', offerId);

      if (error) {
        console.error("Error deleting offer:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers'] });
      toast({
        title: "Offer Deleted",
        description: "The offer has been successfully deleted.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete offer. Please try again.",
      });
    },
  });

  const handleOfferDeletion = (offerId: string) => {
    mutation.mutate(offerId);
  };

  const handleCheckboxChange = (offerId: string) => {
    setSelectedOfferIds((prevSelected) =>
      prevSelected.includes(offerId)
        ? prevSelected.filter((id) => id !== offerId)
        : [...prevSelected, offerId]
    );
  };

  const handleSelectAllChange = () => {
    if (selectAll) {
      setSelectedOfferIds([]);
    } else if (offers) {
      setSelectedOfferIds(offers.map((offer) => offer.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedOfferIds.length === 0) {
      toast({
        title: "No Offers Selected",
        description: "Please select offers to delete.",
      });
      return;
    }

    try {
      await Promise.all(selectedOfferIds.map(async (offerId) => {
        const { error } = await supabase
          .from('offers')
          .delete()
          .eq('id', offerId);

        if (error) {
          console.error("Error deleting offer:", error);
          throw error;
        }
      }));

      queryClient.invalidateQueries({ queryKey: ['offers'] });
      toast({
        title: "Offers Deleted",
        description: "The selected offers have been successfully deleted.",
      });
      setSelectedOfferIds([]);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete selected offers. Please try again.",
      });
    }
  };

  if (isLoading) return <p>Loading offers...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Offers</h1>
        {user?.role === 'admin' && (
          <Button onClick={() => navigate('/offers/create')}>Create New Offer</Button>
        )}
      </div>

      {offers && offers.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Current Offers</CardTitle>
            <CardDescription>
              Manage and view your current offers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableCaption>A list of your current offers.</TableCaption>
              <TableHeader>
                <TableRow>
                  <th>
                    <Checkbox
                      checked={selectAll}
                      onCheckedChange={handleSelectAllChange}
                    />
                  </th>
                  <TableHead>Offer</TableHead>
                  <TableHead>Advertiser</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Geo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offers.map((offer) => {
                  // When using formatGeoTargets, pass the full offer object, not just geo_targets
                  const geoList = formatGeoTargets(offer);

                  return (
                    <TableRow key={offer.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedOfferIds.includes(offer.id)}
                          onCheckedChange={() => handleCheckboxChange(offer.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          <Avatar>
                            <AvatarImage src={offer.offer_image} />
                            <AvatarFallback>{offer.name.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                          <span>{offer.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{offer.advertiser_name}</TableCell>
                      <TableCell>
                        {offer.commission_type} - {offer.commission_amount || offer.commission_percent}%
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {geoList.map((geo) => (
                            <div key={geo.code} className="inline-flex items-center rounded-md border px-2 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 dark:border-muted/50 dark:text-muted-foreground/80">
                              {geo.flag}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={offer.status === 'active' ? 'default' : 'secondary'}>
                          {offer.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{format(parseISO(offer.created_at), 'MMM d, yyyy')}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => navigate(`/offers/${offer.id}`)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleOfferDeletion(offer.id)} className="text-red-500 focus:bg-red-50">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <p>No offers found.</p>
          </CardContent>
        </Card>
      )}

      {user?.role === 'admin' && (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="destructive" disabled={selectedOfferIds.length === 0}>
              Bulk Delete
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Are you absolutely sure?</DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete the selected offers
                and remove their data from our servers.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Selected Offers
                </Label>
                <div className="col-span-3 space-y-1">
                  {selectedOfferIds.length > 0 ? (
                    selectedOfferIds.map((offerId) => (
                      <Badge key={offerId}>{offerId}</Badge>
                    ))
                  ) : (
                    <p>No offers selected.</p>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="secondary">
                Cancel
              </Button>
              <Button type="submit" variant="destructive" onClick={handleBulkDelete}>
                Continue
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
