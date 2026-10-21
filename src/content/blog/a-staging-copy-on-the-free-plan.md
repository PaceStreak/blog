---
title: "A staging copy on the free plan"
description: "Until this week every API change went straight to production. Setting up a staging Worker ran into three Free-plan rules on the way, and taught us that our deploys were manual all along."
date: 2026-10-21T16:00:00Z
tags: ["infrastructure", "cloudflare", "api"]
---

Until 20 October the PaceStreak API had one environment: production. Every
change was tested locally, against `wrangler dev` and its local copies of
D1, Queues and R2, and then went live. The local copies are good, but they
are not the real services. This week the API got a staging copy, and the
setup ran into three Free-plan rules.

## What staging is

Staging is a second Worker, `pacestreak-api-staging`, at
`pacestreak-api-staging.alzywelzy.workers.dev`. It shares no state with
production:

- its own D1 database, `pacestreak-staging`, in the same `apac` region;
- its own job queue and dead-letter queue;
- its own two R2 buckets;
- its own secrets, generated fresh and never written down.

Its mail transport is `console`: codes are printed to the log, not sent.
Production sends through Brevo's free tier, which allows 300 emails a day.
Staging traffic shouldn't spend any of those.

## Rule one: no CPU setting

The first deploy failed:

> CPU limits are not supported for the Free plan.

The Worker's config set `"limits": { "cpu_ms": 30000 }`, which only Paid
allows. Production's config had already dropped it; staging still had it.
Removing it fixed the deploy. The CPU question underneath is the subject of
[another post](/posts/password-hashing-against-ten-milliseconds).

## Rule two: five cron triggers per account

The second deploy succeeded, then warned:

> This account has reached the Workers Free limit of 5 cron triggers per account.

The limit is per **account**, not per Worker. Production uses three
schedules (every five minutes, four times an hour, and nightly). Copying
them to staging made six. So staging has no crons:

```jsonc
"triggers": { "crons": [] },
```

Scheduled jobs on staging are run by hand, with `wrangler dev
--test-scheduled`. It is a real limitation. Staging can't show a reminder
firing on its own schedule, but production's three schedules matter more.

## Rule three: deploys were never automatic

The third discovery wasn't a limit but a misunderstanding. The API's
README said a push to `main` deploys through Workers Builds. After pushing
a database migration to `main`, we waited ten minutes for it to apply. It
never did.

`wrangler deployments list` showed why. Every production deployment so far
had the source "Unknown (deployment)" and came from `wrangler` on the
owner's machine. Workers Builds had never been connected. Pushing `main`
had never deployed the API. Each deploy had been someone running
`wrangler deploy`, and the docs had described a system that didn't exist.

The docs now say what is true: deploy the API by hand from a clean
`main`, migrations first:

```bash
pnpm wrangler d1 migrations apply pacestreak --remote
pnpm wrangler deploy
```

There is also a warning that `wrangler triggers deploy` counts as a
production deployment, which we learned by running it.

## What staging is for now

The first real use was the measurement in the hashing post: signing up a
throwaway account on staging while `wrangler tail` reported the CPU each
request used. That number couldn't have come from a local run. It needed
the real platform, and it didn't need production.
