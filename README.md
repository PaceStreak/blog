# PaceStreak Blog

The blog at **[blog.pacestreak.com](https://blog.pacestreak.com)** — notes on
building PaceStreak in the open.

Copyright (c) 2026 PaceStreak. Licensed under [AGPL-3.0](./LICENSE).

## Writing a post

Add one markdown file to `src/content/blog/`. That is the entire workflow —
there is no design step, and you should never need to touch a `.astro` or
`.css` file to publish.

```markdown
---
title: "What I changed and why"
description: "One sentence — this is what shows on the index and in link previews."
date: 2026-09-01
tags: ["infrastructure"]
draft: false
---

Write here.
```

The filename becomes the URL: `my-post.md` → `/posts/my-post`.

**Frontmatter is validated, not suggested.** `src/content.config.ts` defines a
schema, so a missing `title` or a malformed `date` fails the _build_ rather than
publishing something broken. That is deliberate — a blog that silently renders a
post with no date is worse than one that refuses to build.

Set `draft: true` to keep a post out of the index, the RSS feed and the sitemap
while you work on it.

## Running it locally

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # writes dist/
```

## Deploying

**Push to `main`. That is the whole process.** The Cloudflare Pages project is
connected to this repository through Cloudflare's GitHub integration and builds
on every push — there is no deploy workflow here and no API token to manage.
`.github/workflows/ci.yml` exists only to fail a pull request before it reaches
`main`.

## Layout

```text
src/content/blog/     Your posts. The only directory you need.
src/content.config.ts Frontmatter schema.
src/layouts/Base      Head, nav, footer, structured data.
src/components/       PostCard.
src/lib/post.ts       Date formatting and reading time, shared so the index,
                      the tag pages and the post template cannot disagree.
src/pages/            Index, post route, tag pages, RSS feed, 404.
src/styles/global.css Tailwind theme tokens + article typography.
public/               favicon, robots.txt, _headers.
```

Tags are automatic: put them in a post's frontmatter and `/tags` and
`/tags/<tag>` are generated from the collection. Previous/next links, the
reading time and the `BlogPosting` structured data are derived too — there is
nothing to maintain by hand per post.

## Notes

**Almost no JavaScript is shipped.** There are no client-side components. The
one script is Astro's ~2.5KB link prefetcher, enabled in `astro.config.mjs`,
which warms pages on hover and in viewport. If you add a component with a
`client:` directive it will start shipping more — fine, but it is a change
rather than the default.

**Styling is Tailwind v4**, compiled through `@tailwindcss/vite`. The play CDN
is not usable: it is a third-party script and this site ships
`default-src 'self'`, so it would be blocked in production while working
perfectly in local preview. Long-form prose is the exception to utilities — the
`.article` rules in `global.css` style markdown output that has no classes to
hang utilities on.

**Code blocks are highlighted at build time** by Shiki, so there is no
highlighting library in the browser.

**The og:image points at the product site**, `www.pacestreak.com/brand/social/og.png`.
If that path ever moves, link previews for every post break at once.
