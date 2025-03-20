
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { Offer } from '@/types';

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  description: z.string().optional(),
  url: z.string().url({ message: "Must be a valid URL" }),
  commission_type: z.string(),
  commission_amount: z.coerce.number().optional(),
  commission_percent: z.coerce.number().optional(),
  niche: z.string().optional(),
  status: z.string(),
  target_audience: z.string().optional(),
  conversion_requirements: z.string().optional(),
  restrictions: z.string().optional(),
});

interface EditOfferFormProps {
  offer: Offer;
  onComplete: () => void;
}

export default function EditOfferForm({ offer, onComplete }: EditOfferFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [trafficSources, setTrafficSources] = useState<string[]>(offer.allowed_traffic_sources || []);
  const [restrictedGeos, setRestrictedGeos] = useState<string[]>(offer.restricted_geos || []);
  const [geoTargets, setGeoTargets] = useState<string[]>(
    typeof offer.geo_targets === 'string' 
      ? JSON.parse(offer.geo_targets) 
      : Array.isArray(offer.geo_targets) 
        ? offer.geo_targets 
        : offer.geo_targets 
          ? Object.keys(offer.geo_targets) 
          : []
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: offer.name,
      description: offer.description || '',
      url: offer.url,
      commission_type: offer.commission_type,
      commission_amount: offer.commission_amount,
      commission_percent: offer.commission_percent,
      niche: offer.niche || '',
      status: offer.status,
      target_audience: offer.target_audience || '',
      conversion_requirements: offer.conversion_requirements || '',
      restrictions: offer.restrictions || '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      // Create the offer update object
      const offerUpdate = {
        ...values,
        allowed_traffic_sources: trafficSources.length > 0 ? trafficSources : null,
        restricted_geos: restrictedGeos.length > 0 ? restrictedGeos : null,
        geo_targets: geoTargets.length > 0 ? geoTargets : null,
        updated_at: new Date().toISOString(),
      };
      
      // Remove optional fields that are empty strings to avoid database constraints
      Object.keys(offerUpdate).forEach(key => {
        // @ts-ignore
        if (offerUpdate[key] === '') {
          // @ts-ignore
          offerUpdate[key] = null;
        }
      });

      const { error } = await supabase
        .from('offers')
        .update(offerUpdate)
        .eq('id', offer.id);

      if (error) throw error;

      toast({
        title: "Offer updated",
        description: "Your offer has been updated successfully",
      });
      
      onComplete();
    } catch (error) {
      console.error('Error updating offer:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update offer. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Traffic source management
  const handleAddTrafficSource = (source: string) => {
    if (source && !trafficSources.includes(source)) {
      setTrafficSources([...trafficSources, source]);
    }
  };

  const handleRemoveTrafficSource = (source: string) => {
    setTrafficSources(trafficSources.filter(s => s !== source));
  };

  // Geo targets management
  const handleAddGeoTarget = (geo: string) => {
    if (geo && !geoTargets.includes(geo)) {
      setGeoTargets([...geoTargets, geo]);
    }
  };

  const handleRemoveGeoTarget = (geo: string) => {
    setGeoTargets(geoTargets.filter(g => g !== geo));
  };

  // Restricted geos management
  const handleAddRestrictedGeo = (geo: string) => {
    if (geo && !restrictedGeos.includes(geo)) {
      setRestrictedGeos([...restrictedGeos, geo]);
    }
  };

  const handleRemoveRestrictedGeo = (geo: string) => {
    setRestrictedGeos(restrictedGeos.filter(g => g !== geo));
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Offer Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Offer URL</FormLabel>
                <FormControl>
                  <Input {...field} type="url" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending_review">Pending Review</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="niche"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Niche</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormDescription>
                  The category or industry of your offer
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  placeholder="Describe your offer" 
                  className="min-h-[100px]" 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator />

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Commission Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="commission_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Commission Type</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select commission type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="CPA">CPA (Cost Per Action)</SelectItem>
                      <SelectItem value="CPL">CPL (Cost Per Lead)</SelectItem>
                      <SelectItem value="CPS">CPS (Cost Per Sale)</SelectItem>
                      <SelectItem value="CPI">CPI (Cost Per Install)</SelectItem>
                      <SelectItem value="RevShare">Revenue Share</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch('commission_type') === 'RevShare' ? (
              <FormField
                control={form.control}
                name="commission_percent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Commission Percentage (%)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" min="1" max="100" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <FormField
                control={form.control}
                name="commission_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Commission Amount ($)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" min="0" step="0.01" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Target Settings</h3>
          
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="trafficSource">Allowed Traffic Sources</Label>
                  <div className="flex mt-2">
                    <Input 
                      id="trafficSource"
                      className="flex-1 mr-2"
                      placeholder="e.g., Email, Social, Search"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTrafficSource((e.target as HTMLInputElement).value);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }}
                    />
                    <Button 
                      type="button"
                      onClick={() => {
                        const input = document.getElementById('trafficSource') as HTMLInputElement;
                        handleAddTrafficSource(input.value);
                        input.value = '';
                      }}
                    >
                      Add
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    {trafficSources.map((source, index) => (
                      <div 
                        key={index} 
                        className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full flex items-center"
                      >
                        <span>{source}</span>
                        <button 
                          type="button"
                          className="ml-2 text-secondary-foreground/70 hover:text-secondary-foreground"
                          onClick={() => handleRemoveTrafficSource(source)}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="geoTarget">Geo Targeting</Label>
                  <div className="flex mt-2">
                    <Input 
                      id="geoTarget"
                      className="flex-1 mr-2"
                      placeholder="e.g., US, CA, UK"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddGeoTarget((e.target as HTMLInputElement).value.toUpperCase());
                          (e.target as HTMLInputElement).value = '';
                        }
                      }}
                    />
                    <Button 
                      type="button"
                      onClick={() => {
                        const input = document.getElementById('geoTarget') as HTMLInputElement;
                        handleAddGeoTarget(input.value.toUpperCase());
                        input.value = '';
                      }}
                    >
                      Add
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    {geoTargets.map((geo, index) => (
                      <div 
                        key={index} 
                        className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full flex items-center"
                      >
                        <span>{geo}</span>
                        <button 
                          type="button"
                          className="ml-2 text-secondary-foreground/70 hover:text-secondary-foreground"
                          onClick={() => handleRemoveGeoTarget(geo)}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="restrictedGeo">Restricted Geos</Label>
                  <div className="flex mt-2">
                    <Input 
                      id="restrictedGeo"
                      className="flex-1 mr-2"
                      placeholder="e.g., RU, CN, IR"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddRestrictedGeo((e.target as HTMLInputElement).value.toUpperCase());
                          (e.target as HTMLInputElement).value = '';
                        }
                      }}
                    />
                    <Button 
                      type="button"
                      onClick={() => {
                        const input = document.getElementById('restrictedGeo') as HTMLInputElement;
                        handleAddRestrictedGeo(input.value.toUpperCase());
                        input.value = '';
                      }}
                    >
                      Add
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    {restrictedGeos.map((geo, index) => (
                      <div 
                        key={index} 
                        className="bg-destructive/10 text-destructive px-3 py-1 rounded-full flex items-center"
                      >
                        <span>{geo}</span>
                        <button 
                          type="button"
                          className="ml-2 text-destructive/70 hover:text-destructive"
                          onClick={() => handleRemoveRestrictedGeo(geo)}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Additional Information</h3>
          
          <FormField
            control={form.control}
            name="target_audience"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Target Audience</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    placeholder="Describe the ideal audience for this offer" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="conversion_requirements"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Conversion Requirements</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    placeholder="What constitutes a valid conversion" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="restrictions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Restrictions</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    placeholder="Any restrictions or limitations for this offer" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onComplete}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
