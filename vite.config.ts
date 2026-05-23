// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
// @cloudflare/vite-plugin builds from this — wrangler.jsonc main alone is insufficient.
export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
    // Prerender only "/" to generate the index.html Vercel needs to serve the SPA.
    // crawlLinks is OFF to avoid the internal server import error on Vercel.
    // The real API is never called during prerender because:
    //   1. merchants queryFn has a try/catch that returns [] on error.
    //   2. Set PRERENDER_USE_FIXTURES=true in Vercel env vars as an extra guard.
    // All other routes use the SPA fallback rewrite in vercel.json.
    prerender: {
      enabled: true,
      crawlLinks: false,
      routes: ["/"],
    },
  },
});
