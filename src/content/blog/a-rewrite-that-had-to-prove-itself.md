---
title: "A rewrite that had to prove itself: parity, budgets and old bugs"
description: "25 units of work, a ratchet that counted down 293 pytest names to zero missing, a database round-trip budget on every route, a 400 KiB bundle limit, and the bugs in the Python service we fixed on the way."
date: 2026-10-18T19:00:00Z
tags: ["api", "testing", "rewrite", "bugs"]
---

A rewrite can easily lose behaviour without anyone noticing. Some edge case
the old code handled just never makes it across. So the TypeScript API was
built with checks that fail CI when it falls behind the Python service, gets
slower, or gets bigger. This post covers those checks.

## 25 units

We split the work into 25 units, each with a written scope and a definition
of done:

- **Foundation:** scaffolding, the Drizzle schema, the request pipeline,
  the test harness.
- **Platform pieces:** crypto, rate limiting and Turnstile, mail, Web Push,
  R2 photos, jobs, the streaming importers, the static catalogues.
- **Features:** auth, notifications, ops and admin, the streak and XP
  engine, profile and account, training, habits, nutrition, social, trash,
  and the twelve background jobs.
- **Last two:** the API contract with the app, and the cutover runbook.

A unit was done only when its ported tests passed. The units were built
from 17 to 19 October and merged into a branch called `next`, while `main`
kept running Python.

## The parity ratchet

The Python suite had **293** test names. A script compares them with the
TypeScript test titles. A Python test counts as ported when a TypeScript
title matches its name. The other way out is a `parity-dropped` comment
that gives a reason. CI fails if the number of missing names rises above a
committed limit, or if a title names a test that does not exist.

That limit is a ratchet: it can only go down. It started at 291 missing,
when the foundation had ported two names. It fell to 241 after auth, then
to 59, 20 and 7 as the feature units landed. The final seven were cases that
had no test, or whose titles the name check could not match: the habit view,
bulk days, smart reminders and the changes feed among them.
The limit is now **0**. By then the TypeScript suite had grown past 1,300
tests, all running inside `workerd`, the real Workers runtime, with local D1,
R2 and Queues.

## Round-trip budgets

On Workers, the slow part of a request is usually the trips to the
database, not the code. So each route has a budget for **D1 round trips**.
In tests only, the Worker reports the count in an `X-D1-Round-Trips` header,
so a route test checks the budget through the real request path.

The design rule is that an authenticated read costs one round trip: the
session check and every read for the handler go in one batch. Writes use an
atomic batch, and a guard statement at the front aborts the whole batch if
the session has been revoked in the meantime. A seeded "heavy user", with
years of deterministic data, holds 47 read routes and the common writes to
their budgets, so the number can't creep up as an account grows.

That shaped the code. `/workouts/batch` with 200 operations costs the same
three round trips as a single save. Every habit write that moves a streak
uses one read and one write, where Python ran a full scan of the habit
views twice per request. The coach's group view reads every member with
eight set-based statements, not about 18 per member.

## The bundle budget

`pnpm build` runs a dry-run deploy and fails if the gzipped Worker is over
**400 KiB**. The foundation alone was 181 KiB. The passkey library added
about 117 KiB. When the streak engine landed, the unminified bundle went
over the limit, so we turned on minification (source maps are still
uploaded), which brought it down to 308 KiB. After the contract unit it is
about 377 KiB.

## Old bugs, fixed on the way

The rule was to fix any bug we found in the Python behaviour, add a test,
and record it in a changes log. Some of them:

- **The email code attempt limit never applied.** Python raised the error
  before saving the failed attempt, so the five-try cap never counted
  anything. Now every attempt is saved and the fifth miss locks the code.
- **Logout didn't remove the production cookies.** Browsers ignore a
  `__Secure-` cookie that is set without `Secure`, and the clearing header
  didn't set it. Now it does.
- **A WAV file passed as WebP.** The photo check accepted any `RIFF` file.
  Now it requires `WEBP` at byte 8, and it checks the full 8-byte PNG
  signature.
- **Admin search treated `%` and `_` as wildcards**, and so did exercise
  record history. Both now match those characters literally.
- **Trash restored entries after their deadline.** An entry past its purge
  date was hidden from the list but could still be restored until the
  nightly sweep. Now it returns 404.
- **The group feed always said zero comments**, and a malformed cursor
  caused a 500. Now the counts are real and a bad cursor returns a 422.
- **"2 mores to go."** The coach put the plural on the wrong word.

Not every change was a fix. Some came from the platform. D1 has no
advisory locks, so stats updates use optimistic concurrency on a revision
number and retry when they lose. D1 also has no time zone database, so a
workout's local hour is stored when it is written, and changing your time
zone later no longer rewrites history. Each of these has a test, and each is
listed with its reason in the changes log.

## One more limit, found late

D1 allows 1,000 queries per invocation, and every statement in a batch
counts. The queue consumer took ten messages at a time, 50 user ids each,
which could go over the limit on a heavy job. Now it takes one message per
invocation, heavy jobs pack 20 or 40 ids, and a test measures the cost per
id to keep each pack under 90% of the limit.
