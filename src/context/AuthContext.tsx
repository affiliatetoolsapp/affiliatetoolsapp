
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@/types';
import { Session } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
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
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

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
          setSession(data.session);
          // Try to fetch the profile, but don't block user access if it fails
          fetchUserProfile(data.session.user.id)
            .catch(err => {
              console.error('Error in profile fetch during initialization:', err);
            })
            .finally(() => {
              if (isMounted) setIsLoading(false);
            });
        } else {
          setUser(null);
          if (isMounted) setIsLoading(false);
        }
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
        // Don't wait for profile fetch to complete before setting isLoading to false
        fetchUserProfile(session.user.id)
          .catch(err => {
            console.error('Error in profile fetch during auth change:', err);
          })
          .finally(() => {
            if (isMounted) setIsLoading(false);
          });
      } else {
        setUser(null);
        if (isMounted) setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(loadingTimeout);
      subscription.unsubscribe();
    };
  }, []);

  // For signIn, modify to ensure we don't depend solely on the profile fetch
  async function signIn(email: string, password: string) {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) throw error;
      
      // Navigation should happen automatically by auth state change
      toast({
        title: "Success",
        description: "You have successfully signed in!",
      });
      
      // If we get this far, consider the sign-in successful
      setIsLoading(false);
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast({
        title: "Error",
        description: error.message || "An error occurred during sign in",
        variant: "destructive",
      });
      setIsLoading(false);
      throw error;
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
