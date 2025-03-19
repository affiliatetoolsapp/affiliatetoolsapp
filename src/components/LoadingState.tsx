
import React from 'react';
import { Button } from '@/components/ui/button';

type LoadingStateProps = {
  errorMessage?: string;
  onRetry?: () => void | Promise<void>;
}

export function LoadingState({ errorMessage, onRetry }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      {!errorMessage ? (
        <>
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </>
      ) : (
        <>
          <div className="text-center">
            <p className="mb-4 text-destructive font-medium">{errorMessage}</p>
            {onRetry && (
              <Button onClick={onRetry} variant="outline">
                Try Again
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
