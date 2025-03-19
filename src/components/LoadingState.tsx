
import React, { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface LoadingStateProps {
  errorMessage?: string;
  onRetry?: () => void;
}

export function LoadingState({ errorMessage, onRetry }: LoadingStateProps) {
  const [showSlowLoadingMessage, setShowSlowLoadingMessage] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Show a message if loading takes too long
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setShowSlowLoadingMessage(true);
      console.log('LoadingState: Showing slow loading message after timeout');
    }, 5000); // Show message after 5 seconds
    
    return () => clearTimeout(timeoutId);
  }, []);

  const handleLoginRedirect = () => {
    // Clear any local storage session data to force a fresh login
    localStorage.removeItem('sb-jruzfpymzkzegdhmzwsr-auth-token');
    toast({
      title: "Session cleared",
      description: "Please sign in again to continue",
    });
    navigate('/login');
  };
  
  // If there's an error message, show an error alert
  if (errorMessage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <Alert variant="destructive" className="max-w-md mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
        <div className="flex gap-4 mt-4">
          {onRetry && (
            <Button onClick={onRetry} variant="outline">
              Retry
            </Button>
          )}
          <Button onClick={handleLoginRedirect}>
            Sign in again
          </Button>
        </div>
      </div>
    );
  }
  
  // Default loading state
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      <p className="mt-4 text-muted-foreground">Loading...</p>
      
      {showSlowLoadingMessage && (
        <div className="mt-6 max-w-md text-center">
          <p className="text-sm text-muted-foreground">
            This is taking longer than expected. You may want to try refreshing the page or logging in again.
          </p>
          <Button 
            variant="link" 
            className="mt-2" 
            onClick={handleLoginRedirect}
          >
            Sign in again
          </Button>
        </div>
      )}
    </div>
  );
}
