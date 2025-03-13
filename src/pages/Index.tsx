import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { PublicHeader } from '@/components/PublicHeader';

export default function Index() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
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
      <div className="flex items-center justify-center min-h-screen pt-16">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    </div>
  );
}
