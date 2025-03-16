
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import '@/styles/theme.css';
import '@radix-ui/themes/styles.css';

// Render the React application
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Server code for Deno deployment
// This only runs in the Deno environment, not in the browser
if (typeof window === 'undefined') {
  // Add TypeScript declaration for Deno
  declare namespace Deno {
    export interface Env {
      get(key: string): string | undefined;
    }
    export const env: Env;
  }

  const serve = async () => {
    try {
      // Dynamic import to avoid browser errors
      // Using a more modern version of the Deno standard library
      const { serve: denoServe } = await import('https://deno.land/std@0.204.0/http/server.ts');
      
      // Get port from environment variable or use default
      const port = parseInt(Deno.env.get('PORT') || '8000');
      const hostname = Deno.env.get('HOST') || '0.0.0.0';
      
      console.log(`HTTP server running on http://${hostname}:${port}/`);
      
      await denoServe(
        (req) => {
          const url = new URL(req.url);
          // Serve the index.html for all routes
          return new Response(
            `<!DOCTYPE html>
            <html lang="en">
              <head>
                <meta charset="UTF-8" />
                <link rel="icon" type="image/svg+xml" href="/favicon.ico" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>Streamlined Affiliate Network</title>
              </head>
              <body>
                <div id="root"></div>
                <script type="module" src="/src/main.tsx"></script>
              </body>
            </html>`,
            {
              headers: {
                'content-type': 'text/html',
              },
            }
          );
        },
        { port, hostname }
      );
    } catch (error) {
      console.error('Server failed to start:', error);
    }
  };

  serve();
}
