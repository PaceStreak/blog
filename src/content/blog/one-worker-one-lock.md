---
title: "One worker, one lock: reminders that never nag twice"
description: "How PaceStreak's background worker notices streaks that ended in silence, times reminders to each person's evening, sends a weekly recap, and stays safe to run twice."
date: 2026-09-25T13:00:00Z
tags: ["api", "notifications", "python", "reliability"]
---

Most of PaceStreak happens in response to a request: you log a session and the
API recomputes your streak. But some things happen because _nothing_ was
logged. A streak that ends because someone stopped training produces no
request at all. Something has to notice.

That something is `app/worker.py`, a separate process started with
`python -m app.worker`.

## The jobs

Every tick (120 seconds by default) the worker runs, in order:

- **Refresh stale stats.** Recompute anyone whose projection was computed for a
  date that has since rolled over in their own timezone. This is how a streak
  ends when the person simply stops logging.
- **Streak nudges.** At each person's chosen reminder hour, in _their_
  timezone, warn about a week at risk, or send a plain reminder on a planned
  training day.
- **The weekly digest.** At 09:00 local on the first day of each person's week,
  a recap of the last one.
- **Challenges.** Resolve any that ended overnight.
- **Deletion.** Purge accounts whose 30-day grace period has run out.

## Safe to run twice

Two properties make the worker boring to operate, which is the goal.

**A Redis lock per tick.** Each tick takes a lock before doing anything, so
running two replicas is safe: the second one sees the lock and skips. Nobody
has to remember that the worker must be a singleton.

**A dedupe key on every notification.** `risk:<chain>:<date>`,
`reminder:<date>`, `digest:<week>`. If a tick crashes between sending a
notification and committing, the next tick tries again, and the dedupe key
makes the second attempt a no-op. Nobody gets nudged twice.

`python -m app.worker --once` runs one tick and exits, for platforms that
prefer an external cron to a long-running process.

## Reminders that know when to shut up

The nudge copy is the product's voice in its most intrusive place, so it's
written carefully:

- A week that a freeze will cover says so: "If not, a freeze covers this week.
  Rest if you need to."
- A week that's already out of reach says a repair can fix it later, "so no
  need to train sore to fix it."
- Every at-risk message ends with a way out: "Skip it if you're hurt or
  wiped."

Quiet hours are respected per person, and there's a harder rule too: **anyone
on a declared pause gets no nudges at all.** The worker checks
`snapshot.paused_today` before it looks at a single chain. Telling an injured
person to train is exactly the behaviour the week-based streak exists to
prevent.

## Inbox first, delivery second

Notifications follow one rule from `app/notifications/service.py`:

> Every notification is written to the inbox first; that write is the only part
> that can fail a request. Push and email are best-effort extras on top.

Push (standard Web Push with VAPID, no third-party push service) and email are
chosen per category by the user and delivered after the response, so a slow
push endpoint never slows down logging a set.

Every email carries a one-click unsubscribe (RFC 8058). The link holds a signed
token scoped to one category, so it works from a mail client with no session
and can change exactly one switch.

## The digest and the recap are one function

The Monday digest used to build its own summary. It now calls the same
`build_recap()` that backs the in-app `/recap` screen, and the notification
links there. The notification and the screen it opens can't disagree about how
your week went, because there's only one piece of code that decides.
