---
title: "The dead-letter queue nobody read"
description: "A background job that failed five times went to a dead-letter queue, and then nowhere. Now each one lands in the hourly error email, without copying anything personal out of it."
date: 2026-10-21T14:00:00Z
tags: ["api", "reliability", "cloudflare"]
---

PaceStreak's background work runs on a Cloudflare queue, `pacestreak-jobs`.
That covers streak reminders, digests, stats rebuilds, account deletions and
backups. If a message fails, Cloudflare retries it. After the last retry it
moves the message to a dead-letter queue, `pacestreak-jobs-dlq`, so one bad
message can't block the rest.

That design is right. What was missing was the other half: nothing ever
read the dead-letter queue. A reminder that failed five times was moved
somewhere safe and then forgotten. The person didn't get the reminder, and
nobody found out.

## Reading it

The fix is a consumer on the dead-letter queue itself. The Worker already
had one `queue()` entry point for the job queue. It now routes by queue
name: any queue whose name ends in `-dlq` goes to `handleDeadLetters`.

```ts
const letters: DeadLetter[] = batch.messages.map((m) => ({
  msgId: m.id,
  summary: deadLetterSummary(m.body),
  queue: batch.queue,
}));
```

Each dead message becomes a row in the same table the app's crash reports
use. That table already feeds two things:

- the hourly `error_alerts` job, which emails new server errors;
- the Ops page in the admin screens.

So a dead job now shows up in the same places as any other error, with no
new alert to configure.

## What it records, and what it doesn't

A job message carries user ids, and some carry more. The record keeps only
what's needed to find the problem:

- the job type and its ids, cut to the first 10 with a count of the rest;
- the queue it came from;
- "malformed message" if the body can't be parsed.

It never copies the message body. A failed digest shouldn't put anyone's
data into an error email.

## Safe to see twice

Cloudflare can deliver a dead letter more than once, like any queue
message. Rows are keyed on the message id, so a redelivery raises that
row's count instead of adding a duplicate. The whole batch is written in
one statement and then acknowledged. If the write fails, the batch is
retried rather than lost a second time.

The consumer takes at most 10 messages per run, so it stays far inside the
Free plan's 50-query limit, which
[the previous post](/posts/fitting-an-api-into-fifty-queries) is about.

## The lesson

A dead-letter queue is a place to put things you can't handle yet, not a
place for things to disappear. If nothing reads it, it's a slower way of
dropping messages. The fix was small; the gap was not noticing it for a
week.
