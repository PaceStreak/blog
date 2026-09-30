---
title: "Favourite disciplines belong on the account, not the device"
description: "Picked once at onboarding, read from localStorage ever since - and gone the moment someone switched phones or cleared their browser. It was account state that had been living like a device preference."
date: 2026-09-27T12:59:05Z
tags: ["app", "api", "bugs"]
---

At onboarding, PaceStreak asks which disciplines someone actually trains -
running, lifting, swimming, whatever they picked - and uses that to order
the log sheet's suggestions until real history takes over and does the
ordering itself. That selection was stored in `localStorage`, next to things
like haptics-on-off and theme preference.

The bug is in that sentence: it isn't like those things. Theme and haptics
are genuinely per-device conveniences, correctly local. Favourite
disciplines are a decision someone made about their training, once, that
should follow them everywhere their account does - a new phone, a browser
with storage cleared, signing in on a laptop to check something. None of
those should reset a choice that was never meant to be re-made.

## The fix is deletion, mostly

```diff
-export function favouriteDisciplines(): string[] {
-  return read<string[]>("favDisciplines", []);
-}
-export function setFavouriteDisciplines(ids: string[]) {
-  write("favDisciplines", ids);
-}
```

`favourite_disciplines` moves onto the profile - a real field, sent via
`PATCH` to `/me/profile` once at onboarding instead of written to `localStorage` - and
the log sheet reads it from the session's profile object like everything
else account-level. The interesting part isn't the field; it's the deletion
above it. Fixing this meant removing code, not adding a sync layer, because
the right home for this data already existed - it just wasn't being used
for this.

## The general shape

The question worth asking about any `localStorage` write isn't "does this
work," it's "would I be upset if this reset on a new device." Haptics
resetting is a shrug. A choice made once at onboarding resetting silently,
with no error and no obvious cause, is the kind of small trust erosion that
never produces a bug report - it just produces an app that quietly asks the
same question twice and never explains why.
