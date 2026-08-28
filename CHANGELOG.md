# Changelog

Notable changes to the blog itself, not to its posts.

## [Unreleased]

### Fixed

- **No 404 page.** Cloudflare Pages answered every unknown path with index.html
  and a 200. That was not only a soft 404: with no `robots.txt` in the build,
  `/robots.txt` returned the site's HTML, and Cloudflare concatenated it onto
  its own content-signals policy — crawlers were handed a robots.txt with a
  full HTML document inside it.
- **No `robots.txt`.** Added, with the sitemap directive.

### Added

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

### Fixed

- `.brand` is inline-flex with a gap, which applied _between_ the two wordmark
  spans and rendered the name as "Pace Streak".
