// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://blog.pacestreak.com",
  integrations: [sitemap()],
  // Trailing slashes must match what Cloudflare Pages serves, or canonical
  // URLs and the sitemap disagree with reality.
  trailingSlash: "never",
  build: { format: "file" },
  markdown: {
    shikiConfig: { theme: "github-dark-default", wrap: true },
  },
});
