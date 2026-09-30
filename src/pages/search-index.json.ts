import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { categoryFor } from "../lib/categories";

// A same-origin JSON file, not a third-party search service — the CSP's
// `connect-src 'self'` already allows fetching this, no exception needed.
// Small on purpose: title, description and tags are enough to search
// against, and shipping post bodies here would make the index heavier than
// most of the posts it's searching.
export const GET: APIRoute = async () => {
  const posts = (await getCollection("blog", ({ data }) => !data.draft)).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf(),
  );

  const index = posts.map((post) => ({
    slug: post.id,
    title: post.data.title,
    description: post.data.description,
    tags: post.data.tags,
    category: categoryFor(post.data.tags).label,
    date: post.data.date.toISOString(),
  }));

  return new Response(JSON.stringify(index), {
    headers: { "Content-Type": "application/json" },
  });
};
