
import React, { useEffect, useState } from 'react';

export function LoadingState() {
  const [showSlowLoadingMessage, setShowSlowLoadingMessage] = useState(false);
  
  // Show a message if loading takes too long
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setShowSlowLoadingMessage(true);
      console.log('LoadingState: Showing slow loading message after timeout');
    }, 5000); // Show message after 5 seconds
    
    return () => clearTimeout(timeoutId);
  }, []);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      <p className="mt-4 text-muted-foreground">Loading...</p>
      
      {showSlowLoadingMessage && (
        <div className="mt-6 max-w-md text-center">
          <p className="text-sm text-muted-foreground">
            This is taking longer than expected. You may want to try refreshing the page or logging in again.
          </p>
        </div>
      )}
    </div>
  );
}
