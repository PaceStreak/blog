---
title: "Every choice in the stack, and why"
description: "The complete technology list behind PaceStreak — domain, sites, monitoring, backend, tooling — with the reasoning, the rejected alternatives, and the constraints each choice created for the next one."
date: 2026-08-30
tags: ["stack", "infrastructure", "astro", "python", "cloudflare"]
---

There is no product yet. There is a domain, four hostnames, two deployed sites,
public uptime monitoring, and a backend repository with a stack but no
endpoints.

That is a good moment to write the choices down, because right now every one of
them is still cheap to reverse. In six months some of them will not be, and the
reasoning will have evaporated.

This is the whole list. Where a choice created a constraint somewhere else — and
most of them did — it says so.

## The organising principle

One idea runs through nearly everything below: **prefer the boring thing that
fails loudly over the clever thing that fails silently.**

That sounds like a platitude until it starts costing you. Almost every bug worth
writing about here has been a silent one — a page that served with a 200 and the
wrong content, a DNS record that returned an error page instead of not existing,
a security header that dropped the site's own styles without a console warning.
None of them threw. All of them were found by looking.

## Domain and DNS

**Cloudflare DNS**, on the free plan.

`www.pacestreak.com` is canonical and the apex `pacestreak.com` redirects to it
with a 301. That was not the obvious pick — the usual argument for `www` is
cookie isolation, and it does not apply here. The API lives on
`api.pacestreak.com`, so the session cookie has to be scoped to
`Domain=pacestreak.com` regardless, which means `www` isolates nothing. Blast
radius is identical either way.

The reasons that did survive: consistency with other domains I run, and DNS
portability. `www` is a plain CNAME that works at any provider, while an apex
CNAME depends on **CNAME flattening**, which is a Cloudflare feature. RFC 1034
forbids a CNAME coexisting with other records at a name, and the apex has to
carry SOA, NS and — because mail is on Zoho — MX. Cloudflare resolves the target
server-side and answers with A records, which is the only reason the apex CNAME
and the MX records can share a name at all.

Move DNS to a provider without flattening and that apex record becomes
hardcoded A records maintained by hand.

**Mail is Zoho**, with SPF, DKIM and DMARC on the apex. Nothing clever; it just
has a free tier for a custom domain and gets `hello@pacestreak.com` delivered.

One rule learned the hard way and now written in the runbook: **never create a
proxied DNS record before something is behind it.** A proxied record with no
origin returns a Cloudflare `522`, which to a visitor reads as "this product is
broken". Before the record, the hostname simply does not exist, which reads as
"not launched yet". The second is strictly better. This is why
`app.pacestreak.com` and `api.pacestreak.com` still have no records.

## Hosting

**Cloudflare Pages**, connected directly to GitHub.

Push to `main` deploys. There is no deploy workflow in either site repository and
no API token stored anywhere, which removes an entire category of secret to
rotate and leak.

Getting here involved a wrong turn worth recording: I concluded early that a
Pages project created by direct upload could not be converted to a Git-connected
one, because the API reports `source: NONE` until a connection exists. That is
"not configured", not "impossible" — the dashboard connects them fine. The cost
of that mistake was an unnecessary detour through GitHub Actions deployment and
an API token that turned out not to be needed.

**What Pages does not do by default is the thing that bites.** It answers every
unknown path with `index.html` and a **200**. That is a soft 404: search engines
index the homepage under any number of wrong URLs, and a mistyped link looks like
it worked. On the blog it was worse than cosmetic — before a `404.html` existed,
`/robots.txt` returned the site's full HTML, and Cloudflare appended that to its
own content-signals policy. Crawlers were handed a robots.txt with an HTML
document inside it.

Both sites now assert in CI that `404.html`, `robots.txt`, `_headers` and the
sitemap are actually in the build output.

## The sites

**Astro 7**, static output, no client framework.

The job of `www.pacestreak.com` is to explain a product to a stranger in one
page load. That is a document, not an application, and Astro is built for the
document case: it renders to HTML at build time and ships zero JavaScript unless
you explicitly ask for a client component.

The blog gets more out of it than the marketing site does. **Content collections**
validate frontmatter against a schema, so a missing title or a malformed date
fails the _build_ rather than publishing something broken. Tags, previous/next
links, reading time and structured data are all derived from the collection —
there is nothing to maintain by hand per post.

### Why not SvelteKit, Next, or a client-side router

This came up honestly: navigating between pages is a full document load, which
feels like a "reload", and a client-side router would make it feel instant.

So I measured it before acting. From Cloudflare's edge:

| Page       | TTFB  | Total |
| ---------- | ----- | ----- |
| `/`        | 69ms  | 86ms  |
| `/about`   | 70ms  | 83ms  |
| `/faq`     | 105ms | 117ms |
| `/privacy` | 77ms  | 92ms  |

Under 120ms for a complete page, and Astro's prefetcher has usually fetched the
next page before the click even lands. **Navigation was never slow. It looked
abrupt**, which is a different problem with a much cheaper fix.

The fix is four lines of CSS and no JavaScript at all:

```css
@view-transition {
  navigation: auto;
}
```

Cross-document view transitions. The browser holds the old page on screen,
fetches the new document, and cross-fades. Chromium 126+ and Safari 18.2+
animate it; every other browser navigates exactly as it did before. Nothing to
polyfill, nothing shipped to the client.

A SvelteKit rewrite would have added a client runtime, hydration, and an adapter
decision, to solve a 90ms problem that turned out to be a paint problem. The
right time to reach for a framework like that is when there is genuine
client-side state to manage — which is exactly what `app.pacestreak.com` will
have, and it is a separate repository for that reason.

### Tailwind CSS v4

Compiled through `@tailwindcss/vite`, not the play CDN — and that distinction
is forced, not stylistic.

`cdn.tailwindcss.com` is a third-party script. Both sites ship
`default-src 'self'`, so it would be **blocked in production while working
perfectly in local preview**. Compiling at build time is the only version of
Tailwind that can ship here.

Design tokens live in one `@theme` block, which is what makes v4 worth the
change:

```css
@theme {
  --color-accent: #d3ff3e;
}
```

That single declaration generates `bg-accent`, `text-accent`, `border-accent`
and the rest. One definition, no config file, and no way for a token and its
utility to drift apart.

Utilities do not win everywhere. Long-form prose is styled with hand-written CSS
because the rules have to apply to markdown output that has no classes to hang
utilities on. `@layer components` holds the rest of the exceptions: the activity
grid, the buttons, the page gutter. The test is simple — if a component rule
could be three utility classes in the markup, it should be.

## Security headers

Both sites ship a content security policy. The important part is
`script-src 'self'` with no `'unsafe-inline'`, and it is load-bearing rather
than defence in depth: it is the reason there are no third-party runtime
dependencies, no analytics, no font CDN and no embedded widgets. If someone
added a tracker it would not run.

It has already caught two build-tool behaviours that would otherwise have
shipped broken: Astro inlining a small `<script>` into the HTML, and Vite
emitting a sub-4KB asset as a base64 `data:` URI. Both are fixed with
`assetsInlineLimit: 0`, not by loosening the policy.

**The two sites differ on `style-src`, and the difference is instructive.**
The marketing site is strict at `'self'`. The blog allows `'unsafe-inline'`,
because Shiki highlights code at build time by putting a `style` attribute on
every single token. Under a strict policy the browser drops each of those
declarations silently and every code block renders as flat, colourless text —
perfect in local preview, broken in production.

That trade is acceptable because the dangerous half is `script-src`, which stays
strict on both. Inline styles cannot execute; they are a defacement and
exfiltration concern, not an XSS one, and neither site renders user input.

Writing this post is what surfaced that the blog had **no CSP at all** — the
header file set everything else and simply omitted it, while three separate
documents claimed otherwise. Documentation drift is its own bug class.

### A build guard instead of a habit

`check-html.py` runs in CI against the built output on both sites. It fails the
build on things that ship silently:

- Collapsed whitespace around inline elements. Astro removes the whitespace
  between a text node and an inline tag, which shipped
  `Write tohello@pacestreak.com` three separate times before this existed.
- Inline `<script>` bodies and `data:` URIs, which `script-src 'self'` blocks.
- Inline `style` attributes, which `style-src 'self'` drops — added after
  a `view-transition-name` nearly shipped that way.
- Typed separators inside footer link lists, where CSS already draws one.

Every rule is tested against a known-bad fixture rather than merely asserted to
pass. The first version of the whitespace check only matched letters, so it gave
a clean bill of health to `</a> ·<a>` — a rule that cannot fail is not a rule.

## Monitoring

**Upptime**: GitHub Actions on a schedule, GitHub Issues as the incident log,
GitHub Pages for the status page. No servers, no account, free.

`status.pacestreak.com` is the one **grey-cloud** DNS record on the domain —
proxying it would break GitHub's certificate issuance, and once issued there is
still no reason to proxy it. A status page that fails when Cloudflare fails is
not a status page.

It monitors the apex and `www` separately, which is not redundant: Cloudflare
Pages issues a **separate certificate per custom domain**, with different SAN
lists and different expiry dates. One check cannot cover both.

The status repository is the only public one, and the only one under MIT — it is
largely upstream Upptime code, and relicensing someone else's work is not mine
to do.

## The backend

Nothing is built. The stack is chosen and the constraints are written down.

**Python 3.14 and FastAPI**, with the Astral toolchain: **uv** for packaging and
the interpreter itself, **Ruff** for linting and formatting, **ty** for type
checking.

uv is the piece that earns its place most obviously. It manages the Python
version as well as the packages, so there is no `pyenv` step and no way for CI
and a laptop to end up on different interpreters. `uv sync --locked` fails when
the lockfile has drifted from `pyproject.toml` rather than quietly resolving
something that was never tested, and the same command runs in CI and in the
Docker build.

Ruff replaces the flake8-plus-isort-plus-black stack with one binary and one
config block. ty is the one to be honest about: it is **pre-1.0**, its
diagnostics still move between releases, and it is pinned through the lockfile
so a new version cannot break CI without a reviewable commit. If it becomes an
obstacle, swapping it for mypy is a `pyproject.toml` change rather than a
rewrite — nothing depends on ty-specific syntax.

### What choosing FastAPI cost

This is the most consequential decision in the whole project, and it is worth
being blunt about the bill.

Everything else here is free-tier serverless on Cloudflare. The architecture
notes originally said Workers plus D1 was the path of least resistance, on
exactly those grounds.

**FastAPI closes that path.** Cloudflare's Python Workers run under Pyodide and
will not carry FastAPI together with a real database driver. So the API needs a
container host, and it will be the first component of PaceStreak that is not
free.

That is a real cost accepted for a real reason, and the mitigation is that
nothing about it is locked in: the Dockerfile produces a ~64MB non-root image
that any container host will take. Cloud Run and Fly both scale to zero and stay
near-free at this traffic. Whatever runs it still sits behind Cloudflare's proxy
on `api.pacestreak.com`, so the edge, TLS and WAF are unchanged.

### Docker, Postgres, Redis

A two-stage build: dependencies install before the source is copied, so editing
a handler rebuilds one small layer instead of reinstalling everything. The
runtime image carries no build tooling and no uv binary, and runs as a non-root
user, because a container escape and a container escape as uid 0 are different
conversations.

The entrypoint picks between `fastapi dev` and `fastapi run` from `$APP_MODE`,
so one image covers development and production and the only thing that changes
is an environment variable in the compose file.

Postgres and Redis are in the compose stack with real healthchecks and
`depends_on: condition: service_healthy` — **not `service_started`**. Postgres
accepts TCP connections several seconds before it will accept queries, and
starting the API on "started" produces a crash loop that looks convincingly like
an application bug.

Those failures, and the two subtler ones that came with them, are in
[the previous post](/posts/four-things-that-only-break-in-a-container).

## Repositories and licensing

Seven repositories in a GitHub organisation rather than one monorepo. The split
follows deployment boundaries: `web`, `app`, `api`, `blog` and `status` each
deploy independently, plus `infra` for documentation and `.github` for the
organisation profile and shared community health files.

A monorepo would be defensible and mostly nicer to work in. It loses on the one
axis that matters right now: Cloudflare Pages connects to a repository, and one
repository per site means a push cannot trigger the wrong build.

**AGPL-3.0** for everything that is product code. It closes the hosting loophole
GPL leaves open — a competitor cannot take this, run a closed service from it,
and owe nothing back. Worth knowing that this direction is one-way: a permissive
licence can be granted later, but it cannot be withdrawn from code already
published.

Two exceptions, both MIT: `status` for the upstream reason above, and `.github`
because templates are more useful when they are reusable.

`.github` is also the second **public** repository, and that is not an oversight.
A private `.github` repository breaks the organisation profile page and stops
the shared health files applying to public repositories — it fails in a way that
looks like nothing happening at all.

## Process

Conventional commits, where the subject says what changed and the body says
**why**, because the what is already in the diff.

CI is pull-request gating only — it never deploys, because Cloudflare does that.
GitHub Actions are pinned to commit SHAs rather than tags: a tag is mutable, and
a moved tag is a supply-chain compromise that leaves no diff behind.

Dependabot covers uv, Actions and Docker, with minor and patch updates grouped
so a routine week is one pull request rather than eight.

`pre-commit` runs Ruff and a lockfile check locally, so a failing commit is
caught in a second rather than in three minutes. The authority is still CI —
local hooks are a convenience, and treating them as the gate means the first
contributor who skips them breaks `main`.

## What is deliberately still open

- **Where the API runs.** Cloud Run and Fly are the shortlist; nothing is
  decided, and the Dockerfile keeps every option available.
- **Database and ORM.** Coupled to the hosting decision, and picking a managed
  Postgres before picking a host is how a service ends up paying egress on every
  query.
- **How the app is rendered.** A static shell or server-rendered, in
  `app.pacestreak.com`. The default absent an argument is the static shell,
  because signed-in responses must never reach a shared cache and that is much
  easier to guarantee when the shell holds no user data.

Each of those is written down as open rather than defaulted quietly, which is
the only reliable way I know to notice that a decision was made by accident.
