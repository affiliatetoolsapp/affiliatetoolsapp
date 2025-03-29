import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase, debugCreateOffer } from '@/integrations/supabase/client';
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
  Loader2,
  Trash2,
  X,
  Copy,
  Plus,
  FileText,
  DollarSign,
  Target,
  Images,
  LineChart,
  Link,
  Store,
  Globe2,
  Users,
  FileEdit,
  BadgeCheck,
  PenSquare,
  Coins,
  Calendar,
  GanttChartSquare,
  ScrollText,
  Percent,
  Clock,
  MapPin,
  Ban,
  ShieldAlert,
  Share2,
  AlertCircle
} from 'lucide-react';
import GeoCommissionSelector from './GeoCommissionSelector';
import CreativesTab from './CreativesTab';
import { OfferPreviewDialog } from './OfferPreviewDialog';
import { Offer } from '@/types';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { generatePostbackUrl } from '@/lib/postback';

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
  payout_frequency: z.string().min(1, 'Please select a payout frequency'),
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

const PREDEFINED_PARAMETERS = [
  { key: 'payout', description: 'Conversion/sale payout amount' },
  { key: 'transaction_id', description: 'Unique transaction identifier' },
  { key: 'amount', description: 'Transaction amount' },
  { key: 'currency', description: 'Transaction currency' },
  { key: 'customer_id', description: 'Customer identifier' },
  { key: 'product_id', description: 'Product identifier' },
  { key: 'campaign_id', description: 'Campaign identifier' },
  { key: 'source', description: 'Traffic source' },
  { key: 'sub1', description: 'Custom sub-affiliate parameter 1' },
  { key: 'sub2', description: 'Custom sub-affiliate parameter 2' },
  { key: 'sub3', description: 'Custom sub-affiliate parameter 3' },
];

// Add the base URL constant at the top with other imports
const POSTBACK_BASE_URL = 'https://jruzfpymzkzegdhmzwsr.supabase.co/functions/v1/postback';

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
  const [showPreview, setShowPreview] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [customParams, setCustomParams] = useState<{ [key: string]: string }>({});
  const [newParamKey, setNewParamKey] = useState('');
  const [newParamValue, setNewParamValue] = useState('');
  
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
      payout_frequency: 'Monthly',
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
  
  // Handle image upload for offer image with drag and drop
  const handleImageUpload = async (file: File) => {
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

  // Handle drag over event for image upload
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-primary', 'bg-primary/10');
  };

  // Handle drag leave event for image upload
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-primary', 'bg-primary/10');
  };

  // Handle drop event for image upload
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-primary', 'bg-primary/10');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file);
    }
  };

  // Handle input change for image upload
  const handleImageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  // Remove uploaded image
  const handleRemoveImage = async () => {
    const imagePath = imagePreview?.split('/').slice(-2).join('/');
    if (imagePath && user) {
      try {
        const { error } = await supabase.storage
          .from('offer-assets')
          .remove([`${user.id}/offer-images/${imagePath.split('/').pop()}`]);
        
        if (error) {
          console.error('Error removing image:', error);
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to remove image',
          });
          return;
        }
        
        setValue('offer_image', '');
        setImagePreview(null);
        toast({
          title: 'Image Removed',
          description: 'Offer image has been removed',
        });
      } catch (error) {
        console.error('Error removing image:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'An unexpected error occurred',
        });
      }
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
  
  // Handle direct geo targets changes when not using geo commissions
  const handleGeoTargetsChange = useCallback(
    (value: string[]) => {
      setValue('geo_targets', value);
    },
    [setValue]
  );
  
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

  // Add helper function to get tab name
  const getTabName = (tab: string): string => {
    switch (tab) {
      case 'basic':
        return 'Basic Info';
      case 'commission':
        return 'Commission';
      case 'targeting':
        return 'Targeting';
      case 'creatives':
        return 'Creatives';
      case 'tracking':
        return 'Tracking';
      default:
        return tab;
    }
  };

  // Add helper function to get field name
  const getFieldName = (field: string): string => {
    switch (field) {
      case 'name':
        return 'Offer Name';
      case 'description':
        return 'Offer Description';
      case 'url':
        return 'Offer URL';
      case 'niche':
        return 'Niche/Category';
      case 'commission_type':
        return 'Commission Type';
      case 'payout_frequency':
        return 'Payout Frequency';
      default:
        return field.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
  };

  // Add function to check which tab contains a field
  const getFieldTab = (field: string): string => {
    const tabFields: { [key: string]: string[] } = {
      basic: ['name', 'description', 'url', 'niche', 'target_audience', 'offer_image'],
      commission: ['commission_type', 'commission_amount', 'commission_percent', 'payout_frequency', 'conversion_requirements'],
      targeting: ['allowed_traffic_sources', 'geo_targets', 'restricted_geos', 'restrictions'],
      creatives: [],
      tracking: []
    };

    for (const [tab, fields] of Object.entries(tabFields)) {
      if (fields.includes(field)) {
        return tab;
      }
    }
    return 'basic';
  };

  // Update the form submission handler
  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Trigger validation on all fields
    const result = await form.trigger();
    
    // Check for validation errors
    const errors = form.formState.errors;
    if (!result || Object.keys(errors).length > 0) {
      // Group errors by tab
      const errorsByTab = Object.entries(errors).reduce((acc: { [key: string]: string[] }, [field, error]) => {
        const tab = getFieldTab(field);
        if (!acc[tab]) {
          acc[tab] = [];
        }
        if (error?.message) {
          acc[tab].push(`${getFieldName(field)}: ${error.message}`);
        }
        return acc;
      }, {});

      // Create error message
      const errorMessage = Object.entries(errorsByTab)
        .map(([tab, tabErrors]) => (
          `${getTabName(tab)}:\n${tabErrors.map(err => `• ${err}`).join('\n')}`
        ))
        .join('\n\n');

      // Show error toast
      toast({
        variant: 'destructive',
        title: 'Please Fix the Following Errors',
        description: (
          <div className="mt-2 space-y-2 max-h-[300px] overflow-y-auto">
            <pre className="text-[11px] whitespace-pre-wrap bg-secondary/50 p-2 rounded">
              {errorMessage}
            </pre>
          </div>
        ),
        duration: 10000, // Show for 10 seconds
      });

      // Navigate to the first tab with an error
      const firstErrorTab = Object.keys(errorsByTab)[0];
      if (firstErrorTab && firstErrorTab !== activeTab) {
        setActiveTab(firstErrorTab);
      }

      return;
    }

    // If no errors, proceed with showing preview
    setShowPreview(true);
  };

  // Update the final submit handler
  const handleFinalSubmit = async () => {
    if (!user) return;

    // Check for validation errors again before final submit
    const isValid = await form.trigger();
    if (!isValid) {
      const fakeEvent = { preventDefault: () => {} } as React.FormEvent<HTMLFormElement>;
      await handleFormSubmit(fakeEvent);
      return;
    }

    setIsSubmitting(true);
    const data = getValues();
    console.log("Form submission started with data:", data);
    console.log("Geo commissions enabled:", geoCommissionsEnabled);
    console.log("Geo commissions data:", geoCommissions);

    try {
      // Prepare the offer data with proper typing
      const offerData = {
        name: data.name,
        description: data.description,
        url: data.url,
        niche: data.niche || null,
        target_audience: data.target_audience || null,
        conversion_requirements: data.conversion_requirements || null,
        restrictions: data.restrictions || null,
        commission_type: data.commission_type,
        status: data.status || 'active',
        allowed_traffic_sources: data.allowed_traffic_sources || [],
        geo_targets: data.geo_targets || [], // Ensure geo_targets is always an array
        restricted_geos: data.restricted_geos || [],
        offer_image: data.offer_image || null,
        advertiser_id: user.id,
        geo_commissions: geoCommissionsEnabled && geoCommissions.length > 0 ? geoCommissions : null,
        marketing_materials: creatives.length > 0 ? creatives : null,
        // Commission fields based on type and geo settings
        commission_amount: !geoCommissionsEnabled && data.commission_amount ? parseFloat(data.commission_amount) : null,
        commission_percent: !geoCommissionsEnabled && data.commission_percent ? parseFloat(data.commission_percent) : null,
        payout_frequency: data.payout_frequency,
      };

      console.log("Prepared offer data:", offerData);

      // Use the debug helper to create the offer
      const result = await debugCreateOffer(offerData);
      
      if (!result.success) {
        throw result.error;
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
      setShowPreview(false);
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

  // Prepare offer data for preview
  const getOfferPreviewData = (): Partial<Offer> => {
    const formValues = getValues();
    return {
      name: formValues.name,
      description: formValues.description,
      niche: formValues.niche,
      commission_type: formValues.commission_type as any,
      commission_amount: formValues.commission_amount ? parseFloat(formValues.commission_amount) : undefined,
      commission_percent: formValues.commission_percent ? parseFloat(formValues.commission_percent) : undefined,
      geo_targets: formValues.geo_targets,
      offer_image: formValues.offer_image,
      is_featured: false,
      status: formValues.status as any,
    };
  };

  // Update the generateUrlWithParams function
  const generateUrlWithParams = (baseUrl: string) => {
    const params: string[] = [];
    
    // Add required params first
    params.push(`click_id={click_id}`);
    params.push(`type={type}`);
    params.push(`payout={payout}`);
    
    // Add custom params
    Object.entries(customParams).forEach(([key, value]) => {
      params.push(`${key}={${value}}`);
    });
    
    const queryString = params.join('&');
    return `${baseUrl}${queryString ? `?${queryString}` : ''}`;
  };

  // Add handler for adding new params
  const handleAddParam = () => {
    if (newParamKey && newParamValue) {
      setCustomParams(prev => ({
        ...prev,
        [newParamKey]: newParamValue
      }));
      setNewParamKey('');
      setNewParamValue('');
    }
  };

  // Add handler for removing params
  const handleRemoveParam = (key: string) => {
    setCustomParams(prev => {
      const newParams = { ...prev };
      delete newParams[key];
      return newParams;
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <PenSquare className="h-5 w-5" />
          <h2 className="text-2xl font-bold tracking-tight">Create New Offer</h2>
        </div>
        <p className="text-muted-foreground ml-7">
          Create a new affiliate offer to promote your product or service
        </p>
      </div>

      <form onSubmit={handleFormSubmit}>
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Basic Info
            </TabsTrigger>
            <TabsTrigger value="commission" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Commission
            </TabsTrigger>
            <TabsTrigger value="targeting" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Targeting
            </TabsTrigger>
            <TabsTrigger value="creatives" className="flex items-center gap-2">
              <Images className="h-4 w-4" />
              Creatives
            </TabsTrigger>
            <TabsTrigger value="tracking" className="flex items-center gap-2">
              <LineChart className="h-4 w-4" />
              Tracking
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 mt-4">
            <Card>
              <CardContent className="pt-6">
                <div className="grid gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="flex items-center gap-2">
                        <FileEdit className="h-4 w-4" />
                        Offer Name
                      </Label>
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
                      <Label htmlFor="niche" className="flex items-center gap-2">
                        <Store className="h-4 w-4" />
                        Niche/Category
                      </Label>
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
                      <Label htmlFor="url" className="flex items-center gap-2">
                        <Link className="h-4 w-4" />
                        Offer URL
                      </Label>
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
                      <Label htmlFor="status" className="flex items-center gap-2">
                        <BadgeCheck className="h-4 w-4" />
                        Offer Status
                      </Label>
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
                    <Label htmlFor="description" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Offer Description
                    </Label>
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
                    <Label htmlFor="target_audience" className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Target Audience
                    </Label>
                    <Textarea
                      id="target_audience"
                      placeholder="Describe the ideal customer for this offer"
                      className="min-h-[80px]"
                      {...register('target_audience')}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="offer_image" className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Offer Image
                    </Label>
                    <input
                      ref={imageInputRef}
                      type="file"
                      id="image-upload"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageInputChange}
                    />
                    
                    {imagePreview ? (
                      <div className="mt-2 border rounded-md p-3 relative">
                        <img 
                          src={imagePreview} 
                          alt="Offer preview" 
                          className="max-h-48 object-contain mx-auto"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={handleRemoveImage}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div 
                        className="border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors"
                        onClick={() => imageInputRef.current?.click()}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                      >
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                          <p className="text-sm font-medium">
                            Click or drag and drop to upload an image
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Supported formats: JPG, PNG, GIF (max 5MB)
                          </p>
                          {uploading && (
                            <div className="flex items-center gap-2 mt-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span className="text-sm">Uploading...</span>
                            </div>
                          )}
                        </div>
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
                      <Label htmlFor="commission_type" className="flex items-center gap-2">
                        <Coins className="h-4 w-4" />
                        Commission Type
                      </Label>
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
                        <Label htmlFor="commission_amount" className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Commission Amount ($)
                        </Label>
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
                        <Label htmlFor="commission_percent" className="flex items-center gap-2">
                          <Percent className="h-4 w-4" />
                          Commission Percentage (%)
                        </Label>
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

                    <div className="space-y-2">
                      <Label htmlFor="payout_frequency" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Payout Frequency
                      </Label>
                      <Select
                        onValueChange={(value) => setValue('payout_frequency', value)}
                        defaultValue={getValues('payout_frequency')}
                      >
                        <SelectTrigger id="payout_frequency">
                          <SelectValue placeholder="Select payout frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Weekly">Weekly</SelectItem>
                          <SelectItem value="Biweekly">Bi-weekly</SelectItem>
                          <SelectItem value="Monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.payout_frequency && (
                        <p className="text-red-500 text-sm">{errors.payout_frequency.message}</p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        How often affiliates will receive payouts for this offer
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <Label className="flex items-center gap-2">
                      <GanttChartSquare className="h-4 w-4" />
                      Commission Structure
                    </Label>
                    <GeoCommissionSelector 
                      geoCommissions={geoCommissions}
                      onChange={handleGeoCommissionsChange}
                      onGeoTargetsUpdate={handleGeoTargetsUpdate}
                      enabled={geoCommissionsEnabled}
                      onEnabledChange={handleGeoCommissionsEnabledChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="conversion_requirements" className="flex items-center gap-2">
                      <ScrollText className="h-4 w-4" />
                      Conversion Requirements
                    </Label>
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
                    <Label htmlFor="traffic_sources" className="flex items-center gap-2">
                      <Share2 className="h-4 w-4" />
                      Allowed Traffic Sources
                    </Label>
                    <TagInput
                      placeholder="Add a traffic source and press Enter (e.g. Facebook, Google)"
                      tags={watch('allowed_traffic_sources') || []}
                      onTagsChange={handleTrafficSourcesChange}
                      suggestions={['Facebook', 'Google', 'Instagram', 'TikTok', 'Native Ads', 'Push', 'Email', 'SEO']}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="geo_targets" className="flex items-center gap-2">
                      <Globe2 className="h-4 w-4" />
                      Geographic Targeting (Allowed)
                    </Label>
                    {geoCommissionsEnabled ? (
                      <>
                        <p className="text-sm text-muted-foreground mb-2">
                          {watch('geo_targets')?.length 
                            ? 'These countries are automatically selected from your GEO pricing settings.'
                            : 'Add countries in the commission tab to enable geo targeting'}
                        </p>
                        {watch('geo_targets')?.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {watch('geo_targets')?.map((country) => (
                              <Badge key={country} variant="outline">
                                {country}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <TagInput
                        placeholder="Add country codes and press Enter (e.g. US, UK, CA)"
                        tags={watch('geo_targets') || []}
                        onTagsChange={handleGeoTargetsChange}
                        suggestions={['US', 'UK', 'CA', 'AU', 'DE', 'FR', 'ES', 'IT', 'JP']}
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="restricted_geos" className="flex items-center gap-2">
                      <Ban className="h-4 w-4" />
                      Geographic Restrictions (Blocked)
                    </Label>
                    <TagInput
                      placeholder="Add restricted country codes (e.g. CN, RU)"
                      tags={watch('restricted_geos') || []}
                      onTagsChange={handleRestrictedGeosChange}
                      suggestions={['CN', 'RU', 'IR', 'KP', 'CU', 'VE', 'MM']}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="restrictions" className="flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4" />
                      Additional Restrictions
                    </Label>
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
                      Configure your postback URL and custom parameters
                    </p>

                    <div className="space-y-4">
                      <div className="p-4 border rounded-md bg-muted">
                        <p className="text-sm font-medium mb-2">Global Postback URL:</p>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-background p-2 rounded flex-1">
                            {generateUrlWithParams(POSTBACK_BASE_URL)}
                          </code>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(
                                generateUrlWithParams(POSTBACK_BASE_URL)
                              );
                              toast({
                                title: "Copied!",
                                description: "Postback URL copied to clipboard",
                              });
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <Collapsible className="w-full">
                        <div className="p-4 border rounded-md bg-muted">
                          <CollapsibleTrigger className="flex items-center justify-between w-full">
                            <div>
                              <p className="text-sm font-medium">Custom Parameters</p>
                              <p className="text-xs text-muted-foreground">
                                Add optional parameters to your postback URLs
                              </p>
                            </div>
                            <ChevronRight className="h-4 w-4 transform transition-transform duration-200" />
                          </CollapsibleTrigger>

                          <CollapsibleContent className="space-y-4 mt-4">
                            <div className="space-y-2">
                              <div className="flex gap-2">
                                <Select
                                  value={newParamKey}
                                  onValueChange={setNewParamKey}
                                >
                                  <SelectTrigger className="flex-1">
                                    <SelectValue placeholder="Select parameter" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {PREDEFINED_PARAMETERS.map((param) => (
                                      <SelectItem key={param.key} value={param.key}>
                                        <div>
                                          <p className="font-medium">{param.key}</p>
                                          <p className="text-xs text-muted-foreground">{param.description}</p>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Input
                                  placeholder="Variable name"
                                  value={newParamValue}
                                  onChange={(e) => setNewParamValue(e.target.value)}
                                  className="flex-1"
                                />
                                <Button
                                  type="button"
                                  variant="secondary"
                                  onClick={handleAddParam}
                                  disabled={!newParamKey || !newParamValue}
                                >
                                  Add
                                </Button>
                              </div>
                            </div>

                            {Object.entries(customParams).length > 0 && (
                              <div>
                                <p className="text-sm font-medium mb-2">Added Parameters:</p>
                                <div className="space-y-2">
                                  {Object.entries(customParams).map(([key, value]) => (
                                    <div key={key} className="flex items-center gap-2 bg-background p-2 rounded">
                                      <div className="flex-1">
                                        <p className="text-sm font-medium">{key}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {PREDEFINED_PARAMETERS.find(p => p.key === key)?.description}
                                        </p>
                                      </div>
                                      <code className="text-xs bg-muted px-2 py-1 rounded">
                                        {`{${value}}`}
                                      </code>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRemoveParam(key)}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </CollapsibleContent>
                        </div>
                      </Collapsible>

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
              <Button type="submit" disabled={isSubmitting}>
                Create Offer
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </form>

      <OfferPreviewDialog
        open={showPreview}
        onOpenChange={setShowPreview}
        offer={getOfferPreviewData()}
        onConfirm={handleFinalSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default CreateOffer;
