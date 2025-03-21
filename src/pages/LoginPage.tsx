
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SignInForm from '@/components/SignInForm';
import { useAuth } from '@/context/AuthContext';
import { PublicHeader } from '@/components/PublicHeader';
import { LoadingState } from '@/components/LoadingState';

export default function LoginPage() {
  const { session, isLoading, profileError, user } = useAuth();
  const navigate = useNavigate();
  
  // Handle redirection based on session with better logging
  useEffect(() => {
    console.log('LoginPage: Checking auth state', { 
      hasSession: !!session, 
      isLoading, 
      hasProfileError: !!profileError,
      hasUser: !!user
    });
    
    // Only redirect if we have a session and user data
    if (!isLoading && session && user) {
      console.log('LoginPage: Session and user data detected, redirecting to dashboard');
      navigate('/dashboard');
    }
  }, [session, isLoading, navigate, profileError, user]);
  
  // Show loading state during initialization
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <PublicHeader />
        <LoadingState />
      </div>
    );
  }
  
  // If there's no session or there's a profile error, show login form
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <div className="flex items-center justify-center min-h-screen pt-16">
        <div className="w-full max-w-md p-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">AffiliateTools</h1>
            <p className="text-muted-foreground">Sign in to your account</p>
          </div>
          <SignInForm />
        </div>
      </div>
    </div>
  );
}
