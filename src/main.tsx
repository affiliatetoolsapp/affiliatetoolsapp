
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '@/styles/theme.css';
import '@radix-ui/themes/styles.css';

// Render React app
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Server functionality for Deno deployment
// This block will only execute in a Deno environment and be ignored in browser
if (typeof window === 'undefined') {
  // Define TypeScript interfaces for Deno environment
  // This allows TypeScript to recognize Deno-specific types without importing them directly
  interface DenoNamespace {
    env: {
      get(key: string): string | undefined;
    };
  }
  
  interface ServeFunction {
    (handler: (req: Request) => Response | Promise<Response>, options?: { port?: number }): void;
  }
  
  // Start the server
  const start = async () => {
    try {
      // For TypeScript, we're declaring these variables this way
      // In Deno runtime, they'll be populated correctly
      // @ts-ignore - Ignore TypeScript errors as these will be resolved at runtime in Deno
      const Deno = (globalThis as any).Deno as DenoNamespace;
      
      // Dynamically import server module - using any to bypass TypeScript checking
      // @ts-ignore - Ignore TypeScript errors as these will be resolved at runtime in Deno
      const serverModule = await import('https://deno.land/std@0.140.0/http/server.ts');
      const serve = serverModule.serve as ServeFunction;
      
      // Get port from environment variable or use 8080 as default
      const port = parseInt(Deno.env.get("PORT") || "8080");
      console.log(`HTTP server running on port ${port}`);
      
      // Start server
      serve((req) => {
        return new Response("Server is running!", { status: 200 });
      }, { port });
    } catch (error) {
      console.error("Server startup error:", error);
    }
  };
  
  start();
}
