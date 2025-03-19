
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { PublicHeader } from '@/components/PublicHeader';
import { LoadingState } from '@/components/LoadingState';

export default function Index() {
  const { user, session, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Log the current state for debugging
    console.log('Index page state:', { user, session, isLoading, path: location.pathname });
    
    // ONLY handle navigation for the exact root path - this prevents redirect issues on refresh
    if (location.pathname === '/') {
      // Wait until auth state is determined before redirecting
      if (!isLoading) {
        if (session) {
          console.log('Session authenticated, redirecting to dashboard');
          navigate('/dashboard', { replace: true });
        } else if (user) {
          console.log('User authenticated, redirecting to dashboard');
          navigate('/dashboard', { replace: true });
        } else {
          console.log('No session or user found, redirecting to login');
          navigate('/login', { replace: true });
        }
      }
    }
  }, [isLoading, user, session, navigate, location.pathname]);

  // Only render loading component on the root path
  if (location.pathname === '/') {
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
  
  // For other paths, let the router handle it
  return null;
}
