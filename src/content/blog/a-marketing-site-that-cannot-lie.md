---
title: "Rebuilding the website so it can't describe features we don't have"
description: "The public site described an idea; the product had moved on. The rebuild puts every claim in one data file sourced from the code, ships a streak simulator that runs the real rules, and keeps the site static with zero third-party requests."
date: 2026-09-25T16:00:00Z
tags: ["web", "astro", "csp", "design"]
---

When the backend and app got built, the public site at `www.pacestreak.com`
didn't keep up. Two claims on it had become false:

- The hero showed a **47-day** streak. Streaks count **weeks**.
- The About page said there was **no feed and no leaderboard**. There are both
  now: opt-in, private by default, and attendance-only.

Neither was a lie when written. Both became one when the product moved. That's
the failure mode worth designing against.

## One file for every claim

The rebuild adds `/features`, `/streaks`, `/social` and `/security`, and every
product claim on them reads from a single file, `src/data/product.ts`. Its
header says what it is:

> Every number below is taken from the code in PaceStreak/api and
> PaceStreak/app, not from a plan. A marketing page that describes a feature
> the product does not have is a bug, not copy.

Eleven disciplines, 78 exercises, eight starter routines, 23 achievement rules,
four leaderboards, a freeze every four kept weeks, a 30-day deletion grace
period: each one was checked against the source before it went in. Several
drafted claims didn't survive that check. The security page nearly listed a
`security@` address that doesn't exist, and nearly said new accounts start
fully private (the default is followers-only).

## A simulator that runs the real rules

The `/streaks` page has an eight-week grid you can toggle, with a target
selector. It runs `src/lib/chain.ts`, a TypeScript port of the engine's
kept/frozen/missed/open rules. The same module renders the grid at build time,
so the page is correct with JavaScript off, and runs again in the browser when
you tap a day.

It ships as a hashed external module. The site's CSP is
`script-src 'self'` with no `'unsafe-inline'`, and `check-html.py` fails the
build if any inline script or `style=""` attribute appears, so there's no way to
cheat on that by accident.

## Still static, still zero third parties

The site makes no requests to anyone else. No analytics, no font CDN, no
embed. The mobile menu is a `<details>` element, so it works even if the one
script never loads. Nothing about the rebuild changed the rule that this site
never gains a login, a session check or an API call.

## Checked by looking

After building, every page was screenshotted at desktop and phone width and
looked at. That caught one real problem: the simulator's table overflowed at
390 px and cut off the status column. The fix was sized cells, a hidden "run"
column under 480 px, and stat cards that stop stretching to the table's
height. A build that passes isn't a page that works; the only way to know is
to look at it.
