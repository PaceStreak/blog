---
title: "Setting up PaceStreak in public"
description: "Domains, monitoring, a status page and a landing site — and the four things that silently broke while doing it."
date: 2026-08-28
tags: ["infrastructure", "cloudflare"]
---

This is the first post, so it may as well be about the least glamorous part:
getting the plumbing right before there is any product to plumb.

PaceStreak is a workout streak tracker. It does not exist yet. What does exist
is a domain, a landing page, uptime monitoring and this blog — and setting
those up produced four failures that were all completely silent. That is the
theme worth writing down.

## Silent failure is the only kind that matters

A loud failure tells you about itself. These did not.

**The status page monitored a domain I do not own.** `pacestreak.net` sat in the
monitoring config, permanently red, for weeks. Not a bug in the monitor — it was
doing exactly what it was told. The incident it opened could never close,
because the monitor it belonged to was later deleted, and nothing closes an
issue for a monitor that no longer exists.

**A CSS rule with one extra point of specificity.** The activity grid on the
landing page rendered every cell the same colour. `.heat i` is specificity
0-1-1; `.lvl--1` is 0-1-0. The more specific rule won and flattened the whole
thing. Nothing errored. The legend swatches rendered correctly, which is what
made it obvious — they sit outside `.heat`.

**A deploy that shipped new HTML against a four-hour-old stylesheet.** Cloudflare
Pages serves `/assets/*` with a long `Cache-Control` that a `_headers` file
cannot override, and my filenames carried no content hash. So the markup
updated instantly and the CSS did not. The footer icons rendered at about 170px
instead of 20px, and if I had not looked at the page I would have shipped it.

**A DNS record with nothing behind it.** Adding `www` as a proxied record
without a matching route produced a `522` — which is *worse* than the
`NXDOMAIN` it replaced. Before, the hostname did not exist. After, it existed
and returned a Cloudflare error page, which reads to a visitor as "this product
is broken".

## What actually fixed them

Not carefulness. Carefulness is what produced them.

- **Assertions that fail the build.** The monitoring config now refuses a
  service-level objective whose slug matches no monitor, and warns about
  recorded data belonging to a monitor that no longer exists. That check caught
  a stale demo dataset within minutes of being written.
- **Content hashes on asset URLs, generated in CI.** Not "remember to run the
  script" — a step in the pipeline that cannot be skipped.
- **Looking at the thing.** Three of the four were found by rendering the page
  and looking at it, not by reading the code. The YouTube channel art in the
  brand set was wrong for the same reason: the safe area is 1546×423 inside a
  2560×1440 file, and I had scaled the type off the canvas. On a phone the logo
  would simply have been outside the crop.

## The setup, briefly

- **Cloudflare Pages** for the landing page and this blog, deployed from GitHub
  Actions rather than a Git connection — the existing project holds a live apex,
  and Cloudflare cannot convert a direct-upload project to a Git-connected one
  without moving the domains across.
- **Upptime** for [status.pacestreak.com](https://status.pacestreak.com):
  GitHub Actions on a schedule, issues as the incident log, Pages for the site.
  Two TLS checks, not one, because Pages issues a separate certificate per
  custom domain with different expiry dates.
- **`www` is canonical**, apex redirects to it. Not because www is prettier, but
  because it matches every other domain I run.

None of this is the product. But a status page that lies is worse than no status
page, and I would rather find that out now than during a launch.

---

Next: what the streak logic actually has to get right, and why "don't break the
chain" is a worse motivator than it sounds if you implement it literally.
