---
title: "A sign-out must not lose a session"
description: "Signing out used to wipe this device's data, including writes that hadn't reached the server yet. Now they're parked under your account and put back when you sign in again."
date: 2026-10-02T16:30:00Z
tags: ["offline", "sync", "engineering"]
---

PaceStreak works without signal. A session logged in a basement gym goes into
an outbox in IndexedDB and syncs when the phone is back online. That promise
has an edge most offline apps get wrong: what happens to the outbox when the
person signs out, or someone else signs in on the same device, before it has
synced?

Until today the answer was "it's wiped", because sign-out cleared everything
stored on the device. Clearing is right for privacy: the next person must not
see your data. It's wrong when some of that data exists nowhere else yet.

## Parking

There's now a store called `parked`, keyed by user id. On sign-out, or when a
different account signs in, the current person's unsent writes, queued edits
and on-device photos are moved into it under their id. Anything already parked
for them is merged, not replaced. Then the rest of the device is cleared as
before.

When that person signs in again, their parked writes go back into the outbox
and sync as if nothing happened. Someone else signing in never sees them:
parked data is only ever restored to the account it was parked under.

`wipe()`, the function that clears the device, parks the owner's writes
before it clears anything, and never clears `parked` itself. The one way to
throw unsynced work away is on purpose: **Settings → Clear data stored on this
device**, which first warns how many changes haven't reached the server and
asks you to confirm **Clear anyway**.

## Why now

The [account merge](/posts/merging-accounts-by-reading-the-foreign-keys)
deleted an account while a phone still held an unsynced session for it. The
data was recovered from the database's restore history, but the bug was on
the device, not the server: nothing in the app treated "not synced yet" as
precious. Now it does.

## The refresh race, while we were there

The same investigation found a second way to get signed out. Refresh tokens
rotate: each use returns a new one and revokes the old, and presenting a
revoked one is treated as theft, which signs out every device. But reloading a
page while a refresh is in flight does exactly that innocently: the browser
sends the old cookie before the new one has landed.

Now, for 30 seconds after a rotation, presenting the previous token continues
the session from the token it was replaced by, as long as that one is still
live. That's long enough for a reload, and too short to be useful to anyone
who stole a token. Outside the window, reuse is treated as theft exactly as
before.
