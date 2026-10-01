import { getCollection } from "astro:content";

// llms.txt (llmstxt.org) for the blog: an H1, a summary, and every post as a
// link, generated from the collection so it can never fall behind the index.
export async function GET() {
  const posts = (await getCollection("blog", ({ data }) => !data.draft)).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf(),
  );
  const lines = [
    "# PaceStreak blog",
    "",
    "> How PaceStreak, a habit and streak tracker, is built in the open: the streak engine, offline sync, auth, privacy rules, food and insights, and the production failures along the way.",
    "",
    "The product is described at https://www.pacestreak.com (see https://www.pacestreak.com/llms.txt).",
    "",
    "## Posts",
    "",
    ...posts.map(
      (p) =>
        `- [${p.data.title}](https://blog.pacestreak.com/posts/${p.id}): ${p.data.description}`,
    ),
    "",
    "## Optional",
    "",
    "- [RSS feed](https://blog.pacestreak.com/rss.xml)",
    "- [All tags](https://blog.pacestreak.com/tags)",
    "",
  ];
  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
