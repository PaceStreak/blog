---
title: "Where PaceStreak is now, and what stands between it and launch"
description: "A status report: what is built across the API, the app and the sites, what's tested, and the one unresolved decision (where the API runs) that everything else is waiting on."
date: 2026-09-25T17:00:00Z
tags: ["status", "infrastructure", "roadmap"]
---

A month ago the [stack post](/posts/every-choice-in-the-stack) described "a
backend repository with a stack but no endpoints". That's no longer true, so
here's where things stand.

## What's built

**The API** (FastAPI, Postgres, Redis) has roughly 110 routes under `/v1`:

- auth, sessions and two-factor ([post](/posts/auth-for-health-data));
- the streak engine, XP, levels, records and 23 achievements
  ([streaks](/posts/streaks-count-weeks-not-days),
  [XP](/posts/xp-that-a-heavier-bar-cannot-buy));
- training logs with offline-safe sync, routines, 78 exercises across 11
  disciplines, body metrics, streak chains, repairs and pauses;
- the social layer: follows, feed, kudos, comments, groups, coach access,
  challenges and leaderboards
  ([post](/posts/social-that-cannot-be-turned-against-you));
- notifications with Web Push, email and one-click unsubscribe, plus a worker
  ([post](/posts/one-worker-one-lock));
- export, import, deletion, a calendar feed and GPX/FIT/CSV import
  ([data](/posts/your-data-leaves-with-you),
  [the latest round](/posts/when-the-streak-should-wait));
- admin: reports, moderation, an append-only audit log, and official accounts.

It has 87 tests, all run against a real Postgres and Redis with nothing mocked.

**The app** is a React 19 + Vite PWA with an offline outbox, a service worker,
and a screen for every one of those features
([offline post](/posts/logging-in-a-basement)).

**The public site** was rebuilt to describe all of it accurately
([post](/posts/a-marketing-site-that-cannot-lie)).

## What isn't live

Neither the app nor the API is deployed. `app.pacestreak.com` and
`api.pacestreak.com` still have no DNS records, deliberately: a proxied
Cloudflare record with nothing behind it returns a 522, which looks worse than
a hostname that doesn't exist.

## The one decision everything waits on

**Where does the API run?** Everything public so far fits Cloudflare's free
tier: static sites on Pages, and a status page on GitHub Pages. The API
doesn't. It needs a container, Postgres and Redis around the clock, plus a
worker. Pages can't run that, and Python on Workers runs under Pyodide, which
rules out this stack.

The honest options are a small VPS, a container platform, managed Postgres, or
rewriting the backend for Workers and D1. Each trades money, operational work
or rewriting time against the others. It's the owner's call, and until it's
made, the list below is paperwork.

## After that decision

1. Deploy the app to Pages and attach `app.pacestreak.com`, with its
   `noindex` headers and `Disallow: /`.
2. Widen the app's `connect-src` to the API **in the same commit** that points
   it there. Otherwise every request fails silently.
3. Production config: secure cookies on `Domain=pacestreak.com`, an explicit
   CORS origin, a real TOTP encryption key, verified email required. The API
   refuses to start in production without most of these.
4. An email sender for verification and reset links. Today they go to the log.
5. A privacy policy and terms written for accounts and health data, published
   before the first real signup rather than after.
6. Backups, with a restore that has actually been tested.
7. Monitoring for the two new hostnames on the status page.

None of these is hard. All of them are the kind of thing that's easy to do
slightly wrong, which is why they're written down here, and why the runbook
exists.
