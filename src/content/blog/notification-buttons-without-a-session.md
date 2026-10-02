---
title: "Notification buttons without a session"
description: "A habit reminder now has Done and Snooze buttons. The service worker that handles them has no access token, by design, so each button carries a signed, single-purpose link instead."
date: 2026-10-02T10:00:00Z
tags: ["security", "api", "app", "notifications"]
---

A reminder you can act on without opening the app saves a step dozens of
times a week. The hard part is that the button is handled by the **service
worker**, and the service worker has no way to call the API as you.

That's deliberate. Access tokens live in the app's memory, not in storage a
worker could read, so a script that reaches storage still can't act as you.
Weakening that for a convenience button would be the wrong trade.

## A link that can do exactly one thing

Each reminder's push payload carries two URLs, one for Done and one for
Snooze. Each is signed with an HMAC over:

- your user id
- the habit id
- the action
- the day
- an expiry 18 hours out

The signing key is derived from the JWT key, the same way one-click
unsubscribe links are, so rotating one rotates both.

The worker POSTs to the link. The API checks the signature in constant
time, checks the expiry, and does only what the link says: tick that habit
for that day, or snooze it for an hour. A leaked link could, at most, do
that one thing until the evening. Change any part of it and it's a 403.

Done is idempotent (pressing it twice doesn't double-count) and works for
count and minutes habits by setting the day to its goal.

## Failing out loud

If the link has expired or there's no signal, the worker shows a second
notification saying so, instead of the button silently doing nothing.

## Snooze, and the summary instead

A snooze sets `snoozed_until`. A worker pass reminds you once when it runs
out, only if the habit still isn't done, then clears it, so a snooze can
never repeat.

Some people would rather have one evening notification than a reminder per
habit. The summary says how many habits are still open and never names
them, because a notification shows on a lock screen, and which habits
someone is working on is nobody else's business.
