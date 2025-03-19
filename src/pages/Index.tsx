
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { PublicHeader } from '@/components/PublicHeader';

export default function Index() {
  const { session, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showLoading, setShowLoading] = useState(true);

  useEffect(() => {
    // Log the current state for debugging
    console.log('Index page state:', { session, isLoading, path: location.pathname });
    
    // Set a timeout to avoid quick loading flickers
    const timer = setTimeout(() => {
      setShowLoading(false);
    }, 3000);
    
    // Only handle navigation for the exact root path
    if (location.pathname === '/') {
      // Defer redirect until loading completes or timeout
      if (!isLoading || !showLoading) {
        if (session) {
          console.log('Session authenticated, redirecting to dashboard');
          navigate('/dashboard', { replace: true });
        } else {
          console.log('No session found, redirecting to login');
          navigate('/login', { replace: true });
        }
      }
    }
    
    return () => clearTimeout(timer);
  }, [isLoading, session, navigate, location.pathname, showLoading]);

  // Only render loading component on the root path and when loading/timeout not expired
  if (location.pathname === '/' && (isLoading && showLoading)) {
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
  
  // For other paths or when not loading, let the router handle it
  return null;
}
