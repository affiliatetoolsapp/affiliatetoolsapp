
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { PublicHeader } from '@/components/PublicHeader';

export default function Index() {
  const { user, session, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Log for debugging
    console.log('Index page state:', { 
      user, 
      session, 
      isLoading,
      hasUser: !!user,
      hasSession: !!session
    });
    
    // If auth state is loaded, determine where to redirect
    if (!isLoading) {
      // If we have a session, navigate to dashboard regardless of user state
      // This helps prevent a redirect loop if user data is slow to load
      if (session) {
        console.log('Session authenticated, redirecting to dashboard');
        navigate('/dashboard');
      } else {
        console.log('No session found, redirecting to login');
        navigate('/login');
      }
    }
  }, [isLoading, user, session, navigate]);

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
