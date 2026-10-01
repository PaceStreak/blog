---
title: "A coach made of rules"
description: "The new daily coach is a few if-statements over your own data. Why that beats a generated paragraph, and why the app shows only the notes its existing cards don't already cover."
date: 2026-10-01T16:00:00Z
tags: ["product", "api", "app"]
---

"Daily feedback that pushes you forward" is how the AI coaching apps
describe themselves. PaceStreak's version is `GET /v1/coach/today`, and
every note it returns comes from a rule you could write on an index card:

- A streak with more sessions needed than days left: _"Main needs you
  today."_
- Five or more days since the last session: _"Something short counts."_
- A morning check-in with sleep or energy at 2 or below, or soreness at 4
  or above: _"Go easy."_
- Habits at risk this week, counted but **never named**, because Today
  can sit on a screen someone glances at.
- Yesterday's protein under 80% of your target, or calories well over or
  under it, with under-eating getting the same calm tone as over-eating.

At most four notes, ranked so "do this today" comes before "well done".

## Not saying things twice

The app already had a coach of its own: Today's cards, built on the
device, covering at-risk streaks, comebacks, repairs and plan days, with
buttons that act on them. Showing the server's streak notes as well would
have said everything twice.

So the app takes **only the food notes** from the server. Those are what
the device couldn't see. The server endpoint still returns the full set,
which keeps it useful for anything that isn't this app, like a
notification or a future watch face, without the app repeating itself.

## Why rules

A rule can be wrong, but it's wrong the same way every time, and the fix
is a line in a test. A generated paragraph can be wrong in a new way every
morning. For something that speaks to you daily, boring and predictable is
the feature.
