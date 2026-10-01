---
title: "A routine is only an order"
description: "Habit routines and the focus timer shipped without touching the streak engine. Why a routine stores nothing but a list of ids, and why the timer stores a start time instead of counting."
date: 2026-10-01T14:00:00Z
tags: ["product", "habits", "app"]
---

Routines are the feature apps like Fabulous are built around: a morning
run of water, stretch, journal, done in order with a guided "next step".
Building them in PaceStreak took one rule: **a routine adds no new kind of
progress.**

## What a routine stores

A name, an emoji, a time of day, and an ordered list of habit ids. That's
the whole table. No routine streak, no routine XP, no "routine completed"
event.

Stepping through a routine in the app ticks each habit exactly as tapping
it on Today would. That means the same API call, the same offline queue,
the same streak, the same XP cap. A routine is a faster way to do things
the product already counts, so it can't become a way to count them twice.

Two consequences fell out for free:

- Archive or delete a habit and it simply drops out of any routine. The
  stored list isn't rewritten; the API filters it against live habits.
- "Resume" starts at the first step not yet done today, because "done
  today" already lives on the habits.

## The focus timer stores a timestamp

Minutes habits (practice, study, reading time) now have a focus timer.
The obvious build counts seconds with `setInterval`. It's also wrong on
phones: a locked screen or a background tab throttles or kills the
interval, and the count quietly loses minutes.

So the timer stores **when it started**, plus minutes banked from earlier
runs, in local storage. The display is `now − started + banked`,
recomputed each second while visible. Lock the phone for twenty minutes
and the timer is right when you come back. Close the tab and it's still
running when you reopen it.

Stop adds the whole minutes to today through the same "add to a day" call
the + button uses. Under a minute adds nothing, and says so.
