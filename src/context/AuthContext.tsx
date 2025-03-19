import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@/types';
import { Session } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';

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
      console.log('Fetching user profile for ID:', userId);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      console.log('User profile fetched successfully:', data);
      return data;
    } catch (error) {
      console.error('Unexpected error fetching user profile:', error);
      return null;
    }
  }

  // Set up auth state listener once on mount
  useEffect(() => {
    console.log('AuthProvider: Setting up auth state');
    let isMounted = true;
    
    // Initialize auth state
    const initAuth = async () => {
      try {
        // Get initial session with better error handling
        console.log('Auth: Getting initial session');
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error getting session:', sessionError);
          if (isMounted) setIsLoading(false);
          return;
        }

        if (!isMounted) return;

        if (sessionData?.session) {
          console.log('Auth: Initial session found', sessionData.session.user.id);
          setSession(sessionData.session);
          
          // Fetch user profile
          const userData = await fetchUserProfile(sessionData.session.user.id);
          if (userData) {
            setUser(userData as User);
          }
        } else {
          console.log('Auth: No initial session found');
          setSession(null);
          setUser(null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        // Always set loading to false when initialization is complete
        if (isMounted) {
          console.log('Auth: Initialization complete, setting isLoading to false');
          setIsLoading(false);
        }
      }
    };

    // Set a timeout to ensure we don't keep the loading state forever
    const loadingTimeout = setTimeout(() => {
      if (isMounted && isLoading) {
        console.log('Auth loading timeout reached, setting isLoading to false');
        setIsLoading(false);
      }
    }, 2000); // Ensure loading state doesn't last more than 2 seconds

    // Initialize auth
    initAuth();

    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log('Auth state change event:', event);
      
      if (!isMounted) return;

      if (currentSession) {
        console.log('Auth change: Session found', currentSession.user.id);
        setSession(currentSession);
        
        // Fetch user profile for the session
        const userData = await fetchUserProfile(currentSession.user.id);
        if (userData) {
          setUser(userData as User);
        }
      } else {
        console.log('Auth change: No session');
        setSession(null);
        setUser(null);
      }
      
      // Always ensure loading state is false after auth state change
      setIsLoading(false);
    });

    // Clean up
    return () => {
      console.log('Auth: Cleaning up auth provider');
      isMounted = false;
      clearTimeout(loadingTimeout);
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Auth functions
  async function signIn(email: string, password: string) {
    console.log('Attempting to sign in with email:', email);
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password
      });
      
      if (error) throw error;
      
      console.log('Sign in successful, data:', data.session ? 'Session exists' : 'No session');
      
      toast({
        title: "Success",
        description: "You have successfully signed in!",
      });
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
          }
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
      
      const { error } = await supabase.auth.signOut({
        scope: 'local' // Only clear local session, not on all devices
      });
      
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
        
        // Force reload the page to ensure clean state after logout
        window.location.href = '/login';
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
