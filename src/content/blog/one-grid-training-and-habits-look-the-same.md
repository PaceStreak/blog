---
title: "One grid: training and habits look the same on purpose"
description: "Training sessions and habits render on the identical week grid, with the identical marker X. The product doesn't visually distinguish 'important' streaks from 'personal' ones, because that distinction is exactly what would make a habit legible to anyone glancing at the screen."
date: 2026-09-27T20:00:00Z
tags: ["design", "habits", "privacy"]
---

Open the week board and a training session and a habit look the same:
a row, a target, cells you mark with the same two-stroke X. There's no
badge on the habit row saying "personal," no different color to flag it as
the sensitive one. That sameness is deliberate, and it's doing more work
than it looks like.

## The problem a special style would create

Give habits their own visual treatment — a lock icon, a muted row, anything
that reads as "handle with care" — and you've just labeled which rows are
the ones worth hiding. Someone glancing at a screen over your shoulder
doesn't need to read the row's name to learn something if the row itself is
dressed differently from the others. The safest way to keep a habit
unreadable at a glance is to make it look like everything else on the page.

## What actually differs, underneath

The visual identity is shared; the logic underneath isn't. A habit you're
trying to break counts backwards from a habit you're building: every day
since you started is clean until you log a slip, and a slip resets the
clean-day count without ending the weekly streak outright. A training
habit just counts sessions against a target. Both surface through the same
component, the same grid, the same mark, because the reader of the screen
never needs to know which kind of row they're looking at — only the person
who owns it does, and they already know.

## The same rule, at every layer

This is the same instinct that keeps a habit's name off the feed and its
amounts off the leaderboard, applied one layer earlier: before data privacy
even comes into it, visual privacy means the screen itself doesn't announce
what's on it. A grid that treats every row identically is the version that
works whether you're looking at your own week or someone else is looking at
it with you.
