
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { PublicHeader } from '@/components/PublicHeader';
import { LoadingState } from '@/components/LoadingState';

export default function Index() {
  const { session, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Only redirect when auth is loaded
    if (!isLoading) {
      if (session) {
        console.log('Session found, redirecting to dashboard');
        navigate('/dashboard');
      } else {
        console.log('No session found, redirecting to login');
        navigate('/login');
      }
    }
  }, [isLoading, session, navigate]);

  // During initial load, show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <PublicHeader />
        <LoadingState />
      </div>
    );
  }

  // This is just a fallback - the navigation effect should redirect
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <div className="flex flex-col items-center justify-center min-h-screen pt-16">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary mb-4"></div>
        <p className="text-muted-foreground">Redirecting you to the right page...</p>
      </div>
    </div>
  );
}
