
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { PublicHeader } from '@/components/PublicHeader';

export default function Index() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Add debug logging
  console.log('Index page render:', { user, isLoading });

  useEffect(() => {
    // Set a timeout to prevent infinite loading
    const timer = setTimeout(() => {
      setLoadingTimeout(true);
    }, 5000);

    // Clear timeout on cleanup
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      console.log('Index: Auth loaded, navigating:', { user: !!user });
      if (user) {
        navigate('/dashboard');
      } else {
        navigate('/login');
      }
    }
  }, [isLoading, user, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <div className="flex flex-col items-center justify-center min-h-screen pt-16">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary mb-4"></div>
        <p className="text-muted-foreground">Loading application...</p>
        
        {loadingTimeout && (
          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-md max-w-md">
            <p className="text-sm text-yellow-700">
              Taking longer than expected. If the app doesn't load soon, try refreshing the page or checking your connection.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
