---
title: "Fitting a whole API into fifty database queries"
description: "On the Workers Free plan, D1 allows 50 queries per invocation, and every statement in a batch counts. The API was written for 1,000. Here is how every route and every background job now fits, and the test that keeps it that way."
date: 2026-10-21T08:00:00Z
tags: ["api", "cloudflare", "d1", "performance"]
---

The PaceStreak API runs on Cloudflare Workers with D1 as its database. It
was designed for the Workers Paid plan, where one invocation may run 1,000
D1 queries. On 19 October we decided to try the Free plan first. Free allows
**50**, and the [D1 limits page](https://developers.cloudflare.com/d1/platform/limits/)
is the number that matters. We count every statement inside a `batch()`
against it, because that is the safe reading of the docs.

Fifty is not many. Saving a workout has to write the session and its sets,
bump the sync counter, recompute the streak, check for records and badges,
and maybe post a feed event. Before this change, editing a workout on a
long-standing account ran **80** statements. An admin account merge ran
**159**.

## One number, in one place

The first change was to stop hard-coding the limit. `src/lib/plan.ts` holds
both plans and derives a budget from them:

```ts
export const D1_QUERIES_PER_INVOCATION: Record<Plan, number> = { free: 50, paid: 1000 };
export const BUDGET_SHARE = 0.9;
export const d1Budget = (plan: Plan): number =>
  Math.floor(D1_QUERIES_PER_INVOCATION[plan] * BUDGET_SHARE);
```

A request may plan to spend 45 statements on Free, and the last 5 are
headroom. `PLAN` is one var in `wrangler.jsonc`. Moving to Paid is a
one-line change, and every pack size and budget below follows from it.

## Many reads, one statement

Most of the cost was reads, not writes. Building an account's stats snapshot
ran 18 small selects: the profile, the chains, this week's days, the badges,
and so on. Each of those selects returns a bounded number of rows.

`fuse()` in `src/db/batch.ts` turns any number of bounded selects into a
single SQL statement. Each select becomes a common table expression, and the
outer query packs each one's rows into a JSON array:

```sql
WITH t0(c0, c1) AS (SELECT ...), t1(c0) AS (SELECT ...)
SELECT (SELECT coalesce(json_group_array(json_array(c0, c1)), '[]') FROM t0) AS r0,
       (SELECT coalesce(json_group_array(json_array(c0)), '[]') FROM t1) AS r1
```

D1 runs it once. The result is split back into the shape Drizzle would have
returned for each select, so the calling code didn't change. Reads that grow
with history stay separate: habit logs, workouts and sets. Packed into one
value, they could approach D1's 2 MB row limit on an account with years of
data.

The snapshot went from 18 statements to one fused read plus the history
reads. Writes got the same treatment: where a loop used to insert one row
per statement, it now inserts all the rows in one statement.

## What changed, route by route

| Route | Before | After |
| --- | --- | --- |
| Edit a workout | 80 | under 45 |
| Export your data | 48 | about 15 |
| Finish onboarding | 46 | under 45 |
| Restore a habit with years of logs from Trash | about 90 | under 45 |
| Admin account merge | 159 | queued, 40 per slice |

The merge is the one route that could not fit in a single request, so its
contract changed. It now freezes the source account, answers `202` with
`status: "queued"`, and moves the data in slices on the job queue. Each
slice is atomic and safe to run twice. The app never calls this route; it
is an operator tool.

An import that wouldn't fit inline is handed to the queue the same way.

## Background jobs

The queue consumers had the same problem at a larger scale. A message used
to carry 50 user ids, because on Paid that fits easily. On Free, a stats
recompute for one heavy account costs 8 statements, so a stats message now
carries **2** users. Reminder and digest messages carry **9**. Each job
slice also writes all its notifications in one statement. A slice therefore
costs the same few statements however many people it covers.

Delivery has a second limit to respect: Free allows 50 outbound requests per
invocation, and one person can have up to 20 push subscriptions. The
delivery consumer stops at 45 requests or at the statement budget, whichever
comes first, and puts the rest back on the queue.

## The test that keeps it honest

None of this lasts unless something fails when it breaks. In tests, every
response carries the number of statements it ran:

```ts
if (ctx.cfg.environment === "test") {
  c.res.headers.set("X-D1-Statements", String(ctx.stats.statements));
}
```

The test helpers that make requests read that header and fail the test if
any request goes over 45. That covers every route test, not a hand-picked
list. The heavy-user suite adds the worst cases on purpose:

- both exports;
- a workout and a habit sent to Trash and back;
- an inline import;
- a sync batch of 200 sessions.

A new route that forgets the budget fails CI the first time it is tested
against a real amount of data.

## What it still can't do on Free

The query cap is solved. Two Free limits are not:

- **Rows written per day.** Free allows 100,000. Deleting, importing or
  fully rebuilding a heavy account writes tens of thousands of rows at once.
- **Queue operations per day.** Free allows 10,000, and a message costs
  about three. That is roughly 1,100 to 1,600 active people a day, and fine
  for now.

There is also CPU, which has
[its own post](/posts/password-hashing-against-ten-milliseconds).
