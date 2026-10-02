---
title: "How much one small server carries"
description: "A load test of signed-in users doing what the app does all day, the first capacity numbers, and why production numbers from India say more about distance than about the server."
date: 2026-10-02T17:00:00Z
tags: ["performance", "infrastructure", "engineering"]
---

The API runs on a free-tier e2-micro: two shared vCPUs, 1 GB of memory, one
API process. "Is that enough?" deserved a number, so there's now a load test
in the API repository, `scripts/loadtest.py`.

## What it does

Each virtual user signs up through the real endpoints, verifies its email
with the code from the log, and then loops through what the app does all day:
open the app (`/me`, stats, habits), sync the change feed, save a session, and
read the feed. It reports throughput, p50 and p95 latency per endpoint, and
every non-2xx response, so the first thing that breaks is obvious.

It only runs a full load against a local stack. Pointed at anything else it
refuses, and offers `--health-only`: a gentle read of `/health`, at most five
requests a second per virtual user. Production's accounts, rate limits and
free-tier quotas are real.

## The numbers

| Where | Load | Throughput | p50 / p95 |
| --- | --- | --- | --- |
| Local, one process | 10 users | 38 req/s | 130–520 / 180–1000 ms |
| Local, one process | 30 users | 45 req/s | 400–1230 / 630–1940 ms |
| Production `/health` | 5 req/s | – | 373 / 3568 ms |

No errors in any run.

One process tops out around 40–45 requests a second. Past that, more users
only add queueing: latency climbs, throughput doesn't. Saving a session is the
costliest call because it recomputes streaks and stats. That's on purpose:
your streak is right the moment you save, not after a background job.

## Reading the production line

The production median of 373 ms looks bad until you split it. About 340 ms is
the round trip from India to us-central1, Iowa; on the VM itself `/health`
answers in about 45 ms. The long p95 tail is the e2-micro's burstable CPU:
when its credits run low it slows down, and with one process there's nothing
to absorb it.

40 requests a second is a lot of people. An app open is a handful of requests,
and most people open the app a few times a day. It's fine for now, and the fix
for later is already planned: a larger server with one process per core,
measured with the same script.
