
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
  const start = async () => {
    try {
      // Dynamically import Deno modules only when in Deno environment
      const { serve } = await import('https://deno.land/std@0.140.0/http/server.ts');
      
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
