# Changelog

Notable changes to the blog itself, not to its posts.

## [Unreleased]

### Added

- `AGENTS.md` with this repository's commands and rules for coding agents; the
  README and architecture notes now describe the live deployment, not a plan.
- A share card per post (`dist/og/<slug>.png`), rendered at build time with
  Satori and resvg; CI fails if a post has none.

- Ten posts covering everything built so far: streaks, XP, offline sync, auth,
  social privacy, the worker, data ownership, pauses and file import, the
  website rebuild, and a status report.

- **A content security policy.** This site had none at all — `public/_headers`
  set every other security header and simply omitted the CSP, while the README,
  the organisation contributing guide and a post all claimed otherwise.
  `script-src` is strict `'self'`; `style-src` allows `'unsafe-inline'` because
  Shiki colours every token with a `style` attribute at build time, and under a
  strict policy the browser drops each one silently — every code block renders
  as flat, colourless text in production while looking perfect locally.
- **Cross-document view transitions, in CSS.** Zero JavaScript; supported
  browsers cross-fade between posts, the rest navigate as before.
- `check-html.py` now fails on inline `style` attributes, with `<pre>` exempt
  for the Shiki reason above.
- **Tag pages.** `/tags` lists every topic by post count, and `/tags/<tag>`
  lists the posts. The schema has supported `tags` since the first commit;
  nothing rendered them until now.
- **Previous/next navigation** between posts, computed in `getStaticPaths`
  where the sorted list already exists rather than re-sorting the collection
  once per page.
- **`BlogPosting` structured data and `article:published_time`** on every post,
  plus `og:type=article`. Search engines previously had no author, date or
  headline for any post.
- Reading time and a table of contents (h2s only, and only when there are more
  than two).
- **Tailwind CSS v4**, compiled through `@tailwindcss/vite`. Post cards are now
  fully clickable, with the tag links raised above the overlay so they stay
  reachable.
- Link prefetching on hover and in viewport.
- `tsconfig.json` (astro/strict) — the TypeScript in `content.config.ts` and
  `rss.xml.ts` was previously unchecked.
- Prettier, `.editorconfig`, `.nvmrc`, and an `engines` field.
- CI: format check, `astro check`, build, markdownlint, and an assertion that
  `404.html`, `robots.txt`, `sitemap-index.xml` and `rss.xml` are emitted — so
  the bug above cannot recur silently.
- Dependabot for npm and GitHub Actions, grouped.
- `CONTRIBUTING.md` and `SECURITY.md`. These exist per-repo because community
  health files in a _public_ `.github` repository do not apply to _private_
  ones, and this repository is private.

## 2026-08-28

### Added

- Initial Astro site: content collection with a validated frontmatter schema,
  post route, RSS feed, sitemap, and a design matching the PaceStreak brand.
- First post.
- Auto-deploy to Cloudflare Pages on push to `main`.

### Changed

- **A published post made a false claim, now corrected in place.** "Every choice
  in the stack" said that choosing FastAPI ruled out Cloudflare Workers and made
  the API the first component that would not be free. Python Workers do support
  FastAPI — Cloudflare publishes a `fastapi-todo` example running it against D1
  — and the database is reached through a binding rather than a driver, so the
  missing C-extension drivers do not matter. The section is rewritten, the
  original wording quoted rather than deleted, and the post carries a dated
  correction notice.
- **The README claimed two things that were not true.** It documented a
  `.github/workflows/deploy.yml` that does not exist — deployment is
  Cloudflare's Git integration — and it said no JavaScript is shipped, which
  stopped being true the moment prefetching was enabled. Both corrected.

### Fixed

- **Layout: `.intro` and `.post` were killing their own horizontal gutter.**
  Both elements carry `class="wrap intro"` / `class="wrap post"`, and their
  `padding` shorthand sat later in the stylesheet at the same specificity as
  `.wrap`, resetting `padding-inline` to 0. The heading therefore sat 24px
  left of the post card, and on a phone the text ran to the screen edge.
  Now `padding-block`, so `.wrap`'s gutter survives. Same class of bug as the
  landing page's activity grid.
- **The page did not fill the viewport**, so the footer floated mid-screen on
  short pages. `body` is now a flex column with `min-height: 100vh`.
- **Cramped mobile nav.** The brand's "build log" label wrapped onto a second
  row at phone widths and squeezed the links; it is hidden below 560px.

- **No 404 page.** Cloudflare Pages answered every unknown path with index.html
  and a 200. That was not only a soft 404: with no `robots.txt` in the build,
  `/robots.txt` returned the site's HTML, and Cloudflare concatenated it onto
  its own content-signals policy — crawlers were handed a robots.txt with a
  full HTML document inside it.
- **No `robots.txt`.** Added, with the sitemap directive.

- `.brand` is inline-flex with a gap, which applied _between_ the two wordmark
  spans and rendered the name as "Pace Streak".
