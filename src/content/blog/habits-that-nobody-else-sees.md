---
title: "Habits that nobody else ever sees"
description: "PaceStreak added habits, including ones people are trying to break. That made one rule non-negotiable: a habit's name, amounts and slips never reach anyone else, not even as a badge name."
date: 2026-09-26T12:00:00Z
tags: ["privacy", "habits", "social"]
---

Training is mostly fine to share. Habits are not. Someone quitting smoking,
drinking or gambling, or keeping a habit they'd rather not explain, is using
PaceStreak because it's private.

## The rule

A habit's name, amounts and slips never reach a feed, a profile, a group or a
leaderboard. That's written into the project's own constraints, next to "no
pricing claims" and "no third-party scripts", because it's the kind of rule
that fails silently if someone forgets it.

## What that means in practice

- **Leaderboards rank attendance, never content.** There's a whole-life streak
  board: weeks with any training or habit. It shows that you turned up, never
  which habit or how much.
- **Badges are named generically.** "Held the line" rather than anything that
  names what you're holding the line against.
- **The feed has no habit events at all.**
- **Notes on a habit day are private**, like the habit.

## Breaking a habit is counted differently

For a habit you're breaking, every day since you started is clean unless you
log a slip. A slip is logged, not punished: the clean-day count restarts, but
the weekly streak asks for *most* days, not perfect ones.

## Checked in tests

The privacy rule has tests of its own: after a person logs habits, the feed,
their public profile and the leaderboards are checked for any trace. A rule
that matters this much gets checked, not trusted.
