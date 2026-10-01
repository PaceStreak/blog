// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://blog.pacestreak.com",
  integrations: [sitemap()],
  // Trailing slashes must match what Cloudflare Pages serves, or canonical
  // URLs and the sitemap disagree with reality.
  trailingSlash: "never",
  // CSS inlined into each page so the first paint doesn't wait on a
  // render-blocking request. The blog's style-src already allows inline
  // styles (Shiki needs them; see public/_headers), so no hashes are needed.
  build: { format: "file", inlineStylesheets: "always" },
  markdown: {
    shikiConfig: { theme: "github-dark-default", wrap: true },
  },

  // <link rel="prefetch"> on hover and in-viewport. A browser hint, not a
  // script, so it costs nothing under `default-src 'self'`.
  prefetch: { prefetchAll: true, defaultStrategy: "viewport" },

  vite: {
    // Tailwind v4 compiles through Vite. The play CDN would be a third-party
    // script and this site ships `default-src 'self'`, so it would be blocked
    // in production while working fine in local preview.
    plugins: [tailwindcss()],
    build: {
      // Vite inlines assets under 4KB as base64 data: URIs and Astro inlines
      // small scripts. `script-src 'self'` blocks both, silently.
      assetsInlineLimit: 0,
    },
  },
});
