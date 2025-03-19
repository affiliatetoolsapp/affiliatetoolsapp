
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
  profileError: string | null;
  retryFetchProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Fetch user profile with retry logic and silent recovery
  async function fetchUserProfile(userId: string): Promise<User | null> {
    if (!userId) {
      console.error('Cannot fetch user profile: No user ID provided');
      setProfileError('Cannot fetch user profile: No user ID provided');
      return null;
    }
    
    const maxRetries = 3;
    let retryCount = 0;
    let delay = 1000; // Start with 1 second delay
    
    while (retryCount < maxRetries) {
      try {
        console.log(`Fetching user profile for ID: ${userId} (Attempt ${retryCount + 1}/${maxRetries})`);
        
        // Create a timeout promise that rejects after 5 seconds
        const timeoutPromise = new Promise<null>((_, reject) => {
          setTimeout(() => reject(new Error(`User profile fetch timed out after 5 seconds (Attempt ${retryCount + 1})`)), 5000);
        });
        
        // Race between the fetch and the timeout
        const profilePromise = supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();
          
        const { data, error } = await Promise.race([
          profilePromise,
          timeoutPromise.then(() => {
            throw new Error(`User profile fetch timed out (Attempt ${retryCount + 1})`);
          })
        ]);

        if (error) {
          throw error;
        }

        if (!data) {
          throw new Error(`No user profile found for ID: ${userId}`);
        }

        console.log('User profile fetched successfully:', data);
        setProfileError(null);
        return data as User;
      } catch (error: any) {
        console.error(`Profile fetch attempt ${retryCount + 1} failed:`, error);
        
        retryCount++;
        
        if (retryCount >= maxRetries) {
          console.log("All retry attempts failed, attempting silent recovery...");
          
          // Final fallback: Try to get basic user info from auth
          try {
            const { data: authData } = await supabase.auth.getUser();
            if (authData?.user) {
              console.log("Recovered basic user info from auth:", authData.user);
              
              // Create a minimal user object from auth data with all required fields
              const minimalUser: User = {
                id: authData.user.id,
                email: authData.user.email || '',
                role: (authData.user.user_metadata?.role || 'affiliate') as any,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                // Add all nullable fields required by the User type
                bio: null,
                company_name: null,
                contact_name: null,
                phone: null,
                website: null
              };
              
              setProfileError(null);
              return minimalUser;
            }
          } catch (authError) {
            console.error("Auth recovery failed:", authError);
          }
          
          // If we're here, all recovery attempts failed
          setProfileError('Failed to load your profile data. The app will reload to try again.');
          
          // Schedule a page reload after a short delay
          setTimeout(() => {
            console.log("Silently refreshing the page...");
            window.location.reload();
          }, 100); // Short delay to allow state updates
          
          return null;
        }
        
        // Wait before retrying with exponential backoff
        console.log(`Waiting ${delay}ms before retry ${retryCount}...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }
    
    return null; // This line should not be reached due to the returns in the loop
  }

  // Initialize auth state
  useEffect(() => {
    console.log('AuthProvider: Setting up auth state');
    let mounted = true;
    
    // Handle session and user initialization
    async function initialize() {
      try {
        setIsLoading(true);
        
        // Get current session
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error getting session:', sessionError);
          if (mounted) {
            setIsLoading(false);
            setProfileError('Error loading session. Please try logging in again.');
          }
          return;
        }
        
        if (!mounted) return;
        
        console.log('Initial auth check:', currentSession ? 'Session found' : 'No session');
        
        // Update session state
        setSession(currentSession);
        
        // If we have a session, fetch the user profile
        if (currentSession?.user) {
          try {
            const profile = await fetchUserProfile(currentSession.user.id);
            
            if (mounted) {
              setUser(profile);
              setIsLoading(false);
            }
          } catch (profileError) {
            console.error('Error during profile initialization:', profileError);
            if (mounted) {
              setIsLoading(false);
            }
          }
        } else {
          if (mounted) {
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;
        
        console.log('Auth state change event:', event, newSession ? 'with session' : 'no session');
        
        // Always update the session state immediately
        setSession(newSession);
        
        // Handle auth events
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (newSession) {
            setIsLoading(true);
            try {
              const profile = await fetchUserProfile(newSession.user.id);
              
              if (mounted) {
                setUser(profile);
                setIsLoading(false);
              }
            } catch (profileError) {
              console.error('Error fetching profile during auth change:', profileError);
              if (mounted) {
                setIsLoading(false);
              }
            }
          }
        } else if (event === 'SIGNED_OUT') {
          // Clear local state on sign out
          setUser(null);
          setProfileError(null);
          setIsLoading(false);
        }
      }
    );
    
    // Initialize auth
    initialize();

    // Cleanup function
    return () => {
      console.log('Auth: Cleaning up auth provider');
      mounted = false;
      subscription.unsubscribe();
    };
  }, [toast]);

  // Function to retry fetching user profile
  async function retryFetchProfile() {
    if (!session?.user) {
      console.log('Cannot retry: No active session');
      toast({
        title: "Error",
        description: "No active session. Please sign in again.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setProfileError(null);
    
    try {
      const profile = await fetchUserProfile(session.user.id);
      setUser(profile);
      
      if (profile) {
        toast({
          title: "Success",
          description: "Profile data loaded successfully.",
        });
      }
    } catch (error) {
      console.error('Retry fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  }

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
    resetPassword,
    profileError,
    retryFetchProfile
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
