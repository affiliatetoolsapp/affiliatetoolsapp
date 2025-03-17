
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SignInForm from '@/components/SignInForm';
import { useAuth } from '@/context/AuthContext';
import { PublicHeader } from '@/components/PublicHeader';

export default function LoginPage() {
  const { user, session, isLoading } = useAuth();
  const navigate = useNavigate();
  
  // Add console log to help debug
  console.log('LoginPage render:', { user, session, isLoading });
  
  useEffect(() => {
    // If user is already authenticated, redirect to dashboard
    if (!isLoading && (session || user)) {
      console.log('LoginPage: User already authenticated, redirecting to dashboard');
      navigate('/dashboard');
    }
  }, [user, session, isLoading, navigate]);
  
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <div className="flex items-center justify-center min-h-screen pt-16">
        <div className="w-full max-w-md p-4">
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
