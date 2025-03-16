
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '@/styles/theme.css';
import '@radix-ui/themes/styles.css';
import { serve } from "https://deno.land/std@0.140.0/http/server.ts";

// Render React app
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Get port from environment variable or use 8080 as default
const port = parseInt(Deno.env.get("PORT") || "8080");
console.log(`HTTP server running on port ${port}`);

// Start server
serve((req) => {
  return new Response("Server is running!", { status: 200 });
}, { port });
