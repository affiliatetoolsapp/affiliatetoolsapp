
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { PublicHeader } from '@/components/PublicHeader';

export default function Index() {
  const { user, session, isLoading } = useAuth();
  const navigate = useNavigate();
  const [redirectAttempted, setRedirectAttempted] = useState(false);

  useEffect(() => {
    // Log the current state for debugging
    console.log('Index page state:', { user, session, isLoading, redirectAttempted });
    
    // Only attempt navigation when auth state is loaded AND we haven't tried redirecting yet
    if (!isLoading && !redirectAttempted) {
      setRedirectAttempted(true);
      
      if (session) {
        console.log('Session authenticated, redirecting to dashboard');
        navigate('/dashboard');
      } else if (user) {
        console.log('User authenticated, redirecting to dashboard');
        navigate('/dashboard');
      } else {
        console.log('No session or user found, redirecting to login');
        navigate('/login');
      }
    }
  }, [isLoading, user, session, navigate, redirectAttempted]);

  // Add a timeout to prevent infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) {
        console.log('Loading timeout reached, redirecting to login');
        navigate('/login');
      }
    }, 5000); // 5 second timeout

    return () => clearTimeout(timer);
  }, [isLoading, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <div className="flex flex-col items-center justify-center min-h-screen pt-16">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary mb-4"></div>
        <p className="text-muted-foreground">Loading application...</p>
        {isLoading && (
          <p className="text-sm text-muted-foreground mt-8">
            If this takes too long, <button 
              onClick={() => navigate('/login')} 
              className="text-primary underline"
            >
              click here
            </button> to go to login page.
          </p>
        )}
      </div>
    </div>
  );
}
