---
title: "A docs site built from the Markdown it shows"
description: "docs.pacestreak.com renders the infrastructure repository's own Markdown: topology, runbook, decision records and a page for every repository. It is built so it can't drift from the files, and a weekly check fails when the list of repositories does."
date: 2026-10-21T19:00:00Z
tags: ["infrastructure", "docs", "open-source"]
---

PaceStreak's infrastructure lives in a repository called `infra`, and it is
almost entirely Markdown: the DNS and hosting topology, a runbook of failure
modes that actually happened, every decision with its date and status, a
changelog and an operating guide. It was all public on GitHub. It just wasn't
pleasant to read there, and nothing pointed to it from the rest of the
product.

[docs.pacestreak.com](https://docs.pacestreak.com) is the fix. This post is
about how it is built, because the interesting part is what it refuses to do.

## The Markdown stays the source

The site lives in `infra/site/` and reads the repository's root Markdown
files at build time. Nobody edits the site's copy of the runbook, because
there isn't one. The files that agents and people already edit are the files
that get rendered.

The pipeline is remark and rehype (`remark-parse`, `remark-gfm`,
`remark-rehype`), run by Astro 7 into static pages. A few things happen on
the way:

- **Links between documents are rewritten.** `./RUNBOOK.md#symptom` in the
  Markdown becomes `/runbook#symptom` on the site. A link to another
  repository's file goes to GitHub.
- **Broken links fail the build.** Every internal link and every `#anchor`
  is checked against the headings that actually exist. A renamed heading
  can't leave a dead link behind.
- **Decision records become cards.** `DECISIONS.md` has 26 records. The site
  reads each one's date and status line, and marks superseded records, so
  the history stays visible without reading like current advice.
- **The runbook gets an index** of its failure modes at the top.
- **The topology becomes a diagram**: an inline SVG drawn at build time
  from the same data, readable in both themes, with the original tables
  kept underneath.

## A stricter policy than the blog's

Every PaceStreak site ships `default-src 'self'` with no inline scripts.
The blog has to allow inline _styles_, because the syntax highlighter colours
each code token with a `style` attribute.

The docs site doesn't allow them. Shiki still highlights code at build time,
but `transformerStyleToClass` turns each colour into a class, and the classes
are written to one stylesheet. The policy is:

```text
default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:;
font-src 'self'; connect-src 'self'; base-uri 'self'; form-action 'self';
frame-ancestors 'none'
```

The site's checker (`check-html.py`, extended from the blog's) fails the
build on any `style=` attribute, any inline `<style>` or `<script>`, or any
resource from another origin.

That rule also shapes the theme toggle. Choosing a theme before the first
paint usually means an inline script in `<head>`. Here it is a tiny external
file, which `script-src 'self'` allows.

## Search without a service

Search opens with `/` or Ctrl+K. The index is a JSON file built with the
site, one entry per heading section, and the search script is a small file of
our own. There is no WebAssembly, no hosted search and no request anywhere
else. Picking a result jumps straight to that section.

## Every repository, in one place

The site is about more than `infra`. `/repos` has a page for each of the eight
repositories: what it is, where it runs, how it deploys, its CI and the rules
that matter in it. `/stack` draws the whole product, from the browser to the
Worker, D1, the queue, the mail relay and the backups.

Those facts can't be read from the other repositories at build time, so they
live in one typed file, `site/src/data/repos.ts`, and each entry carries the
date it was last checked. That is exactly the kind of page that goes stale,
so it has a guard.

## An API reference that can't drift

FastAPI used to give the old Python service a `/docs` page for free. The
Worker has no such page, and adding one there would cost bundle size the
Free plan's budget doesn't have. Instead, `pnpm openapi` in the `api`
repository walks the real router and writes `openapi.json`: 272
operations, the same 272 the router mounts, with request schemas taken from
the Zod validators the routes already use. CI regenerates it on every push
and fails if the committed copy is stale.

The docs site renders that file at build time into
[/api](https://docs.pacestreak.com/api): one page per area, a parameter
table and response schema for every operation, and a curl example. The usual
API explorers style themselves with inline styles, which the policy above
blocks, so the reference is plain HTML with no client-side code at all. The
site keeps a copy of the spec, and the freshness check below fails when it
differs from the `api` repository's.

## The check that fails when it drifts

`site/scripts/check-freshness.mjs` runs in CI on every push and once a week:

1. Every repository in the PaceStreak GitHub organisation must have an
   entry, and every entry must still be a repository. A new repository with
   no docs fails the check.
2. Every live URL in the file must answer.
3. An entry not re-checked for 60 days raises a warning.

Every README now ends with the same short "Where everything lives" table,
so all the repositories point at each other and at the docs. The status
page watches the docs site and its certificate like every other host.

## Not for search engines

The site sends `X-Robots-Tag: noindex, nofollow` and its `robots.txt`
disallows everything. Nothing in it is secret: the repository is public, and
no key or token is ever committed. But a page listing hostnames, the account
layout and how things fail is for the people working on PaceStreak, not for
search results.
