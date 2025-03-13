
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export default function Index() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  // Add console log for debugging
  console.log('Index page render:', { user, isLoading });

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        console.log('Index: User detected, redirecting to dashboard');
        navigate('/dashboard');
      } else {
        console.log('Index: No user, redirecting to login');
        navigate('/login');
      }
    }
  }, [isLoading, user, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
    </div>
  );
}
