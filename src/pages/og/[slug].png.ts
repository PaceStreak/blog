import type { APIRoute, GetStaticPaths } from "astro";
import { getCollection, type CollectionEntry } from "astro:content";
import { formatDate, readingTime } from "../../lib/post";
import { renderCard } from "../../og/card";

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getCollection("blog", ({ data }) => !data.draft);
  return posts.map((post) => ({ params: { slug: post.id }, props: { post } }));
};

export const GET: APIRoute = async ({ props }) => {
  const { post } = props as { post: CollectionEntry<"blog"> };
  const png = await renderCard({
    title: post.data.title,
    meta: `${formatDate(post.data.date)} · ${readingTime(post.body ?? "")} min read`,
    tags: post.data.tags,
  });
  return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png" } });
};
