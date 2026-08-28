# PaceStreak build log

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

**Push to `main`.** [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)
builds and publishes to Cloudflare Pages, then checks the live site actually
serves before going green.

## Layout

```text
src/content/blog/     Your posts. The only directory you need.
src/content.config.ts Frontmatter schema.
src/layouts/          Page shell and post shell.
src/pages/            Index, post route, RSS feed.
src/styles/global.css All of the design, in one file.
public/               favicon, _headers.
```

## Notes

**No JavaScript is shipped.** Astro renders to static HTML and this site has no
client-side components. If you add one, it will start shipping JS — which is
fine, just know that it is a change rather than the default.

**Code blocks are highlighted at build time** by Shiki, so there is no
highlighting library in the browser.

**The og:image points at the product site**, `www.pacestreak.com/brand/social/og.png`.
If that path ever moves, link previews for every post break at once.
