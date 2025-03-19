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
  
  // Improved user profile fetching with better error handling and caching
  async function fetchUserProfile(userId: string, attempts = 0): Promise<User | null> {
    if (!userId) {
      console.error('Invalid user ID provided to fetchUserProfile');
      return null;
    }
    
    try {
      console.log(`Fetching user profile for ID: ${userId} (attempt ${attempts + 1})`);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error(`Error fetching user profile (attempt ${attempts + 1}):`, error);
        
        // If no rows returned and this is the first attempt, try to create a fallback user
        if (error.code === 'PGRST116' && attempts === 0) {
          const currentSession = await supabase.auth.getSession();
          if (currentSession?.data?.session) {
            console.log('No user profile found, creating fallback user');
            return createFallbackUser(currentSession.data.session);
          }
        }
        
        // If we still have attempts left, try again
        if (attempts < 2) {
          await new Promise(r => setTimeout(r, 500)); // Brief delay between attempts
          return fetchUserProfile(userId, attempts + 1);
        }
        
        return null;
      }

      console.log('User profile fetched successfully:', data);
      return data as User;
    } catch (error) {
      console.error(`Unexpected error fetching user profile:`, error);
      
      // Retry logic for unexpected errors
      if (attempts < 2) {
        await new Promise(r => setTimeout(r, 500));
        return fetchUserProfile(userId, attempts + 1);
      }
      
      return null;
    }
  }

  // Create a fallback user from session data with improved error handling
  async function createFallbackUser(currentSession: Session): Promise<User | null> {
    if (!currentSession || !currentSession.user) {
      console.error('Invalid session provided to createFallbackUser');
      return null;
    }
    
    const metadata = currentSession.user.user_metadata || {};
    const email = currentSession.user.email || '';
    const role = (metadata.role as string) || 'affiliate';
    
    const fallbackUser = {
      id: currentSession.user.id,
      email: email,
      role: role,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as User;
    
    console.log('Creating fallback user:', fallbackUser);
    
    try {
      // Try to insert the user - this might fail if the user already exists
      const { error } = await supabase
        .from('users')
        .insert([fallbackUser]);
      
      if (error) {
        console.error('Error creating fallback user:', error);
        
        // If insert fails because user already exists, try to fetch one more time
        if (error.code === '23505') { // PostgreSQL unique violation code
          console.log('User already exists, trying to fetch again');
          const profile = await fetchUserProfile(currentSession.user.id);
          return profile;
        }
        
        // For other errors, still return the fallback user
        return fallbackUser;
      } else {
        console.log('Fallback user created successfully');
        return fallbackUser;
      }
    } catch (error) {
      console.error('Unexpected error creating fallback user:', error);
      // Still return the fallback user even if we couldn't save it
      return fallbackUser;
    }
  }

  // Initialize auth state - cleaned up and more robust
  useEffect(() => {
    console.log('AuthProvider: Setting up auth state');
    let isMounted = true;
    
    async function initializeAuth() {
      try {
        setIsLoading(true);
        
        // Get current session
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        if (currentSession) {
          console.log('Auth: Initial session found for user ID:', currentSession.user.id);
          setSession(currentSession);
          
          // Fetch user profile immediately when session is available
          const profile = await fetchUserProfile(currentSession.user.id);
          
          if (profile && isMounted) {
            console.log('User profile loaded successfully');
            setUser(profile);
          }
        } else {
          console.log('Auth: No initial session found');
          setSession(null);
          setUser(null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    // Set up auth state change listener - more reliable
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!isMounted) return;
        
        console.log('Auth state change event:', event, newSession ? 'with session' : 'no session');
        
        // First update the session state immediately
        if (newSession) {
          setSession(newSession);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setSession(null);
          setIsLoading(false);
          return;
        }
        
        // For events that might affect the user profile
        if (newSession && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED')) {
          setIsLoading(true);
          
          const profile = await fetchUserProfile(newSession.user.id);
          
          if (isMounted) {
            if (profile) {
              setUser(profile);
            }
            setIsLoading(false);
          }
        }
      }
    );

    // Initialize auth
    initializeAuth();

    return () => {
      console.log('Auth: Cleaning up auth provider');
      isMounted = false;
      subscription.unsubscribe();
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
      throw error;
    } finally {
      // We'll let the auth state change listener update the loading state
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
        // Clear local state
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
