import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Offer } from '@/types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, ArrowLeft, Check, ChevronsUpDown, Info, Loader2, Plus, Trash, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

// Define the form schema with Zod
const offerSchema = z.object({
  name: z.string().min(3, { message: "Offer name must be at least 3 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  offer_url: z.string().url({ message: "Please enter a valid URL" }),
  offer_image: z.string().optional(),
  niche: z.string().optional(),
  commission_type: z.enum(["CPA", "CPL", "CPS", "RevShare"]),
  commission_amount: z.coerce.number().min(0, { message: "Commission amount must be a positive number" }).optional(),
  commission_percent: z.coerce.number().min(0, { message: "Commission percentage must be a positive number" }).max(100, { message: "Commission percentage cannot exceed 100%" }).optional(),
  is_featured: z.boolean().default(false),
  status: z.enum(["active", "paused", "pending"]).default("active"),
  allowed_traffic_sources: z.array(z.string()).optional(),
  restricted_traffic_sources: z.array(z.string()).optional(),
  target_audience: z.string().optional(),
  conversion_requirements: z.string().optional(),
  restricted_promotion_methods: z.array(z.string()).optional(),
  terms_and_conditions: z.string().optional(),
  geo_targets: z.any().optional(),
  restricted_geos: z.array(z.string()).optional(),
});

// Define the traffic source options
const trafficSourceOptions = [
  { id: "search", label: "Search" },
  { id: "social", label: "Social Media" },
  { id: "email", label: "Email" },
  { id: "native", label: "Native Ads" },
  { id: "display", label: "Display Ads" },
  { id: "push", label: "Push Notifications" },
  { id: "contextual", label: "Contextual" },
  { id: "ppc", label: "PPC" },
  { id: "organic", label: "Organic" },
  { id: "content", label: "Content Marketing" },
  { id: "influencer", label: "Influencer" },
  { id: "video", label: "Video" },
  { id: "mobile", label: "Mobile" },
  { id: "app", label: "App" },
];

// Define the restricted promotion methods options
const restrictedPromotionOptions = [
  { id: "incentive", label: "Incentivized Traffic" },
  { id: "adult", label: "Adult Content" },
  { id: "spam", label: "Spam" },
  { id: "brand_bidding", label: "Brand Bidding" },
  { id: "cookie_stuffing", label: "Cookie Stuffing" },
  { id: "toolbar", label: "Toolbars/Extensions" },
  { id: "pop", label: "Pop-ups/Pop-unders" },
  { id: "bot", label: "Bot Traffic" },
  { id: "misleading", label: "Misleading Claims" },
];

// Define the niche options
const nicheOptions = [
  { value: "health_fitness", label: "Health & Fitness" },
  { value: "finance", label: "Finance" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "education", label: "Education" },
  { value: "software", label: "Software & Technology" },
  { value: "travel", label: "Travel" },
  { value: "beauty", label: "Beauty" },
  { value: "fashion", label: "Fashion" },
  { value: "home", label: "Home & Garden" },
  { value: "gaming", label: "Gaming" },
  { value: "crypto", label: "Cryptocurrency" },
  { value: "dating", label: "Dating" },
  { value: "entertainment", label: "Entertainment" },
  { value: "food", label: "Food & Beverage" },
  { value: "pets", label: "Pets" },
  { value: "sports", label: "Sports" },
  { value: "business", label: "Business" },
  { value: "legal", label: "Legal" },
  { value: "insurance", label: "Insurance" },
  { value: "other", label: "Other" },
];

// Define the country options
const countryOptions = [
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "GB", name: "United Kingdom" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "IT", name: "Italy" },
  { code: "ES", name: "Spain" },
  { code: "JP", name: "Japan" },
  { code: "CN", name: "China" },
  { code: "IN", name: "India" },
  { code: "BR", name: "Brazil" },
  { code: "MX", name: "Mexico" },
  { code: "RU", name: "Russia" },
  { code: "ZA", name: "South Africa" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "SG", name: "Singapore" },
  { code: "NZ", name: "New Zealand" },
  { code: "SE", name: "Sweden" },
  { code: "NO", name: "Norway" },
  { code: "DK", name: "Denmark" },
  { code: "FI", name: "Finland" },
  { code: "NL", name: "Netherlands" },
  { code: "BE", name: "Belgium" },
  { code: "CH", name: "Switzerland" },
  { code: "AT", name: "Austria" },
  { code: "PL", name: "Poland" },
  { code: "PT", name: "Portugal" },
  { code: "IE", name: "Ireland" },
  { code: "GR", name: "Greece" },
  { code: "IL", name: "Israel" },
  { code: "TR", name: "Turkey" },
  { code: "TH", name: "Thailand" },
  { code: "VN", name: "Vietnam" },
  { code: "ID", name: "Indonesia" },
  { code: "MY", name: "Malaysia" },
  { code: "PH", name: "Philippines" },
  { code: "KR", name: "South Korea" },
  { code: "HK", name: "Hong Kong" },
  { code: "TW", name: "Taiwan" },
  { code: "EG", name: "Egypt" },
  { code: "NG", name: "Nigeria" },
  { code: "KE", name: "Kenya" },
  { code: "AR", name: "Argentina" },
  { code: "CL", name: "Chile" },
  { code: "CO", name: "Colombia" },
  { code: "PE", name: "Peru" },
  { code: "VE", name: "Venezuela" },
];

interface CreateOfferProps {
  initialData?: Offer;
}

export default function CreateOffer({ initialData }: CreateOfferProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [restrictedCountries, setRestrictedCountries] = useState<string[]>([]);
  const [openCountrySelector, setOpenCountrySelector] = useState(false);
  const [openRestrictedCountrySelector, setOpenRestrictedCountrySelector] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState("basic");
  const isEditMode = !!initialData;

  // Initialize the form with react-hook-form
  const form = useForm<z.infer<typeof offerSchema>>({
    resolver: zodResolver(offerSchema),
    defaultValues: {
      name: "",
      description: "",
      offer_url: "",
      offer_image: "",
      niche: "",
      commission_type: "CPA",
      commission_amount: 0,
      commission_percent: 0,
      is_featured: false,
      status: "active",
      allowed_traffic_sources: [],
      restricted_traffic_sources: [],
      target_audience: "",
      conversion_requirements: "",
      restricted_promotion_methods: [],
      terms_and_conditions: "",
      geo_targets: [],
      restricted_geos: [],
    },
  });

  // Populate form with initial data if in edit mode
  useEffect(() => {
    if (initialData) {
      // Parse geo_targets if it's a string
      let geoTargets = initialData.geo_targets;
      if (typeof geoTargets === 'string') {
        try {
          geoTargets = JSON.parse(geoTargets);
        } catch (e) {
          console.error("Error parsing geo_targets:", e);
          geoTargets = [];
        }
      }

      // Set form values from initialData
      form.reset({
        name: initialData.name || "",
        description: initialData.description || "",
        offer_url: initialData.url || initialData.offer_url || "", // Handle both url and offer_url
        offer_image: initialData.offer_image || "",
        niche: initialData.niche || "",
        commission_type: initialData.commission_type as any || "CPA",
        commission_amount: initialData.commission_amount || 0,
        commission_percent: initialData.commission_percent || 0,
        is_featured: initialData.is_featured || false,
        status: initialData.status as any || "active",
        allowed_traffic_sources: initialData.allowed_traffic_sources || [],
        restricted_traffic_sources: initialData.restricted_traffic_sources || [],
        target_audience: initialData.target_audience || "",
        conversion_requirements: initialData.conversion_requirements || "",
        restricted_promotion_methods: initialData.restricted_promotion_methods || [],
        terms_and_conditions: initialData.terms_and_conditions || "",
        geo_targets: geoTargets || [],
        restricted_geos: initialData.restricted_geos || [],
      });

      // Set selected countries from geo_targets
      if (Array.isArray(geoTargets)) {
        setSelectedCountries(geoTargets.map(c => String(c)));
      } else if (geoTargets && typeof geoTargets === 'object') {
        setSelectedCountries(Object.keys(geoTargets).map(c => String(c)));
      }

      // Set restricted countries
      if (initialData.restricted_geos && Array.isArray(initialData.restricted_geos)) {
        setRestrictedCountries(initialData.restricted_geos.map(c => String(c)));
      }

      // Set image URL
      if (initialData.offer_image) {
        setImageUrl(initialData.offer_image);
      }
    }
  }, [initialData, form]);

  // Watch form values for conditional rendering
  const commissionType = form.watch("commission_type");

  // Create or update offer mutation
  const mutation = useMutation({
    mutationFn: async (data: z.infer<typeof offerSchema>) => {
      if (!user) throw new Error("User not authenticated");

      // Prepare the data for submission
      const offerData = {
        ...data,
        url: data.offer_url, // Map offer_url to url for database
        advertiser_id: user.id,
        geo_targets: selectedCountries.length > 0 ? selectedCountries : null,
        restricted_geos: restrictedCountries.length > 0 ? restrictedCountries : null,
        updated_at: new Date().toISOString(),
      };

      if (isEditMode) {
        // Update existing offer
        const { data: updatedOffer, error } = await supabase
          .from('offers')
          .update(offerData)
          .eq('id', initialData.id)
          .select()
          .single();

        if (error) throw error;
        return updatedOffer;
      } else {
        // Create new offer
        const { data: newOffer, error } = await supabase
          .from('offers')
          .insert({
            ...offerData,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;
        return newOffer;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['offers'] });
      toast({
        title: isEditMode ? "Offer Updated" : "Offer Created",
        description: isEditMode 
          ? "Your offer has been successfully updated." 
          : "Your offer has been successfully created.",
      });
      navigate(`/offers/${data.id}`);
    },
    onError: (error) => {
      console.error("Error saving offer:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to ${isEditMode ? 'update' : 'create'} offer. Please try again.`,
      });
    },
  });

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageUploading(true);
    try {
      // Generate a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `offer-images/${fileName}`;

      // Upload the file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('offers')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data } = supabase.storage.from('offers').getPublicUrl(filePath);
      
      // Set the image URL and update the form
      setImageUrl(data.publicUrl);
      form.setValue("offer_image", data.publicUrl);
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: "Failed to upload image. Please try again.",
      });
    } finally {
      setImageUploading(false);
    }
  };

  // Handle form submission
  const onSubmit = (data: z.infer<typeof offerSchema>) => {
    mutation.mutate(data);
  };

  // Handle country selection
  const toggleCountry = (country: string) => {
    setSelectedCountries(current => 
      current.includes(country)
        ? current.filter(c => c !== country)
        : [...current, country]
    );
  };

  // Handle restricted country selection
  const toggleRestrictedCountry = (country: string) => {
    setRestrictedCountries(current => 
      current.includes(country)
        ? current.filter(c => c !== country)
        : [...current, country]
    );
  };

  return (
    <div className="container mx-auto py-6 max-w-5xl">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          className="mr-2"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">
          {isEditMode ? "Edit Offer" : "Create New Offer"}
        </h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Tabs 
            defaultValue="basic" 
            value={currentTab}
            onValueChange={setCurrentTab}
            className="w-full"
          >
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="commission">Commission</TabsTrigger>
              <TabsTrigger value="targeting">Targeting</TabsTrigger>
              <TabsTrigger value="requirements">Requirements</TabsTrigger>
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="basic" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Offer Details</CardTitle>
                  <CardDescription>
                    Provide the basic information about your offer
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Offer Name*</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter offer name" {...field} />
                        </FormControl>
                        <FormDescription>
                          A clear, concise name for your offer
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description*</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your offer" 
                            className="min-h-[120px]" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Provide a detailed description of what you're offering
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="offer_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Offer URL*</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/offer" {...field} />
                        </FormControl>
                        <FormDescription>
                          The landing page URL for your offer
                        </FormDescription>
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
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a niche" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {nicheOptions.map((niche) => (
                              <SelectItem key={niche.value} value={niche.value}>
                                {niche.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Select the category that best fits your offer
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-3">
                    <Label>Offer Image</Label>
                    <div className="flex items-center gap-4">
                      {imageUrl && (
                        <div className="relative w-24 h-24 border rounded-md overflow-hidden">
                          <img 
                            src={imageUrl} 
                            alt="Offer preview" 
                            className="w-full h-full object-cover"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6"
                            onClick={() => {
                              setImageUrl(null);
                              form.setValue("offer_image", "");
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                      <div>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={imageUploading}
                          className="w-full"
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          Upload an image for your offer (recommended size: 800x600px)
                        </p>
                        {imageUploading && (
                          <div className="flex items-center mt-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Uploading...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Offer Status</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="paused">Paused</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Set the current status of your offer
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="is_featured"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Featured Offer</FormLabel>
                          <FormDescription>
                            Featured offers appear prominently in the marketplace
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => navigate(-1)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => setCurrentTab("commission")}
                  >
                    Next
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Commission Tab */}
            <TabsContent value="commission" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Commission Structure</CardTitle>
                  <CardDescription>
                    Define how affiliates will be compensated
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="commission_type"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Commission Type*</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="CPA" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Cost Per Action (CPA)
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="CPL" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Cost Per Lead (CPL)
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="CPS" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Cost Per Sale (CPS)
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="RevShare" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Revenue Share
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormDescription>
                          Select how you want to pay affiliates
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {commissionType === "RevShare" ? (
                    <FormField
                      control={form.control}
                      name="commission_percent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Commission Percentage*</FormLabel>
                          <FormControl>
                            <div className="flex items-center">
                              <Input 
                                type="number" 
                                min="0" 
                                max="100" 
                                step="0.1"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              />
                              <span className="ml-2">%</span>
                            </div>
                          </FormControl>
                          <FormDescription>
                            The percentage of revenue shared with affiliates
                          </FormDescription>
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
                          <FormLabel>Commission Amount*</FormLabel>
                          <FormControl>
                            <div className="flex items-center">
                              <span className="mr-2">$</span>
                              <Input 
                                type="number" 
                                min="0" 
                                step="0.01"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            The fixed amount paid per conversion
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Commission Information</AlertTitle>
                    <AlertDescription>
                      Setting competitive commission rates helps attract quality affiliates. 
                      The average {commissionType === "RevShare" ? "revenue share" : commissionType} in your niche 
                      is {commissionType === "RevShare" ? "20-30%" : "$15-25"}.
                    </AlertDescription>
                  </Alert>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setCurrentTab("basic")}
                  >
                    Previous
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => setCurrentTab("targeting")}
                  >
                    Next
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Targeting Tab */}
            <TabsContent value="targeting" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Targeting Options</CardTitle>
                  <CardDescription>
                    Define where and how your offer can be promoted
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label>Geo Targeting</Label>
                    <Popover open={openCountrySelector} onOpenChange={setOpenCountrySelector}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openCountrySelector}
                          className="w-full justify-between"
                        >
                          {selectedCountries.length === 0
                            ? "Select countries"
                            : `${selectedCountries.length} countries selected`}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search countries..." />
                          <CommandEmpty>No country found.</CommandEmpty>
                          <CommandGroup>
                            <ScrollArea className="h-72">
                              {countryOptions.map((country) => (
                                <CommandItem
                                  key={country.code}
                                  value={country.code}
                                  onSelect={() => toggleCountry(country.code)}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedCountries.includes(country.code)
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {country.name} ({country.code})
                                </CommandItem>
                              ))}
                            </ScrollArea>
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedCountries.map((code) => {
                        const country = countryOptions.find(c => c.code === code);
                        return (
                          <Badge key={code} variant="secondary" className="flex items-center gap-1">
                            {country?.name || code}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 p-0 ml-1"
                              onClick={() => toggleCountry(code)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        );
                      })}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {selectedCountries.length === 0 
                        ? "Leave empty to target globally" 
                        : `Your offer will be shown to affiliates in these ${selectedCountries.length} countries`}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label>Restricted Geos</Label>
                    <Popover open={openRestrictedCountrySelector} onOpenChange={setOpenRestrictedCountrySelector}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openRestrictedCountrySelector}
                          className="w-full justify-between"
                        >
                          {restrictedCountries.length === 0
                            ? "Select restricted countries"
                            : `${restrictedCountries.length} countries restricted`}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search countries..." />
                          <CommandEmpty>No country found.</CommandEmpty>
                          <CommandGroup>
                            <ScrollArea className="h-72">
                              {countryOptions.map((country) => (
                                <CommandItem
                                  key={country.code}
