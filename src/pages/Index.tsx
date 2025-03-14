
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { PublicHeader } from '@/components/PublicHeader';

export default function Index() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loadingState, setLoadingState] = useState<string>('Starting application...');

  useEffect(() => {
    // Add more detailed logging
    console.log('Index page render:', { 
      user, 
      isLoading, 
      currentUrl: window.location.href,
      currentPath: window.location.pathname
    });
    
    try {
      setLoadingState('Checking authentication state...');
      
      // Immediate navigation if auth state is already loaded
      if (!isLoading) {
        if (user) {
          console.log('User authenticated, redirecting to dashboard');
          setLoadingState('Authenticated, redirecting to dashboard...');
          navigate('/dashboard');
        } else {
          console.log('No user found, redirecting to login');
          setLoadingState('Not authenticated, redirecting to login...');
          navigate('/login');
        }
      }
    } catch (err) {
      console.error('Navigation error:', err);
      setError(`Error during navigation: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [isLoading, user, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <div className="flex flex-col items-center justify-center min-h-screen pt-16">
        {error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-bold">Error</p>
            <p>{error}</p>
            <p className="mt-2 text-sm">
              Please try refreshing the page or check your network connection.
            </p>
          </div>
        ) : (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">{loadingState}</p>
          </>
        )}
      </div>
    </div>
  );
}
