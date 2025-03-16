
/// <reference types="vite/client" />

// Add Deno global declarations for TypeScript
declare namespace Deno {
  export interface Env {
    get(key: string): string | undefined;
  }
  export const env: Env;
}
