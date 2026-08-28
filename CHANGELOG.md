# Changelog

Notable changes to the blog itself, not to its posts.

## 2026-08-28

### Added

- Initial Astro site: content collection with a validated frontmatter schema,
  post route, RSS feed, sitemap, and a design matching the PaceStreak brand.
- First post.
- Auto-deploy to Cloudflare Pages on push to `main`.

### Fixed

- `.brand` is inline-flex with a gap, which applied *between* the two wordmark
  spans and rendered the name as "Pace Streak".
