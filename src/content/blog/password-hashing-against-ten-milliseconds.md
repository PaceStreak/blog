---
title: "Password hashing against a ten-millisecond limit"
description: "The Workers Free plan allows 10 ms of CPU per request. Checking a password takes about 20. We measured it in production conditions, and we are not lowering the hashing to fit."
date: 2026-10-21T10:00:00Z
tags: ["security", "cloudflare", "api"]
---

PaceStreak hashes passwords with **PBKDF2-SHA256 at 100,000 iterations**,
plus a secret pepper. 100,000 is the most iterations WebCrypto on Cloudflare
Workers accepts. Ask for more and it throws.

The [Workers Free plan](https://developers.cloudflare.com/workers/platform/limits/)
allows **10 ms of CPU per request**. Those two numbers don't fit together,
and this post is about what we did instead of making them fit.

## Measuring it, not guessing

Cloudflare's docs say CPU time is the time your code spends running.
Waiting on the network or the database doesn't count. They don't say
whether WebCrypto counts. It runs natively, but it runs on the request's
own thread, so we assumed it does.

The local bench (`test/bench/core.bench.ts`) measured one 100,000-iteration
verify at about 23 ms. A local bench is not production, though, so we
signed up a throwaway account on the staging Worker and watched
`wrangler tail`, which reports the CPU time Cloudflare charged for each
request:

| Request | CPU | Wall time | Outcome |
| --- | --- | --- | --- |
| Sign up | 43 ms | 672 ms | ok |
| Sign in | 23 ms | 327 ms | ok |
| Sign in | 22 ms | 350 ms | ok |
| Sign in | 19 ms | 333 ms | ok |

So the hashing does count, and it costs about twice the Free limit. Sign-up
costs more again because it also builds the new account.

## It worked anyway, today

Every one of those requests succeeded. Cloudflare didn't stop them at 10
ms. An occasional request over the limit seems to be tolerated, and we
haven't found a documented rule for how much or how often.

That is not something to build on. A tolerance that isn't written down can
change, and when it does, the symptom is sign-in failing with error 1102 for
everyone at once. We treat today's result as luck that has held so far,
not as a design.

## What we are not doing

The obvious fix is to lower the iterations until a verify takes under 10
ms, which means roughly 40,000. We aren't doing that, for one reason: the
iteration count is what makes a stolen database expensive to crack. Cutting
it by more than half to fit a hosting plan trades every user's security for
five dollars a month.

There is a written rule in this project for exactly this case: being on a
cheap plan is never a reason to cut quality. The code says so too:

```ts
/**
 * PBKDF2-SHA256 at 100,000 iterations (OWNER-DECISIONS; never lowered).
 */
```

## What we are doing

- **Measuring, not assuming.** The staging `wrangler tail` check above is
  now step G-1 of the cutover runbook, so the number is re-measured, not
  remembered.
- **Keeping the expensive path rare.** Sign-in issues a session that
  refreshes without the password, so a person hashes once per sign-in, not
  once per request.
- **Having the switch ready.** Workers Paid allows up to five minutes of CPU
  per request. Moving there is the `PLAN` var in `wrangler.jsonc` plus the
  plan itself. If sign-in ever starts failing on Free, that is the fix, and
  it is a one-line change.

One other path is close to the line. Building the stats snapshot for a very
heavy account takes about 13.5 ms of pure JavaScript. A typical account is
far lighter, but it is the second place we'd look if error 1102 ever
appears in the logs.
