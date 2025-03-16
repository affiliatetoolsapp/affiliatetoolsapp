
/// <reference types="vite/client" />

// Add Deno global declarations for TypeScript
declare namespace Deno {
  export interface Env {
    get(key: string): string | undefined;
  }
  export const env: Env;
}

// Add declaration for HTTP server import
declare module 'https://deno.land/std@0.204.0/http/server.ts' {
  export function serve(
    handler: (request: Request) => Response | Promise<Response>,
    options?: { port?: number; hostname?: string }
  ): Promise<void>;
}
