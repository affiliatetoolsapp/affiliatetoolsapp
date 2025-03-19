
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { PublicHeader } from '@/components/PublicHeader';

export default function Index() {
  const { session, isLoading } = useAuth();
  const navigate = useNavigate();
  
  // Add more logging
  useEffect(() => {
    console.log('Index page state:', { session, isLoading });
    
    // Use a simpler approach with a safety check for race conditions
    if (!isLoading) {
      if (session) {
        console.log('Session found, redirecting to dashboard');
        navigate('/dashboard', { replace: true });
      } else {
        console.log('No session found, redirecting to login');
        navigate('/login', { replace: true });
      }
    }
  }, [isLoading, session, navigate]);
  
  // Always show a loading state on the index page
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <div className="flex flex-col items-center justify-center min-h-screen pt-16">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary mb-4"></div>
        <p className="text-muted-foreground">Loading application...</p>
      </div>
    </div>
  );
}
