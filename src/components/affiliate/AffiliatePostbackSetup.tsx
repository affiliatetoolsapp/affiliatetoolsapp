
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Save, Trash, Check } from 'lucide-react';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// Define form schema using zod
const formSchema = z.object({
  postback_url: z.string().url("Must be a valid URL").optional().or(z.literal('')),
  events: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function AffiliatePostbackSetup() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch existing postback settings
  const { data: postbackData, isLoading } = useQuery({
    queryKey: ['affiliate-postback', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('custom_postbacks')
        .select('*')
        .eq('affiliate_id', user.id)
        .maybeSingle();
        
      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error("Error fetching postback settings:", error);
        throw error;
      }
      
      return data;
    },
    enabled: !!user,
  });
  
  // Setup form with react-hook-form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      postback_url: '',
      events: ['lead', 'sale', 'action'],
    },
  });
  
  // Update form when data is loaded
  useEffect(() => {
    if (postbackData) {
      form.reset({
        postback_url: postbackData.postback_url || '',
        events: postbackData.events || ['lead', 'sale', 'action'],
      });
    }
  }, [postbackData, form]);
  
  // Mutation to save postback settings
  const saveMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!user) throw new Error("User not authenticated");
      
      const { data: existing } = await supabase
        .from('custom_postbacks')
        .select('id')
        .eq('affiliate_id', user.id)
        .maybeSingle();
        
      if (existing) {
        // Update existing record
        const { error } = await supabase
          .from('custom_postbacks')
          .update({
            postback_url: values.postback_url,
            events: values.events,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
          
        if (error) throw error;
      } else {
        // Create new record
        const { error } = await supabase
          .from('custom_postbacks')
          .insert({
            affiliate_id: user.id,
            postback_url: values.postback_url,
            events: values.events,
          });
          
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliate-postback', user?.id] });
      toast({
        title: "Postback settings saved",
        description: "Your postback URL has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error saving settings",
        description: "Failed to save your postback settings. Please try again.",
      });
      console.error(error);
    },
  });
  
  // Handle form submission
  const onSubmit = (values: FormValues) => {
    saveMutation.mutate(values);
  };
  
  // Clear postback URL
  const clearPostback = () => {
    form.setValue('postback_url', '');
    if (form.formState.isDirty) {
      saveMutation.mutate(form.getValues());
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Postback URL Setup</CardTitle>
        <CardDescription>
          Configure a postback URL to receive conversion notifications on your own system
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin h-6 w-6 border-2 border-primary rounded-full border-t-transparent"></div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="postback_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Postback URL</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://yourtracker.com/postback?tid={click_id}&goal={goal}" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      When we receive a conversion, we'll forward it to this URL. Use placeholders to receive dynamic data.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-3">
                <Label>Available Placeholders</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Badge variant="outline">{'{click_id}'}</Badge>
                    <p className="text-sm text-muted-foreground">
                      The original click ID from your tracking link.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Badge variant="outline">{'{goal}'}</Badge>
                    <p className="text-sm text-muted-foreground">
                      The conversion type (e.g., lead, sale, action).
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Badge variant="outline">{'{payout}'}</Badge>
                    <p className="text-sm text-muted-foreground">
                      The commission amount for this conversion.
                    </p>
                  </div>
                </div>
              </div>
              
              <FormField
                control={form.control}
                name="events"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel>Forward Conversion Types</FormLabel>
                      <FormDescription>
                        Select which conversion types should be sent to your postback URL
                      </FormDescription>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {['lead', 'sale', 'action', 'deposit'].map((item) => (
                        <FormField
                          key={item}
                          control={form.control}
                          name="events"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={item}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(item)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value || [], item])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== item
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal capitalize">
                                  {item}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex items-center p-3 bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-200 rounded-md">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                <div className="text-sm">
                  <p>Your server must respond with a 200 status code within 10 seconds when we call your postback URL.</p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  type="submit" 
                  className="sm:flex-1"
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending ? (
                    <>
                      <div className="animate-spin h-4 w-4 mr-2 border-2 border-current rounded-full border-t-transparent"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Settings
                    </>
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="sm:flex-1"
                  onClick={clearPostback}
                  disabled={!form.getValues().postback_url}
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Clear Postback URL
                </Button>
              </div>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}
