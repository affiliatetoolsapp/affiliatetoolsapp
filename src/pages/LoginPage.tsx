
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SignInForm from '@/components/SignInForm';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  
  // Add console log to help debug
  console.log('LoginPage render:', { user, isLoading });
  
  useEffect(() => {
    if (!isLoading && user) {
      console.log('LoginPage: User detected, redirecting to dashboard');
      navigate('/dashboard');
    }
  }, [user, isLoading, navigate]);
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md p-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Affiliate Network</h1>
          <p className="text-muted-foreground">Sign in to your account</p>
        </div>
        <SignInForm />
      </div>
    </div>
  );
}
