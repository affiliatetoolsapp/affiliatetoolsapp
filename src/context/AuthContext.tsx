
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
  
  // Function to fetch user profile with retries and better error handling
  async function fetchUserProfile(userId: string, maxRetries = 3) {
    let retries = 0;
    
    while (retries <= maxRetries) {
      try {
        console.log('Fetching user profile for ID:', userId);
        
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) {
          console.error(`Error fetching user profile (attempt ${retries + 1}):`, error);
          
          // Check if the error is due to no rows returned - we might need to create a user
          if (error.code === 'PGRST116' && retries === maxRetries) {
            console.log('No user profile found, will create fallback user');
            return null;
          }
          
          retries++;
          
          if (retries > maxRetries) {
            console.log('Max retries reached, returning null');
            return null;
          }
          
          // Wait before retrying with exponential backoff
          await new Promise(r => setTimeout(r, 1000 * Math.pow(2, retries - 1)));
          continue;
        }

        console.log('User profile fetched successfully:', data);
        return data as User;
      } catch (error) {
        console.error(`Unexpected error fetching user profile (attempt ${retries + 1}):`, error);
        retries++;
        
        if (retries > maxRetries) {
          console.log('Max retries reached, returning null');
          return null;
        }
        
        // Wait before retrying with exponential backoff
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, retries - 1)));
      }
    }
    
    return null;
  }

  // Create a fallback user from session data
  async function createFallbackUser(currentSession: Session): Promise<User | null> {
    const metadata = currentSession.user.user_metadata;
    const role = (metadata?.role as string) || 'affiliate';
    
    const fallbackUser = {
      id: currentSession.user.id,
      email: currentSession.user.email || '',
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
        // If insert fails, but not because of duplicate, return the fallback user anyway
        if (error.code !== '23505') { // PostgreSQL unique violation code
          return fallbackUser;
        }
      } else {
        console.log('Fallback user created successfully');
      }
      
      // One more attempt to fetch after creating
      const profile = await fetchUserProfile(currentSession.user.id, 1);
      return profile || fallbackUser;
    } catch (error) {
      console.error('Unexpected error creating fallback user:', error);
      return fallbackUser;
    }
  }

  // Initialize auth state
  useEffect(() => {
    console.log('AuthProvider: Setting up auth state');
    let isMounted = true;
    let loadingTimeout: NodeJS.Timeout;

    const initializeAuth = async () => {
      try {
        // Get current session
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        console.log('Auth: Getting initial session', currentSession ? 'found' : 'not found');
        
        if (!isMounted) return;
        
        if (currentSession) {
          console.log('Auth: Initial session found for user ID:', currentSession.user.id);
          setSession(currentSession);
          
          // Fetch user profile
          console.log('Auth change: Session found, fetching user profile');
          const profile = await fetchUserProfile(currentSession.user.id);
          
          if (profile && isMounted) {
            console.log('User profile loaded successfully');
            setUser(profile);
            setIsLoading(false);
          } else if (isMounted) {
            console.log('Could not load user profile, creating fallback user');
            // Create fallback user from session metadata
            const fallbackUser = await createFallbackUser(currentSession);
            if (fallbackUser && isMounted) {
              setUser(fallbackUser);
            }
            setIsLoading(false);
          }
        } else {
          console.log('Auth: No initial session found');
          setSession(null);
          setUser(null);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setIsLoading(false);
      } finally {
        // Set a maximum loading time to prevent infinite loading states
        if (isMounted && isLoading) {
          loadingTimeout = setTimeout(() => {
            if (isMounted) {
              console.log('Auth loading timeout reached, setting isLoading to false');
              setIsLoading(false);
            }
          }, 3000);
        }
      }
    };

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!isMounted) return;
        
        console.log('Auth state change event:', event, newSession ? 'with session' : 'no session');
        
        if (newSession) {
          setSession(newSession);
          
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            setIsLoading(true); // Set loading true while fetching profile
            console.log('Auth change: Session found, fetching user profile');
            const profile = await fetchUserProfile(newSession.user.id);
            
            if (profile && isMounted) {
              console.log('User profile loaded successfully');
              setUser(profile);
            } else if (isMounted) {
              console.log('Could not load user profile, creating fallback user');
              // Create fallback user from session metadata
              const fallbackUser = await createFallbackUser(newSession);
              if (fallbackUser && isMounted) {
                setUser(fallbackUser);
              }
            }
            setIsLoading(false);
          }
        } else {
          setSession(null);
          setUser(null);
          setIsLoading(false);
        }
        
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setSession(null);
          setIsLoading(false);
        }
      }
    );

    // Initialize auth
    initializeAuth();

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
      setIsLoading(false);
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
