import { useState, useEffect } from 'react';
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
import { COUNTRY_CODES } from '@/components/offers/countryCodes';
import { X, Upload, Trash2, Image } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const TRAFFIC_SOURCES = [
  "Search",
  "Social",
  "Email",
  "Display",
  "Native Ads",
  "Push",
  "Pop",
  "Mobile",
  "Contextual",
  "Google",
  "Facebook",
  "TikTok",
  "LinkedIn",
  "Twitter",
  "SEO",
  "PPC",
  "Content Marketing",
  "Affiliate",
  "Referral",
  "Direct"
];

const NICHES = [
  "Health & Wellness",
  "Finance",
  "E-commerce",
  "Education",
  "Technology",
  "Travel",
  "Dating",
  "Gaming",
  "Entertainment",
  "Fashion",
  "Beauty",
  "Fitness",
  "Home & Garden",
  "Business",
  "Crypto",
  "Insurance",
  "Gambling",
  "Adult",
  "Utilities",
  "Other"
];

// Transform the COUNTRY_CODES list to array of objects with code and name
const COUNTRIES = Object.entries(COUNTRY_CODES).map(([code, name]) => ({
  code,
  name: `${name} (${code})`
}));

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
  const [offerImage, setOfferImage] = useState<string | null>(offer.offer_image || null);
  const [offerImageFile, setOfferImageFile] = useState<File | null>(null);
  const [creatives, setCreatives] = useState<any[]>(offer.marketing_materials || []);
  const [newCreativeFiles, setNewCreativeFiles] = useState<File[]>([]);
  const [creativesToDelete, setCreativesToDelete] = useState<string[]>([]);
  const [showCreativesDialog, setShowCreativesDialog] = useState(false);

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
      // First, handle file uploads if any
      let updatedOfferImage = offerImage;
      
      // Upload new offer image if changed
      if (offerImageFile) {
        const imagePath = `${offer.advertiser_id}/offer-images/offer-image-${Math.random().toString(36).substring(2, 15)}.${offerImageFile.name.split('.').pop()}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('offer-assets')
          .upload(imagePath, offerImageFile);
        
        if (uploadError) throw uploadError;
        
        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from('offer-assets')
          .getPublicUrl(imagePath);
        
        updatedOfferImage = publicUrlData.publicUrl;
      }
      
      // Handle creative uploads
      let updatedCreatives = [...creatives];
      
      // Remove creatives marked for deletion
      if (creativesToDelete.length > 0) {
        // Remove from Supabase storage
        for (const path of creativesToDelete) {
          await supabase.storage
            .from('offer-assets')
            .remove([path]);
        }
        
        // Remove from local state
        updatedCreatives = updatedCreatives.filter(
          creative => !creativesToDelete.includes(creative.path)
        );
      }
      
      // Upload new creatives
      for (const file of newCreativeFiles) {
        const filePath = `${offer.advertiser_id}/new/${Math.random().toString(36).substring(2, 15)}.${file.name.split('.').pop()}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('offer-assets')
          .upload(filePath, file);
        
        if (uploadError) throw uploadError;
        
        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from('offer-assets')
          .getPublicUrl(filePath);
        
        updatedCreatives.push({
          url: publicUrlData.publicUrl,
          name: file.name,
          path: filePath,
          size: file.size,
          type: file.type
        });
      }
      
      // Create the offer update object
      const offerUpdate = {
        ...values,
        allowed_traffic_sources: trafficSources.length > 0 ? trafficSources : null,
        restricted_geos: restrictedGeos.length > 0 ? restrictedGeos : null,
        geo_targets: geoTargets.length > 0 ? geoTargets : null,
        offer_image: updatedOfferImage,
        marketing_materials: updatedCreatives.length > 0 ? updatedCreatives : null,
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

  // Offer image management
  const handleOfferImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setOfferImageFile(file);
      setOfferImage(URL.createObjectURL(file));
    }
  };

  const handleRemoveOfferImage = () => {
    setOfferImage(null);
    setOfferImageFile(null);
  };

  // Creatives management
  const handleAddCreatives = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setNewCreativeFiles([...newCreativeFiles, ...filesArray]);
    }
  };

  const handleRemoveNewCreative = (index: number) => {
    setNewCreativeFiles(newCreativeFiles.filter((_, i) => i !== index));
  };

  const handleMarkCreativeForDeletion = (path: string) => {
    setCreativesToDelete([...creativesToDelete, path]);
  };

  const handleRestoreCreative = (path: string) => {
    setCreativesToDelete(creativesToDelete.filter(p => p !== path));
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
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select niche" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {NICHES.map((niche) => (
                      <SelectItem key={niche} value={niche.toLowerCase()}>
                        {niche}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
          <h3 className="text-lg font-medium">Offer Image</h3>
          <div className="flex items-start space-x-4">
            {offerImage ? (
              <div className="relative group">
                <img 
                  src={offerImage} 
                  alt="Offer Preview" 
                  className="w-32 h-32 object-cover rounded-md border"
                />
                <button
                  type="button"
                  onClick={handleRemoveOfferImage}
                  className="absolute top-1 right-1 bg-background/80 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center w-32 h-32 border-2 border-dashed rounded-md">
                <span className="text-muted-foreground text-sm">No image</span>
              </div>
            )}
            <div>
              <Label htmlFor="offerImage" className="cursor-pointer">
                <div className="flex items-center gap-2 bg-primary/10 text-primary rounded-md py-2 px-3">
                  <Upload className="h-4 w-4" />
                  <span>{offerImage ? 'Change Image' : 'Upload Image'}</span>
                </div>
              </Label>
              <Input 
                id="offerImage" 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleOfferImageChange}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Recommended: 1200×628px. Max 5MB
              </p>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Creatives</h3>
            <Button 
              type="button"
              variant="outline" 
              onClick={() => setShowCreativesDialog(true)}
            >
              Manage Creatives
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Add banners, images, and other creative assets for affiliates to use
          </p>
        </div>

        <Dialog open={showCreativesDialog} onOpenChange={setShowCreativesDialog}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Manage Creatives</DialogTitle>
              <DialogDescription>
                Upload, replace, or delete creative assets for your offer
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              <div className="border rounded-md p-4">
                <Label htmlFor="uploadCreatives" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-2 p-6 border-2 border-dashed rounded-md">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <span className="font-medium">Click to upload creatives</span>
                    <span className="text-sm text-muted-foreground">
                      PNG, JPG, GIF up to 10MB
                    </span>
                  </div>
                </Label>
                <Input 
                  id="uploadCreatives" 
                  type="file" 
                  accept="image/*" 
                  multiple 
                  className="hidden" 
                  onChange={handleAddCreatives}
                />
              </div>
              
              {/* New files to upload */}
              {newCreativeFiles.length > 0 && (
                <>
                  <h4 className="font-medium mt-4">New Files</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {newCreativeFiles.map((file, index) => (
                      <div key={index} className="border rounded-md p-2 relative group">
                        <img 
                          src={URL.createObjectURL(file)} 
                          alt={file.name} 
                          className="w-full h-32 object-cover mb-2 rounded"
                        />
                        <div className="text-sm truncate">{file.name}</div>
                        <button
                          type="button"
                          onClick={() => handleRemoveNewCreative(index)}
                          className="absolute top-1 right-1 bg-background/80 p-1 rounded-full"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
              
              {/* Existing creatives */}
              {creatives.length > 0 && (
                <>
                  <h4 className="font-medium mt-4">Existing Creatives</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {creatives.map((creative, index) => {
                      const isMarkedForDeletion = creativesToDelete.includes(creative.path);
                      
                      return (
                        <div 
                          key={index} 
                          className={`border rounded-md p-2 relative group ${isMarkedForDeletion ? 'opacity-50' : ''}`}
                        >
                          <img 
                            src={creative.url} 
                            alt={creative.name} 
                            className="w-full h-32 object-cover mb-2 rounded"
                          />
                          <div className="text-sm truncate">{creative.name}</div>
                          {isMarkedForDeletion ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-background/30">
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => handleRestoreCreative(creative.path)}
                              >
                                Restore
                              </Button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleMarkCreativeForDeletion(creative.path)}
                              className="absolute top-1 right-1 bg-background/80 p-1 rounded-full"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
              
              <div className="flex justify-end mt-4">
                <Button
                  type="button"
                  onClick={() => setShowCreativesDialog(false)}
                >
                  Done
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

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
                  <Label>Allowed Traffic Sources</Label>
                  <div className="flex mt-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          Select Traffic Sources
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-56 max-h-80 overflow-auto">
                        {TRAFFIC_SOURCES.map((source) => (
                          <DropdownMenuItem
                            key={source}
                            onClick={() => handleAddTrafficSource(source)}
                            disabled={trafficSources.includes(source)}
                          >
                            {source}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
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
                  <Label>Geo Targeting</Label>
                  <div className="flex mt-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          Select Countries
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-72 max-h-80 overflow-auto">
                        {COUNTRIES.map((country) => (
                          <DropdownMenuItem
                            key={country.code}
                            onClick={() => handleAddGeoTarget(country.code)}
                            disabled={geoTargets.includes(country.code)}
                          >
                            {country.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    {geoTargets.map((geo, index) => (
                      <div 
                        key={index} 
                        className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full flex items-center"
                      >
                        <span>{geo} - {COUNTRY_CODES[geo] || ''}</span>
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
                  <Label>Restricted Geos</Label>
                  <div className="flex mt-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          Select Restricted Countries
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-72 max-h-80 overflow-auto">
                        {COUNTRIES.map((country) => (
                          <DropdownMenuItem
                            key={country.code}
                            onClick={() => handleAddRestrictedGeo(country.code)}
                            disabled={restrictedGeos.includes(country.code)}
                          >
                            {country.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    {restrictedGeos.map((geo, index) => (
                      <div 
                        key={index} 
                        className="bg-destructive/10 text-destructive px-3 py-1 rounded-full flex items-center"
                      >
                        <span>{geo} - {COUNTRY_CODES[geo] || ''}</span>
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
