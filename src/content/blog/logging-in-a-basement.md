---
title: "Logging a workout in a basement with no signal"
description: "How the PaceStreak app saves every session to the device first, queues writes in an IndexedDB outbox, and syncs across devices with an idempotent batch endpoint and a sequence cursor."
date: 2026-09-25T10:00:00Z
tags: ["app", "offline", "pwa", "react", "sync"]
---

Gyms live in basements. Climbing walls are in industrial units with metal
roofs. Trailheads have one bar of signal if you stand on a rock. If logging a
session needs the network, some fraction of sessions don't get logged, and a
session that doesn't get logged is a streak lost to a building.

So one of PaceStreak's five product principles is blunt: _works in a basement
with no signal_. This post is how the app does that.

## The device is the first database

Every save goes to IndexedDB before anything else happens, and the UI reads
from IndexedDB, not from the network. From `app/src/lib/db.ts`:

> IndexedDB, not localStorage: the whole training history lives here so the
> app opens and logs with no signal, and localStorage's 5MB synchronous string
> store is the wrong tool for that.

There are three object stores:

- **`workouts`**: every session, synced from the server and edited locally,
  indexed by date.
- **`outbox`**: writes waiting for the server.
- **`kv`**: small cached reads (the current user, stats, the exercise library)
  and the sync cursor.

A log is therefore instant, and it survives a dead connection, a closed tab or
a phone that runs out of battery mid-set.

## One outbox entry per workout

The outbox is keyed by workout id, not by operation. If you edit a session
three times while offline, there is still one entry, holding the latest
version. A newer edit replaces the queued one rather than queueing behind it.

That keeps the queue short and makes the eventual sync a single write per
workout, however much editing happened in the lift.

## Why retrying is always safe

The outbox pushes to `POST /v1/workouts/batch` whenever it can. Two properties
on the server make a retry harmless:

1. **Idempotent per workout id.** The client generates the id. Sending the same
   workout twice updates it; it never creates a duplicate.
2. **Last write wins on `client_updated_at`.** The timestamp is set on the
   device when the edit was made, not when it arrived. An old edit that finally
   syncs after a newer one from another device doesn't overwrite it.

So the client doesn't need to know whether a previous attempt succeeded. A
request that timed out after the server committed is just sent again. Offline
sync gets much simpler once the server makes "did that work?" a question you
never have to answer.

Failed items keep their error and attempt count, and the sync state is exposed
to the UI (`pending`, `syncing`, `lastError`, `failed`) so a stuck write is
visible rather than silently lost.

## Pulling changes with a cursor, deletions included

Pushing is half of sync. The other half is getting edits made on your laptop
onto your phone.

The API keeps a monotonically increasing sequence number on workout changes.
The client stores the last one it saw and asks for
`GET /v1/workouts/changes?since=N`. The response includes **deletions**, which
is the part that's easy to forget. Without them, a session deleted on one
device reappears on another forever.

A sequence cursor beats "changes since timestamp" because clocks disagree. Two
devices and a server will never agree on what time it is to the millisecond,
and a timestamp cursor eventually skips a change that landed in the gap.

## The service worker, and what it refuses to do

The app is a PWA. At install, the service worker precaches the shell:
`index.html` plus every hashed asset of that build. So the app opens with no
network at all. Navigations are network-first with the cached shell as the
fallback, so a new deploy is picked up immediately when you're online. Hashed
assets are cache-first, because their URL changes whenever their bytes do.

The interesting rule is the one it doesn't break: **the service worker never
intercepts the API.** Offline writes are the outbox's job, not the worker's,
and a cached API response in a service worker cache would be somebody's
personal training data sitting in a shared cache.

The app checks for a new version every hour, because people leave a workout app
open all day, and it offers the update as a toast rather than swapping code out
from under someone halfway through a set.

## What the server still owns

Streaks, XP and records are computed by the API, because they need the whole
history and have to agree across devices. Offline, the app shows the last
stats it cached and counts the week from local sessions, so "two more this
week" still works in the basement. When the outbox drains, the server
recomputes and the app picks up anything new, including the celebration for
a record set underground.

## What's next for it

`fake-indexeddb` is already a dev dependency, but the outbox itself doesn't have
tests yet. The replace-on-edit and cursor behaviour is exactly the kind of logic
that deserves them, and it's on the list.
