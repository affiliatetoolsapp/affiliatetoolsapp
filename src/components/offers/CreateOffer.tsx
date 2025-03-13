
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
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
  
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Create New Offer</h1>
        <p className="text-muted-foreground">
          Set up a new affiliate offer for promotion
        </p>
      </div>
      
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Offer Details</CardTitle>
            <CardDescription>
              Enter the details of your affiliate offer
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
            
            <div className="grid gap-6 pt-4">
              <h3 className="font-semibold">Commission Structure</h3>
              
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
            </div>
          </CardContent>
        </Card>
        
        <div className="mt-6 flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/offers')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Offer'}
          </Button>
        </div>
      </form>
    </div>
  );
}
