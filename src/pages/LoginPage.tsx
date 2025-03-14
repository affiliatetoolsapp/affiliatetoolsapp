
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SignInForm from '@/components/SignInForm';
import { useAuth } from '@/context/AuthContext';
import { PublicHeader } from '@/components/PublicHeader';

export default function LoginPage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  
  // Add more detailed console logging
  useEffect(() => {
    console.log('LoginPage render details:', { 
      user, 
      isLoading, 
      currentUrl: window.location.href,
      currentPath: window.location.pathname,
      userAgent: navigator.userAgent 
    });
    
    try {
      if (!isLoading && user) {
        console.log('LoginPage: User detected, redirecting to dashboard');
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Navigation error in LoginPage:', err);
      setError(`Error during navigation: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [user, isLoading, navigate]);
  
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <div className="flex items-center justify-center min-h-screen pt-16">
        <div className="w-full max-w-md p-4">
          {error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <p className="font-bold">Error</p>
              <p>{error}</p>
            </div>
          ) : null}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">Affiliate Network</h1>
            <p className="text-muted-foreground">Sign in to your account</p>
          </div>
          <SignInForm />
        </div>
      </div>
    </div>
  );
}
