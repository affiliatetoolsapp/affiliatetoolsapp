
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
      
      // Add a small delay to allow the database to sync
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        
        // Try one more time after a longer delay if first attempt fails
        await new Promise(resolve => setTimeout(resolve, 300));
        const retryResult = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();
          
        if (retryResult.error) {
          console.error('Retry failed to fetch user profile:', retryResult.error);
          return null;
        }
        
        console.log('User profile fetched successfully on retry:', retryResult.data);
        setUser(retryResult.data as User);
        return retryResult.data;
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
    console.log('AuthProvider: Setting up auth state');
    let isMounted = true;
    
    // Set a shorter timeout for better user experience
    const loadingTimeout = setTimeout(() => {
      if (isMounted && isLoading) {
        console.log('Auth loading timeout reached, setting isLoading to false');
        setIsLoading(false);
      }
    }, 2000); // 2 seconds timeout (shortened from 3)

    // Get initial session
    (async () => {
      try {
        console.log('Auth: Getting initial session');
        const { data } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        console.log('Auth: Initial session data:', data.session ? 'Session exists' : 'No session');
        
        if (data.session) {
          setSession(data.session);
          console.log('Auth: Session found, fetching user profile');
          const profile = await fetchUserProfile(data.session.user.id);
          
          // If profile fetch fails, fallback to creating a minimal user object from session
          if (!profile && isMounted) {
            console.log('Creating minimal user object from session metadata');
            const metadata = data.session.user.user_metadata;
            const fallbackUser = {
              id: data.session.user.id,
              email: data.session.user.email || '',
              role: (metadata?.role as string) || 'affiliate',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            } as User;
            
            setUser(fallbackUser);
          }
        } else {
          console.log('Auth: No session found, setting user to null');
          setUser(null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        if (isMounted) {
          console.log('Auth: Initialization complete, setting isLoading to false');
          setIsLoading(false);
        }
      }
    })();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!isMounted) return;
      
      console.log('Auth state change event:', event, newSession ? 'with session' : 'no session');
      
      setSession(newSession);
      
      if (newSession?.user) {
        console.log('Auth change: Session found, fetching user profile');
        try {
          const profile = await fetchUserProfile(newSession.user.id);
          
          // If profile fetch fails, fallback to creating a minimal user object from session
          if (!profile && isMounted) {
            console.log('Creating minimal user object from session metadata');
            const metadata = newSession.user.user_metadata;
            const fallbackUser = {
              id: newSession.user.id,
              email: newSession.user.email || '',
              role: (metadata?.role as string) || 'affiliate',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            } as User;
            
            setUser(fallbackUser);
          }
        } catch (error) {
          console.error('Error in profile fetch during auth change:', error);
        }
      } else {
        console.log('Auth change: No session, setting user to null');
        setUser(null);
      }
      
      if (event === 'SIGNED_OUT') {
        // Ensure user is set to null when signed out
        setUser(null);
      }
      
      setIsLoading(false);
    });

    return () => {
      console.log('Auth: Cleaning up auth provider');
      isMounted = false;
      clearTimeout(loadingTimeout);
      subscription.unsubscribe();
    };
  }, []);

  // Auth functions
  async function signIn(email: string, password: string) {
    console.log('Attempting to sign in with email:', email);
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) throw error;
      
      console.log('Sign in successful, data:', data.session ? 'Session exists' : 'No session');
      
      // Immediately set loading to false after successful sign-in
      setIsLoading(false);
      
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
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out API error:', error);
        toast({
          title: "Error",
          description: error.message || "An error occurred during sign out",
          variant: "destructive",
        });
      } else {
        // Clear local state after successful sign-out
        setUser(null);
        setSession(null);
        
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
