
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { TagInput } from '@/components/ui/tag-input';
import { GlobeIcon, DollarSignIcon, ShieldIcon, TagIcon, UsersIcon } from 'lucide-react';

export default function CreateOffer() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    url: '',
    commission_type: 'CPA',
    commission_amount: '',
    commission_percent: '',
    niche: '',
    is_featured: false,
    geo_targets: [] as string[],
    restricted_geos: [] as string[],
    allowed_traffic_sources: [] as string[],
    target_audience: '',
    restrictions: '',
    conversion_requirements: '',
    conversion_cap_daily: '',
    click_cap_daily: '',
    budget_cap_daily: '',
    conversion_cap_monthly: '',
    click_cap_monthly: '',
    budget_cap_monthly: '',
    payout_terms: 'net30',
    tracking_method: 'postback',
    postback_url: '',
    required_affiliate_approval: true
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTab, setCurrentTab] = useState('basic');
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    try {
      setIsSubmitting(true);
      
      const payload = {
        advertiser_id: user.id,
        name: formData.name,
        description: formData.description,
        url: formData.url,
        commission_type: formData.commission_type,
        commission_amount: formData.commission_type !== 'RevShare' ? parseFloat(formData.commission_amount) : null,
        commission_percent: formData.commission_type === 'RevShare' ? parseFloat(formData.commission_percent) : null,
        niche: formData.niche,
        is_featured: formData.is_featured,
        geo_targets: formData.geo_targets.length > 0 ? formData.geo_targets : null,
        restricted_geos: formData.restricted_geos.length > 0 ? formData.restricted_geos : null,
        allowed_traffic_sources: formData.allowed_traffic_sources.length > 0 ? formData.allowed_traffic_sources : null,
        target_audience: formData.target_audience || null,
        restrictions: formData.restrictions || null,
        conversion_requirements: formData.conversion_requirements || null,
        status: 'active'
      };
      
      const { data, error } = await supabase
        .from('offers')
        .insert(payload)
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: 'Offer Created',
        description: 'Your offer has been created successfully.',
      });
      
      navigate(`/offers/${data.id}`);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create offer',
      });
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const isRevShare = formData.commission_type === 'RevShare';
  
  // Common traffic sources
  const trafficSources = [
    'Search Engine Optimization (SEO)',
    'Pay-Per-Click (PPC)',
    'Social Media (Organic)',
    'Social Media (Paid)',
    'Email Marketing',
    'Content Marketing',
    'Influencer Marketing',
    'Affiliate Marketing',
    'Mobile Apps',
    'Push Notifications',
    'Native Advertising',
    'Video Marketing',
    'Display Advertising',
    'Contextual Advertising',
    'Retargeting/Remarketing',
    'Direct Mail',
    'SMS Marketing',
    'Outdoor Advertising',
    'Television Advertising',
    'Radio Advertising',
    'Podcast Advertising',
    'Webinars & Online Events',
    'In-app Advertising',
    'Forum Marketing',
    'Review Sites',
    'Comparison Sites',
    'Coupon Sites',
    'Loyalty Programs'
  ];
  
  // Common geos
  const popularGeos = [
    'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany', 'France', 'Italy', 'Spain', 
    'Netherlands', 'Belgium', 'Sweden', 'Norway', 'Denmark', 'Finland', 'Japan', 'South Korea', 
    'Singapore', 'Brazil', 'Mexico', 'India', 'China', 'Russia', 'South Africa', 'United Arab Emirates',
    'Saudi Arabia', 'Israel', 'New Zealand', 'Ireland', 'Poland', 'Austria', 'Switzerland', 'Portugal',
    'Greece', 'Turkey', 'Argentina', 'Chile', 'Colombia', 'Peru', 'Thailand', 'Vietnam', 'Philippines',
    'Malaysia', 'Indonesia', 'Taiwan', 'Hong Kong', 'Egypt', 'Nigeria', 'Kenya', 'Morocco', 'Qatar'
  ];
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Create New Offer</h1>
        <p className="text-muted-foreground">
          Set up a new affiliate offer for promotion
        </p>
      </div>
      
      <form onSubmit={handleSubmit}>
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="mb-6">
          <TabsList className="grid grid-cols-4 mb-8">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="commission">Commission</TabsTrigger>
            <TabsTrigger value="targeting">Targeting</TabsTrigger>
            <TabsTrigger value="tracking">Tracking</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle>Offer Details</CardTitle>
                <CardDescription>
                  Enter the basic details of your affiliate offer
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="grid gap-3">
                  <Label htmlFor="name">Offer Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Premium Subscription"
                    required
                  />
                </div>
                
                <div className="grid gap-3">
                  <Label htmlFor="url">Destination URL *</Label>
                  <Input
                    id="url"
                    name="url"
                    type="url"
                    value={formData.url}
                    onChange={handleInputChange}
                    placeholder="https://yourdomain.com/offer"
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Where affiliates will send traffic (we'll append tracking parameters)
                  </p>
                </div>
                
                <div className="grid gap-3">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe your offer to potential affiliates"
                    rows={4}
                  />
                </div>
                
                <div className="grid gap-3">
                  <Label htmlFor="niche">Niche/Category</Label>
                  <Input
                    id="niche"
                    name="niche"
                    value={formData.niche}
                    onChange={handleInputChange}
                    placeholder="e.g., Health, Finance, Technology"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch
                    id="featured"
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => handleSwitchChange('is_featured', checked)}
                  />
                  <Label htmlFor="featured">Featured Offer</Label>
                  <p className="ml-2 text-sm text-muted-foreground">
                    Featured offers appear at the top of the marketplace
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch
                    id="affiliate_approval"
                    checked={formData.required_affiliate_approval}
                    onCheckedChange={(checked) => handleSwitchChange('required_affiliate_approval', checked)}
                  />
                  <Label htmlFor="affiliate_approval">Require Affiliate Approval</Label>
                  <p className="ml-2 text-sm text-muted-foreground">
                    Affiliates must be approved before they can promote this offer
                  </p>
                </div>
                
                <div className="grid gap-3">
                  <Label htmlFor="target_audience">Target Audience</Label>
                  <Textarea
                    id="target_audience"
                    name="target_audience"
                    value={formData.target_audience}
                    onChange={handleInputChange}
                    placeholder="Describe your ideal customer for this offer"
                    rows={2}
                  />
                </div>
                
                <div className="grid gap-3">
                  <Label htmlFor="restrictions">Restrictions & Rules</Label>
                  <Textarea
                    id="restrictions"
                    name="restrictions"
                    value={formData.restrictions}
                    onChange={handleInputChange}
                    placeholder="Any specific rules affiliates must follow"
                    rows={2}
                  />
                </div>
                
                <div className="grid gap-3">
                  <Label htmlFor="conversion_requirements">Conversion Requirements</Label>
                  <Textarea
                    id="conversion_requirements"
                    name="conversion_requirements"
                    value={formData.conversion_requirements}
                    onChange={handleInputChange}
                    placeholder="What constitutes a conversion for this offer"
                    rows={2}
                  />
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => navigate('/offers')}>
                  Cancel
                </Button>
                <Button type="button" onClick={() => setCurrentTab('commission')}>
                  Next: Commission
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="commission">
            <Card>
              <CardHeader>
                <CardTitle>Commission Structure</CardTitle>
                <CardDescription>
                  Set how much you'll pay affiliates and under what terms
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="grid gap-3">
                  <Label htmlFor="commission_type">Commission Type *</Label>
                  <Select
                    value={formData.commission_type}
                    onValueChange={(value) => handleSelectChange('commission_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select commission type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CPC">CPC (Cost Per Click)</SelectItem>
                      <SelectItem value="CPL">CPL (Cost Per Lead)</SelectItem>
                      <SelectItem value="CPA">CPA (Cost Per Action)</SelectItem>
                      <SelectItem value="CPS">CPS (Cost Per Sale)</SelectItem>
                      <SelectItem value="RevShare">Revenue Share (%)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    The commission model determines how affiliates get paid
                  </p>
                </div>
                
                {isRevShare ? (
                  <div className="grid gap-3">
                    <Label htmlFor="commission_percent">Commission Percentage *</Label>
                    <div className="relative">
                      <Input
                        id="commission_percent"
                        name="commission_percent"
                        type="number"
                        value={formData.commission_percent}
                        onChange={handleInputChange}
                        placeholder="e.g., 20"
                        min="0"
                        max="100"
                        step="0.01"
                        required
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        %
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Percentage of revenue shared with affiliates
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    <Label htmlFor="commission_amount">Commission Amount *</Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        $
                      </div>
                      <Input
                        id="commission_amount"
                        name="commission_amount"
                        type="number"
                        value={formData.commission_amount}
                        onChange={handleInputChange}
                        className="pl-7"
                        placeholder="e.g., 10.00"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formData.commission_type === 'CPC' && 'Amount paid per click'}
                      {formData.commission_type === 'CPL' && 'Amount paid per lead generated'}
                      {formData.commission_type === 'CPA' && 'Amount paid per completed action'}
                      {formData.commission_type === 'CPS' && 'Amount paid per sale'}
                    </p>
                  </div>
                )}
                
                <Separator className="my-4" />
                
                <div className="grid gap-3">
                  <Label htmlFor="payout_terms">Payout Terms</Label>
                  <Select
                    value={formData.payout_terms}
                    onValueChange={(value) => handleSelectChange('payout_terms', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payout terms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="net15">Net 15 (Paid 15 days after month end)</SelectItem>
                      <SelectItem value="net30">Net 30 (Paid 30 days after month end)</SelectItem>
                      <SelectItem value="net60">Net 60 (Paid 60 days after month end)</SelectItem>
                      <SelectItem value="weekly">Weekly (Every Friday)</SelectItem>
                      <SelectItem value="biweekly">Bi-Weekly (Every other Friday)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label>Daily Caps</Label>
                    <div className="space-y-3">
                      <div className="grid gap-2">
                        <Label htmlFor="conversion_cap_daily" className="text-sm">Conversion Cap (Daily)</Label>
                        <Input
                          id="conversion_cap_daily"
                          name="conversion_cap_daily"
                          type="number"
                          value={formData.conversion_cap_daily}
                          onChange={handleInputChange}
                          placeholder="e.g., 100"
                          min="0"
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="click_cap_daily" className="text-sm">Click Cap (Daily)</Label>
                        <Input
                          id="click_cap_daily"
                          name="click_cap_daily"
                          type="number"
                          value={formData.click_cap_daily}
                          onChange={handleInputChange}
                          placeholder="e.g., 1000"
                          min="0"
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="budget_cap_daily" className="text-sm">Budget Cap (Daily)</Label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            $
                          </div>
                          <Input
                            id="budget_cap_daily"
                            name="budget_cap_daily"
                            type="number"
                            value={formData.budget_cap_daily}
                            onChange={handleInputChange}
                            placeholder="e.g., 500"
                            className="pl-7"
                            min="0"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <Label>Monthly Caps</Label>
                    <div className="space-y-3">
                      <div className="grid gap-2">
                        <Label htmlFor="conversion_cap_monthly" className="text-sm">Conversion Cap (Monthly)</Label>
                        <Input
                          id="conversion_cap_monthly"
                          name="conversion_cap_monthly"
                          type="number"
                          value={formData.conversion_cap_monthly}
                          onChange={handleInputChange}
                          placeholder="e.g., 3000"
                          min="0"
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="click_cap_monthly" className="text-sm">Click Cap (Monthly)</Label>
                        <Input
                          id="click_cap_monthly"
                          name="click_cap_monthly"
                          type="number"
                          value={formData.click_cap_monthly}
                          onChange={handleInputChange}
                          placeholder="e.g., 30000"
                          min="0"
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="budget_cap_monthly" className="text-sm">Budget Cap (Monthly)</Label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            $
                          </div>
                          <Input
                            id="budget_cap_monthly"
                            name="budget_cap_monthly"
                            type="number"
                            value={formData.budget_cap_monthly}
                            onChange={handleInputChange}
                            placeholder="e.g., 15000"
                            className="pl-7"
                            min="0"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => setCurrentTab('basic')}>
                  Back
                </Button>
                <Button type="button" onClick={() => setCurrentTab('targeting')}>
                  Next: Targeting
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="targeting">
            <Card>
              <CardHeader>
                <CardTitle>Geographic & Traffic Targeting</CardTitle>
                <CardDescription>
                  Set where your offer should run and what traffic sources are allowed
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <Label>Geographic Targeting (Allowed)</Label>
                  <TagInput
                    placeholder="Add allowed locations"
                    tags={formData.geo_targets}
                    suggestions={popularGeos}
                    onTagsChange={(newTags) => setFormData(prev => ({ ...prev, geo_targets: newTags }))}
                    variant="default"
                  />
                  <p className="text-sm text-muted-foreground">
                    Select the countries where this offer should be promoted
                  </p>
                </div>
                
                <div className="grid gap-4">
                  <Label>Geographic Restrictions (Blocked)</Label>
                  <TagInput
                    placeholder="Add restricted locations"
                    tags={formData.restricted_geos}
                    suggestions={popularGeos}
                    onTagsChange={(newTags) => setFormData(prev => ({ ...prev, restricted_geos: newTags }))}
                    variant="negative"
                  />
                  <p className="text-sm text-muted-foreground">
                    Select the countries where this offer should NOT be promoted
                  </p>
                </div>
                
                <div className="grid gap-4">
                  <Label>Allowed Traffic Sources</Label>
                  <TagInput
                    placeholder="Add traffic sources"
                    tags={formData.allowed_traffic_sources}
                    suggestions={trafficSources}
                    onTagsChange={(newTags) => setFormData(prev => ({ ...prev, allowed_traffic_sources: newTags }))}
                  />
                  <p className="text-sm text-muted-foreground">
                    Select the traffic sources that are allowed for this offer
                  </p>
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => setCurrentTab('commission')}>
                  Back
                </Button>
                <Button type="button" onClick={() => setCurrentTab('tracking')}>
                  Next: Tracking
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="tracking">
            <Card>
              <CardHeader>
                <CardTitle>Conversion Tracking Setup</CardTitle>
                <CardDescription>
                  Configure how conversions will be tracked and reported
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="grid gap-3">
                  <Label htmlFor="tracking_method">Tracking Method</Label>
                  <Select
                    value={formData.tracking_method}
                    onValueChange={(value) => handleSelectChange('tracking_method', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select tracking method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="postback">Postback URL</SelectItem>
                      <SelectItem value="pixel">Tracking Pixel</SelectItem>
                      <SelectItem value="api">API Integration</SelectItem>
                      <SelectItem value="s2s">Server-to-Server</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {formData.tracking_method === 'postback' && (
                  <div className="grid gap-3">
                    <Label htmlFor="postback_url">Your Postback URL (Optional)</Label>
                    <Input
                      id="postback_url"
                      name="postback_url"
                      value={formData.postback_url}
                      onChange={handleInputChange}
                      placeholder="https://yourdomain.com/conversion?clickId={clickId}"
                    />
                    <div className="text-sm text-muted-foreground">
                      <p>If you have your own tracking system, provide a URL where we'll send conversion data.</p>
                      <p className="mt-1">Available macros: {'{clickId}'}, {'{event}'}, {'{amount}'}, {'{status}'}</p>
                    </div>
                  </div>
                )}
                
                <div className="bg-muted rounded-md p-4 mt-4">
                  <h3 className="font-medium mb-2">Your Tracking Integration</h3>
                  
                  <div className="space-y-4 text-sm">
                    <div>
                      <p className="font-medium">1. Your affiliate links will look like:</p>
                      <code className="bg-muted-foreground/20 p-1 rounded">
                        {window.location.origin}/r/{'{trackingCode}'}?sub1=value&sub2=value
                      </code>
                    </div>
                    
                    <div>
                      <p className="font-medium">2. We'll redirect to your landing page with:</p>
                      <code className="bg-muted-foreground/20 p-1 rounded">
                        {formData.url}?clickId={'{clickId}'}&sub1={'{sub1}'}&sub2={'{sub2}'}
                      </code>
                    </div>
                    
                    <div>
                      <p className="font-medium">3. To confirm conversions, call our API:</p>
                      <code className="bg-muted-foreground/20 p-1 rounded">
                        POST {window.location.origin}/api/conversion
                      </code>
                      <p className="mt-1">With JSON payload:</p>
                      <code className="bg-muted-foreground/20 p-1 rounded block whitespace-pre mt-1 p-2">
{`{
  "clickId": "xyz123",
  "event": "${formData.commission_type === 'CPA' ? 'action' : formData.commission_type === 'CPL' ? 'lead' : formData.commission_type === 'CPS' ? 'sale' : 'click'}",
  "revenue": 100,
  "metadata": { "productId": "abc123" }
}`}
                      </code>
                    </div>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => setCurrentTab('targeting')}>
                  Back
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Offer'}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </div>
  );
}
