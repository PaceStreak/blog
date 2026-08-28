import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// The schema is the point of using a collection rather than a folder of files:
// a mistyped date or a missing title fails the BUILD, loudly, instead of
// shipping a post that renders wrong.
const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    // Set true to keep a post out of the index, the RSS feed and the sitemap.
    draft: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { blog };
