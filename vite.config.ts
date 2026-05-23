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
  // Disable @cloudflare/vite-plugin: it conflicts with TanStack Start's prerender
  // server in Vercel's Node 24 build environment, causing "Internal Server Error"
  // when the prerender phase tries to fetch "/".
  cloudflare: false,
  tanstackStart: {
    server: { entry: "server" },
    // Prerender only "/" (no crawling) to generate the index.html Vercel needs.
    // All other routes are served via the SPA fallback rewrite in vercel.json.
    prerender: {
      enabled: true,
      crawlLinks: false,
      routes: ["/"],
    },
  },
});
