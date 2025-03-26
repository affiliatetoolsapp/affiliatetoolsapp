import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const formSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type FormValues = z.infer<typeof formSchema>;

export default function SignInForm() {
  const { signIn, session, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    if (isLoading) return; // Prevent multiple submissions
    
    console.log('SignInForm: Submitting with email:', data.email);
    setIsLoading(true);
    try {
      await signIn(data.email, data.password);
      console.log('SignInForm: Sign in successful');
      
      // Get the user role directly from the session
      const userRole = session?.user?.user_metadata?.role;
      console.log('SignInForm: Session data:', session);
      console.log('SignInForm: User metadata:', session?.user?.user_metadata);
      console.log('SignInForm: User role detected:', userRole);
      
      // Navigate based on user role
      if (userRole === 'admin') {
        console.log('SignInForm: Redirecting to admin dashboard');
        navigate('/admin');
      } else {
        console.log('SignInForm: Redirecting to regular dashboard');
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('SignInForm: Sign in error:', error);
      // Error is already displayed via toast in the signIn function
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg shadow-sm p-6 border">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="you@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="••••••••" 
                        {...field} 
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex items-center justify-end">
              <a href="#" className="text-sm text-primary underline-offset-4 hover:underline">
                Forgot password?
              </a>
            </div>
            
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </form>
        </Form>
      </div>
      
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Don't have an account yet?{" "}
          <a href="/signup" className="text-primary underline-offset-4 hover:underline">
            Create an account
          </a>
        </p>
      </div>
    </div>
  );
}
