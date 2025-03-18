import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TagInput } from '@/components/ui/tag-input';
import {
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Image as ImageIcon,
  Upload,
  Loader2
} from 'lucide-react';
import GeoCommissionSelector from './GeoCommissionSelector';
import CreativesTab from './CreativesTab';

// Form schema
const offerSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  url: z.string().url('Must be a valid URL'),
  niche: z.string().min(1, 'Please select a niche'),
  target_audience: z.string().optional(),
  conversion_requirements: z.string().optional(),
  restrictions: z.string().optional(),
  commission_type: z.string().min(1, 'Please select a commission type'),
  commission_amount: z.string().optional(),
  commission_percent: z.string().optional(),
  allowed_traffic_sources: z.array(z.string()).optional(),
  geo_targets: z.array(z.string()).optional(),
  restricted_geos: z.array(z.string()).optional(),
  status: z.string().optional(),
  offer_image: z.string().optional(),
  geo_commissions: z.array(z.object({
    country: z.string(),
    amount: z.string()
  })).optional(),
});

type OfferFormValues = z.infer<typeof offerSchema>;

const CreateOffer = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('basic');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [geoCommissions, setGeoCommissions] = useState<{country: string, amount: string}[]>([]);
  const [creatives, setCreatives] = useState<any[]>([]);
  const [geoCommissionsEnabled, setGeoCommissionsEnabled] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  const form = useForm<OfferFormValues>({
    resolver: zodResolver(offerSchema),
    defaultValues: {
      name: '',
      description: '',
      url: '',
      niche: '',
      target_audience: '',
      conversion_requirements: '',
      restrictions: '',
      commission_type: 'CPA',
      commission_amount: '',
      commission_percent: '',
      allowed_traffic_sources: [],
      geo_targets: [],
      restricted_geos: [],
      status: 'active',
      offer_image: '',
      geo_commissions: [],
    },
  });
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors }, 
    setValue, 
    watch, 
    getValues 
  } = form;
  
  const commissionType = watch('commission_type');
  
  // Handle image upload for offer image
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    setUploading(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `offer-image-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${user.id}/offer-images/${fileName}`;
      
      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from('offer-assets')
        .upload(filePath, file);
      
      if (error) {
        console.error('Error uploading offer image:', error);
        toast({
          variant: 'destructive',
          title: 'Upload Failed',
          description: error.message,
        });
        return;
      }
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('offer-assets')
        .getPublicUrl(filePath);
      
      // Update form and preview
      setValue('offer_image', publicUrl);
      setImagePreview(publicUrl);
      
      toast({
        title: 'Image Uploaded',
        description: 'Offer image uploaded successfully',
      });
    } catch (error) {
      console.error('Error in upload process:', error);
      toast({
        variant: 'destructive',
        title: 'Upload Error',
        description: 'An unexpected error occurred during upload',
      });
    } finally {
      setUploading(false);
    }
  };

  // Handle moving between tabs
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  // Handle geo commission changes
  const handleGeoCommissionsChange = (commissions: {country: string, amount: string}[]) => {
    setGeoCommissions(commissions);
    setValue('geo_commissions', commissions);
  };
  
  // Handle geo targets update based on geo commissions
  const handleGeoTargetsUpdate = (countries: string[]) => {
    setValue('geo_targets', countries);
  };
  
  // Handle enabling/disabling geo commissions
  const handleGeoCommissionsEnabledChange = (enabled: boolean) => {
    setGeoCommissionsEnabled(enabled);
    if (!enabled) {
      setGeoCommissions([]);
      setValue('geo_commissions', []);
      setValue('geo_targets', []);
    }
  };
  
  // Handle creatives change
  const handleCreativesChange = (newCreatives: any[]) => {
    setCreatives(newCreatives);
  };

  // Submit the form
  const onSubmit = async (data: OfferFormValues) => {
    if (!user) return;

    setIsSubmitting(true);

    try {
      // Explicitly ensure commission_type is included
      const offerData = {
        name: data.name,
        description: data.description,
        url: data.url,
        niche: data.niche,
        target_audience: data.target_audience,
        conversion_requirements: data.conversion_requirements,
        restrictions: data.restrictions,
        commission_type: data.commission_type, // Explicitly include commission_type
        status: data.status,
        allowed_traffic_sources: data.allowed_traffic_sources,
        restricted_geos: data.restricted_geos,
        offer_image: data.offer_image,
        advertiser_id: user.id,
        geo_commissions: geoCommissionsEnabled && geoCommissions.length > 0 ? geoCommissions : null,
        marketing_materials: creatives.length > 0 ? creatives : null,
        // Convert string numbers to actual numbers for the database
        commission_amount: data.commission_amount ? parseFloat(data.commission_amount) : null,
        commission_percent: data.commission_percent ? parseFloat(data.commission_percent) : null,
        geo_targets: geoCommissionsEnabled ? data.geo_targets || [] : []
      };

      // Insert into Supabase
      const { data: offer, error } = await supabase
        .from('offers')
        .insert(offerData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast({
        title: 'Offer Created',
        description: 'Your offer has been created successfully',
      });

      // Redirect to offers list
      navigate('/offers');
    } catch (error: any) {
      console.error('Error creating offer:', error);
      toast({
        variant: 'destructive',
        title: 'Error Creating Offer',
        description: error.message || 'An unexpected error occurred',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Next tab handler
  const handleNextTab = () => {
    switch (activeTab) {
      case 'basic':
        setActiveTab('commission');
        break;
      case 'commission':
        setActiveTab('targeting');
        break;
      case 'targeting':
        setActiveTab('creatives');
        break;
      case 'creatives':
        setActiveTab('tracking');
        break;
      default:
        break;
    }
  };

  // Previous tab handler
  const handlePrevTab = () => {
    switch (activeTab) {
      case 'commission':
        setActiveTab('basic');
        break;
      case 'targeting':
        setActiveTab('commission');
        break;
      case 'creatives':
        setActiveTab('targeting');
        break;
      case 'tracking':
        setActiveTab('creatives');
        break;
      default:
        break;
    }
  };

  // Traffic source tag input handler
  const handleTrafficSourcesChange = useCallback(
    (value: string[]) => {
      setValue('allowed_traffic_sources', value);
    },
    [setValue]
  );

  // Restricted geos tag input handler
  const handleRestrictedGeosChange = useCallback(
    (value: string[]) => {
      setValue('restricted_geos', value);
    },
    [setValue]
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Create New Offer</h2>
        <p className="text-muted-foreground">
          Create a new affiliate offer to promote your product or service
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="commission">Commission</TabsTrigger>
            <TabsTrigger value="targeting">Targeting</TabsTrigger>
            <TabsTrigger value="creatives">Creatives</TabsTrigger>
            <TabsTrigger value="tracking">Tracking</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 mt-4">
            <Card>
              <CardContent className="pt-6">
                <div className="grid gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Offer Name</Label>
                      <Input
                        id="name"
                        placeholder="e.g. Premium Product Promotion"
                        {...register('name')}
                      />
                      {errors.name && (
                        <p className="text-red-500 text-sm">{errors.name.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="niche">Niche/Category</Label>
                      <Select
                        onValueChange={(value) => setValue('niche', value)}
                        defaultValue={getValues('niche')}
                      >
                        <SelectTrigger id="niche">
                          <SelectValue placeholder="Select niche" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="health">Health & Fitness</SelectItem>
                          <SelectItem value="beauty">Beauty</SelectItem>
                          <SelectItem value="finance">Finance</SelectItem>
                          <SelectItem value="education">Education</SelectItem>
                          <SelectItem value="technology">Technology</SelectItem>
                          <SelectItem value="ecommerce">eCommerce</SelectItem>
                          <SelectItem value="dating">Dating</SelectItem>
                          <SelectItem value="gaming">Gaming</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.niche && (
                        <p className="text-red-500 text-sm">{errors.niche.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="url">Offer URL</Label>
                      <Input
                        id="url"
                        placeholder="https://yourdomain.com/offer"
                        {...register('url')}
                      />
                      {errors.url && (
                        <p className="text-red-500 text-sm">{errors.url.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status">Offer Status</Label>
                      <Select
                        onValueChange={(value) => setValue('status', value)}
                        defaultValue={getValues('status')}
                      >
                        <SelectTrigger id="status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="paused">Paused</SelectItem>
                          <SelectItem value="draft">Draft</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Offer Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your offer in detail"
                      className="min-h-[100px]"
                      {...register('description')}
                    />
                    {errors.description && (
                      <p className="text-red-500 text-sm">{errors.description.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="target_audience">Target Audience</Label>
                    <Textarea
                      id="target_audience"
                      placeholder="Describe the ideal customer for this offer"
                      className="min-h-[80px]"
                      {...register('target_audience')}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="offer_image">Offer Image</Label>
                    <div className="flex items-center gap-4">
                      <input
                        ref={imageInputRef}
                        type="file"
                        id="image-upload"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                      
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => imageInputRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center gap-2"
                      >
                        {uploading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                        Upload Image
                      </Button>
                      
                      <p className="text-sm text-muted-foreground">
                        Upload an image for your offer (JPG, PNG, GIF)
                      </p>
                    </div>
                    
                    {imagePreview && (
                      <div className="mt-2 border rounded-md p-2 max-w-xs">
                        <img 
                          src={imagePreview} 
                          alt="Offer preview" 
                          className="max-h-40 object-contain"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-2">
              <Button type="button" onClick={handleNextTab}>
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="commission" className="space-y-4 mt-4">
            <Card>
              <CardContent className="pt-6">
                <div className="grid gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="commission_type">Commission Type</Label>
                      <Select
                        onValueChange={(value) => setValue('commission_type', value)}
                        defaultValue={getValues('commission_type')}
                      >
                        <SelectTrigger id="commission_type">
                          <SelectValue placeholder="Select commission type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CPA">CPA (Cost Per Action)</SelectItem>
                          <SelectItem value="CPL">CPL (Cost Per Lead)</SelectItem>
                          <SelectItem value="CPS">CPS (Cost Per Sale)</SelectItem>
                          <SelectItem value="RevShare">Revenue Share</SelectItem>
                          <SelectItem value="CPC">CPC (Cost Per Click)</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.commission_type && (
                        <p className="text-red-500 text-sm">{errors.commission_type.message}</p>
                      )}
                    </div>

                    {!geoCommissionsEnabled && commissionType !== 'RevShare' ? (
                      <div className="space-y-2">
                        <Label htmlFor="commission_amount">Commission Amount ($)</Label>
                        <Input
                          id="commission_amount"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          {...register('commission_amount')}
                        />
                      </div>
                    ) : !geoCommissionsEnabled && commissionType === 'RevShare' ? (
                      <div className="space-y-2">
                        <Label htmlFor="commission_percent">Commission Percentage (%)</Label>
                        <Input
                          id="commission_percent"
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          placeholder="0"
                          {...register('commission_percent')}
                        />
                      </div>
                    ) : null}
                  </div>
                  
                  <div className="space-y-4">
                    <GeoCommissionSelector 
                      geoCommissions={geoCommissions}
                      onChange={handleGeoCommissionsChange}
                      onGeoTargetsUpdate={handleGeoTargetsUpdate}
                      enabled={geoCommissionsEnabled}
                      onEnabledChange={handleGeoCommissionsEnabledChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="conversion_requirements">Conversion Requirements</Label>
                    <Textarea
                      id="conversion_requirements"
                      placeholder="What is required for a conversion to be valid?"
                      className="min-h-[80px]"
                      {...register('conversion_requirements')}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between space-x-2">
              <Button type="button" variant="outline" onClick={handlePrevTab}>
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>
              <Button type="button" onClick={handleNextTab}>
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="targeting" className="space-y-4 mt-4">
            <Card>
              <CardContent className="pt-6">
                <div className="grid gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="traffic_sources">Allowed Traffic Sources</Label>
                    <TagInput
                      placeholder="Add a traffic source and press Enter (e.g. Facebook, Google)"
                      tags={watch('allowed_traffic_sources') || []}
                      onTagsChange={handleTrafficSourcesChange}
                      suggestions={['Facebook', 'Google', 'Instagram', 'TikTok', 'Native Ads', 'Push', 'Email', 'SEO']}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="geo_targets">Geographic Targeting (Allowed)</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      {watch('geo_targets')?.length 
                        ? 'These countries are automatically selected from your GEO pricing settings.'
                        : 'Add countries where this offer is available'}
                    </p>
                    {watch('geo_targets')?.length === 0 && (
                      <TagInput
                        placeholder="Add country codes and press Enter (e.g. US, UK, CA)"
                        tags={watch('geo_targets') || []}
                        onTagsChange={(value) => setValue('geo_targets', value)}
                        suggestions={['US', 'UK', 'CA', 'AU', 'DE', 'FR', 'ES', 'IT', 'JP']}
                      />
                    )}
                    
                    {watch('geo_targets')?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {watch('geo_targets')?.map((country) => (
                          <Badge key={country} variant="outline">
                            {country}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="restricted_geos">Geographic Restrictions (Blocked)</Label>
                    <TagInput
                      placeholder="Add restricted country codes (e.g. CN, RU)"
                      tags={watch('restricted_geos') || []}
                      onTagsChange={handleRestrictedGeosChange}
                      suggestions={['CN', 'RU', 'IR', 'KP', 'CU', 'VE', 'MM']}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="restrictions">Additional Restrictions</Label>
                    <Textarea
                      id="restrictions"
                      placeholder="Any other restrictions or compliance requirements"
                      className="min-h-[80px]"
                      {...register('restrictions')}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between space-x-2">
              <Button type="button" variant="outline" onClick={handlePrevTab}>
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>
              <Button type="button" onClick={handleNextTab}>
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="creatives" className="space-y-4 mt-4">
            <CreativesTab 
              advertiserId={user?.id || ''}
              savedCreatives={creatives} 
              onCreativesChange={handleCreativesChange}
            />
            
            <div className="flex justify-between space-x-2">
              <Button type="button" variant="outline" onClick={handlePrevTab}>
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>
              <Button type="button" onClick={handleNextTab}>
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="tracking" className="space-y-4 mt-4">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium">Tracking Setup</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Your offer will have unique tracking links for each affiliate
                    </p>

                    <div className="space-y-4">
                      <div className="p-4 border rounded-md bg-muted">
                        <p className="text-sm font-medium mb-1">Sample Tracking Link Format:</p>
                        <code className="text-xs bg-background p-2 rounded block">
                          https://afftools.up.railway.app/click/[tracking_code]
                        </code>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <p className="text-sm">
                            Automatic click tracking for all affiliate traffic
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <p className="text-sm">
                            Conversion postback URL for server-to-server tracking
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <p className="text-sm">
                            Detailed reporting on clicks, conversions, and revenue
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      After creating the offer, you can configure advanced tracking options
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between space-x-2">
              <Button type="button" variant="outline" onClick={handlePrevTab}>
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>
              <Button type="submit" disabled={isSubmitting} className="ml-auto">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Offer'
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </form>
    </div>
  );
};

export default CreateOffer;
