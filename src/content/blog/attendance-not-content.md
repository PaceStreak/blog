---
title: "Attendance, not content: what the leaderboard actually ranks"
description: "The whole-life leaderboard ranks one thing: weeks with anything logged, training or habit. It never sees what you logged, because ranking content instead of attendance is how a habit tracker turns into a place people perform for."
date: 2026-09-27T18:00:00Z
tags: ["streaks", "privacy", "product"]
---

There's one leaderboard in PaceStreak that isn't scoped to a single habit or
a single training type: the whole-life streak, ranked by weeks with any
activity at all. It's deliberately the only kind of ranking the product has,
and it's built to be incapable of becoming any other kind.

## Ranking the fact of showing up

The leaderboard's input is a boolean per week, per person: did anything get
logged, yes or no. It doesn't know whether that week's log was a training
session, a habit tick, or three of each. It couldn't rank by volume even if
asked to, because volume was never in the data it was given — the query that
builds it counts weeks with an entry, not the entries themselves.

That's not a privacy feature bolted on afterward. It's the whole design: a
leaderboard that ranked content would need to know the content, and knowing
the content is exactly what habits — especially the ones people are
quitting rather than building — can't afford to have exposed.

## Why attendance is the honest thing to rank anyway

Attendance is also just a better proxy for the thing people actually respect
about consistency. Nobody looking at a name near the top of that board learns
anything about what that person trains, what they're working on, or what
they're avoiding. They learn that the person turns up most weeks. That's the
whole signal, and it's one that holds up whether the weeks behind it were
spent lifting, running, meditating, or logging a habit they've never named
to anyone.

## What never reaches it

A habit's name, its amounts, and any slip logged against it stay off the
feed, the profile and every leaderboard, generic or otherwise — checked by a
test that logs a habit and then searches every surface a person's activity
could leak into for any trace of it. The whole-life board is the one place
where "did you show up" and "what for" are structurally separated, so that
showing up is the only thing that was ever available to rank.
