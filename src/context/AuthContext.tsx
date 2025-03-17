import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@/types';
import { Session } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, role: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Function to fetch user profile with improved error handling
  async function fetchUserProfile(userId: string) {
    try {
      console.log('Fetching user profile for ID:', userId);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      console.log('User profile fetched successfully:', data);
      setUser(data as User);
      return data;
    } catch (error) {
      console.error('Unexpected error fetching user profile:', error);
      return null;
    }
  }

  useEffect(() => {
    let isMounted = true;
    
    // Shorter timeout for better user experience
    const loadingTimeout = setTimeout(() => {
      if (isMounted && isLoading) {
        setIsLoading(false);
      }
    }, 3000); // Reduced from 10 seconds to 3 seconds

    // Get initial session - use async IIFE for cleaner code
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        if (data.session) {
          console.log('Auth init: Session found');
          setSession(data.session);
          
          // Try to fetch the profile, but don't block user access if it fails
          const profile = await fetchUserProfile(data.session.user.id);
          
          if (!profile) {
            console.log('Auth init: Could not fetch profile, using session metadata');
            // Create a minimal user object from session metadata if profile fetch fails
            const role = data.session.user.user_metadata?.role || 'affiliate';
            setUser({
              id: data.session.user.id,
              email: data.session.user.email || '',
              role: role,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            } as User);
          }
        } else {
          console.log('Auth init: No session found');
          setUser(null);
        }
        
        if (isMounted) setIsLoading(false);
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (isMounted) setIsLoading(false);
      }
    })();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      
      console.log('Auth state change event:', event);
      
      setSession(session);
      
      if (session?.user) {
        console.log('Auth state change: User logged in');
        
        // Try to fetch profile, but don't block if it fails
        const profile = await fetchUserProfile(session.user.id);
        
        if (!profile) {
          console.log('Auth state change: Could not fetch profile, using session metadata');
          // Create a minimal user object from session metadata if profile fetch fails
          const role = session.user.user_metadata?.role || 'affiliate';
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            role: role,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } as User);
        }
      } else {
        console.log('Auth state change: User logged out or no session');
        setUser(null);
      }
      
      if (isMounted) setIsLoading(false);
    });

    return () => {
      isMounted = false;
      clearTimeout(loadingTimeout);
      subscription.unsubscribe();
    };
  }, []);

  // Modified to return success status
  async function signIn(email: string, password: string): Promise<boolean> {
    setIsLoading(true);
    try {
      console.log('Attempting to sign in with email:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) throw error;
      
      console.log('Sign in successful:', data);
      
      toast({
        title: "Success",
        description: "You have successfully signed in!",
      });
      
      // If we have session data, consider authentication successful even without profile
      if (data.session) {
        // Try to fetch profile but don't block if it fails
        const profile = await fetchUserProfile(data.session.user.id);
        
        if (!profile) {
          console.log('Sign in: Could not fetch profile, using session metadata');
          // Create a minimal user object from session metadata if profile fetch fails
          const role = data.session.user.user_metadata?.role || 'affiliate';
          setUser({
            id: data.session.user.id,
            email: data.session.user.email || '',
            role: role,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } as User);
        }
      }
      
      setIsLoading(false);
      return true;
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast({
        title: "Error",
        description: error.message || "An error occurred during sign in",
        variant: "destructive",
      });
      setIsLoading(false);
      return false;
    }
  }

  async function signUp(email: string, password: string, role: string) {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            role,
          },
        }
      });
      
      if (error) throw error;
      
      toast({
        title: "Account created",
        description: "Please check your email for verification",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred during sign up",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  async function signOut() {
    try {
      console.log('Attempting to sign out...');
      setIsLoading(true);
      
      // Clear local state first to ensure immediate UI update
      setUser(null);
      setSession(null);
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out API error:', error);
        toast({
          title: "Error",
          description: error.message || "An error occurred during sign out",
          variant: "destructive",
        });
      } else {
        console.log('Signed out successfully');
        toast({
          title: "Signed out",
          description: "You have been signed out successfully",
        });
      }
    } catch (error: any) {
      console.error('Sign out unexpected error:', error);
      toast({
        title: "Error",
        description: error.message || "An error occurred during sign out",
        variant: "destructive",
      });
    } finally {
      // Ensure we always end the loading state
      setIsLoading(false);
    }
  }

  async function updateProfile(data: Partial<User>) {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update(data)
        .eq('id', user.id);
        
      if (error) throw error;
      
      setUser({ ...user, ...data });
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function updatePassword(newPassword: string) {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      toast({
        title: "Password updated",
        description: "Your password has been updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update password",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  async function resetPassword(email: string) {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/profile?tab=security`,
      });
      
      if (error) throw error;
      
      toast({
        title: "Reset email sent",
        description: "Check your email for a password reset link",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const value = {
    session,
    user,
    isLoading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    updatePassword,
    resetPassword
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
