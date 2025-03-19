
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SignInForm from '@/components/SignInForm';
import { useAuth } from '@/context/AuthContext';
import { PublicHeader } from '@/components/PublicHeader';

export default function LoginPage() {
  const { user, session, isLoading } = useAuth();
  const navigate = useNavigate();
  const [showLoading, setShowLoading] = useState(true);
  
  // Add console log to help debug
  console.log('LoginPage render:', { user, session, isLoading });
  
  // Use a timeout to avoid infinite loading states
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoading(false);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);
  
  useEffect(() => {
    // Only redirect if we have a session and either loading is complete or timeout exceeded
    if (session && (!isLoading || !showLoading)) {
      console.log('LoginPage: Session detected, redirecting to dashboard');
      navigate('/dashboard');
    }
  }, [user, session, isLoading, navigate, showLoading]);
  
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
