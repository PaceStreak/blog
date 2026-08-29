# Contributing

This is a personal blog, so "contributing" mostly means _writing a post_.
For contributions to PaceStreak itself, see the
[organization guide](https://github.com/PaceStreak/.github/blob/main/CONTRIBUTING.md).

## Writing a post

Add one markdown file to `src/content/blog/`. Nothing else — no design step, no
route to register, no index to update.

```markdown
---
title: "What I changed and why"
description: "One sentence. Shows on the index and in link previews."
date: 2026-09-01
tags: ["infrastructure"]
draft: false
---

Write here.
```

The filename becomes the URL: `my-post.md` → `/posts/my-post`.

**Frontmatter is validated, not suggested.** `src/content.config.ts` defines the
schema, so a missing `title` or a malformed `date` fails the build. That is
deliberate: a post that silently renders with no date is worse than one that
refuses to publish.

Set `draft: true` to keep a post out of the index, the RSS feed and the sitemap
while you work on it.

## Before pushing

```bash
npm run format     # prettier
npm run check      # astro check — types and the content schema
npm run build      # the real build
```

CI runs all three on every push, plus markdownlint, plus an assertion that
`404.html`, `robots.txt`, `sitemap-index.xml` and `rss.xml` were emitted.

## Changing the design

You should not need to, but it lives in `src/styles/global.css` and the two
layouts. Two things to know before touching them:

- **`assetsInlineLimit: 0` in `astro.config.mjs` is load-bearing.** Vite inlines
  assets under 4KB as `data:` URIs and Astro inlines small `<script>` blocks.
  The Content-Security-Policy served from `public/_headers` has no
  `unsafe-inline`, so either would be blocked by the browser — silently.
- **No third-party runtime dependencies.** The CSP is `default-src 'self'`. A
  font CDN or analytics script will be blocked, and blocked quietly.

## Security

Do not open an issue for a security problem. Email
**<hello@pacestreak.com>** — see [SECURITY.md](./SECURITY.md).
