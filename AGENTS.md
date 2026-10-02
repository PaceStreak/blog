# AGENTS.md — blog

The blog, `blog.pacestreak.com` (Astro, static).

Workspace-wide rules (CSP, cookies, privacy, commit conventions, what is
already decided) live in the root
[`AGENTS.md`](https://github.com/PaceStreak/pacestreak/blob/main/AGENTS.md).
Read it first; this file only adds what is specific to this repository.

## Commands

```bash
npm ci                       # npm ci, not install: it caught a peer-dep conflict once
npm run dev                  # :4321
npm run build && python3 check-html.py dist   # what CI and Cloudflare run
```

## Rules for this repo

- A post is one Markdown file in `src/content/blog/`; frontmatter is
  validated. Every post gets a share card at build time; CI fails without one.
- Write posts from the code, not from memory. Every repo is public, so a
  reader can check.
- Use markdownlint's underscore emphasis.
- CSP is `default-src 'self'` with no `unsafe-inline`. No CDN, font service,
  analytics or third-party script. `assetsInlineLimit: 0` in
  `astro.config.mjs` is load-bearing.
- `Cache-Control: no-transform` on page routes in `public/_headers` is
  load-bearing (it stops Cloudflare injecting a beacon the CSP blocks).
- `404.html` must exist in `dist`; CI asserts it.
- Astro collapses whitespace between text and an inline element; use `{" "}`.
  `check-html.py` fails the build on it.
- Inside `.wrap`, use `padding-block`, never the `padding` shorthand.

## Deploying

Push to `main`; Cloudflare Pages builds it. Verify after propagation, not
seconds after pushing.

## Commits

Conventional commits, subject says what, body says why. Commit as
`AlzyWelzy <welzyalzy@gmail.com>`. **Never credit an AI tool**: no
`Co-Authored-By` trailer and no "Generated with" line, in commits or PRs.
This repository is public, so never commit a secret.
