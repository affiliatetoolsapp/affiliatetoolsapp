import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@/types';
import { Session } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<Session>;
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
  
  // Create user from session without network request
  function createUserFromSession(currentSession: Session): User {
    const userId = currentSession.user.id;
    const userEmail = currentSession.user.email || '';
    const rawRole = currentSession.user.user_metadata?.role;
    const isAdminUser = userEmail === 'admin@affiliatetools.app';
    
    // Set role based on email or metadata
    const userRole: 'admin' | 'advertiser' | 'affiliate' = isAdminUser 
      ? 'admin' 
      : rawRole === 'advertiser' 
        ? 'advertiser' 
        : 'affiliate';
    
    return {
      id: userId,
      email: userEmail,
      role: userRole,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      bio: null,
      company_name: null,
      contact_name: null,
      phone: null,
      website: null
    };
  }
  
  // Fetch user profile only when explicitly needed
  async function fetchUserProfile(userId: string): Promise<User | null> {
    if (!userId) return null;
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data as User;
    } catch (error) {
      console.error('Profile fetch error:', error);
      return null;
    }
  }

  // Initialize auth state
  useEffect(() => {
    let mounted = true;
    
    // Handle session and user initialization
    async function initialize() {
      try {
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error getting session:', sessionError);
          if (mounted) setIsLoading(false);
          return;
        }
        
        if (!mounted) return;
        
        // Update session state
        setSession(currentSession);
        
        // If we have a session, create user from session data
        if (currentSession?.user) {
          const sessionUser = createUserFromSession(currentSession);
          setUser(sessionUser);
          
          // Fetch profile in the background
          fetchUserProfile(currentSession.user.id)
            .then(profileData => {
              if (profileData && mounted) {
                setUser(profileData);
              }
            })
            .catch(error => {
              console.error('Background profile fetch error:', error);
            });
        }
        
        if (mounted) setIsLoading(false);
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) setIsLoading(false);
      }
    }

    // Initialize auth
    initialize();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;
        
        // Always update the session state immediately
        if (newSession) {
          setSession(newSession);
          
          // Create user from session data immediately
          const sessionUser = createUserFromSession(newSession);
          setUser(sessionUser);
          
          // Fetch profile in the background
          fetchUserProfile(newSession.user.id)
            .then(profileData => {
              if (profileData && mounted) {
                setUser(profileData);
              }
            })
            .catch(error => {
              console.error('Background profile fetch error:', error);
            });
        } else {
          setSession(null);
          setUser(null);
        }
      }
    );

    // Cleanup function
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

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
      
      if (profile) {
        setUser(profile);
        toast({
          title: "Success",
          description: "Profile data loaded successfully.",
        });
      } else {
        // Use session data as fallback
        const sessionUser = createUserFromSession(session);
        setUser(sessionUser);
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
      // First set the session config for long-lived sessions
      await supabase.auth.setSession({
        access_token: '',
        refresh_token: ''
      });

      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password
      });
      
      if (error) throw error;
      
      console.log('Sign in successful, data:', data.session ? 'Session exists' : 'No session');
      
      // Set the session state immediately
      if (data.session) {
        // Refresh the session with a long expiry
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (!refreshError && refreshData.session) {
          setSession(refreshData.session);
          // Create and set user from session data
          const sessionUser = createUserFromSession(refreshData.session);
          setUser(sessionUser);
        } else {
          setSession(data.session);
          // Create and set user from session data
          const sessionUser = createUserFromSession(data.session);
          setUser(sessionUser);
        }
        
        // Fetch profile in the background and keep loading state until complete
        await fetchUserProfile(data.session.user.id)
          .then(profileData => {
            if (profileData) {
              setUser(profileData);
            }
          })
          .catch(error => {
            console.error('Background profile fetch error:', error);
          })
          .finally(() => {
            setIsLoading(false);
          });
      }
      
      toast({
        title: "Success",
        description: "You have successfully signed in!",
      });

      return data.session;
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
    console.log('Attempting to sign out...');
    setIsLoading(true);
    
    try {
      // First, clear local state to ensure UI updates immediately
      setUser(null);
      setSession(null);
      
      // Attempt to sign out with Supabase
      try {
        const { error } = await supabase.auth.signOut();
        
        if (error) {
          console.warn('Supabase sign out API error:', error);
          // Don't throw here, we already cleared local state
        }
      } catch (apiError) {
        // If sign out fails on the API side but we've already cleared
        // local state, we can still consider this a successful sign out
        console.warn('Supabase sign out API exception:', apiError);
      }
      
      console.log('Signed out successfully');
      toast({
        title: "Signed out",
        description: "You have been signed out successfully",
      });
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
