
/// <reference types="vite/client" />

// Deno global declaration for TypeScript
declare namespace globalThis {
  interface DenoNamespace {
    env: {
      get(key: string): string | undefined;
    };
  }
  
  var Deno: DenoNamespace;
}

// Declaration for dynamic import of Deno modules
declare module 'https://deno.land/std@0.140.0/http/server.ts' {
  export function serve(
    handler: (req: Request) => Response | Promise<Response>,
    options?: { port?: number }
  ): void;
}
