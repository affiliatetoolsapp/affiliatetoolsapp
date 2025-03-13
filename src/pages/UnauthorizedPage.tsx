
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
      <h1 className="text-4xl font-bold mb-2">Access Denied</h1>
      <p className="text-xl text-muted-foreground mb-8 text-center">
        You don't have permission to access this page.
      </p>
      <div className="flex gap-4">
        <Button asChild variant="outline">
          <a href="/dashboard">Back to Dashboard</a>
        </Button>
        <Button asChild>
          <a href="/">Go to Home</a>
        </Button>
      </div>
    </div>
  );
}
