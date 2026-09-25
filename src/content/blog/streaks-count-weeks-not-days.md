---
title: "Why PaceStreak's streaks count weeks, not days"
description: "A daily streak punishes rest. The streak engine counts kept weeks against a target you set, forgives bad weeks with earned freezes and a monthly repair, and stores nothing that can drift."
date: 2026-09-25T08:00:00Z
tags: ["product", "streaks", "python", "design"]
---

Every streak app starts with the same idea: count consecutive days. It's simple
to explain and simple to build. It's also the wrong unit for training, and
getting away from it shaped the whole product.

## The problem with daily streaks

A daily chain has exactly one way to keep going: do something today. That
sounds motivating until you're sore, ill, injured or simply following a
programme with rest days in it, which is every sensible programme. At that
point the streak is actively arguing against the right decision.

People respond to this in two ways, both bad. They train when they shouldn't,
to keep a number alive. Or they break the chain once, feel the whole thing is
ruined, and stop. The predecessor to this project saw both, and the second is
the one that kills retention.

So the unit in PaceStreak is **the kept week**.

## A kept week

You set a weekly target: the number of distinct days you intend to train.
A week is kept when you reach it. Two sessions on one Tuesday is still one
day, so splitting a workout doesn't game it.

With a target of four, three rest days cost nothing. The plan you would follow
anyway is exactly the plan that keeps the streak. That's the whole point.

The engine is a pure function in `api/app/game/streak.py`. No I/O, and no
clock: `today` is always passed in, which is what makes it testable.

```python
def compute_chain(
    active_days: Iterable[date],
    today: date,
    week_starts_on: int,
    target_for: Callable[[date], int],
    repaired: Iterable[date] = (),
    repair_available: bool = False,
) -> ChainResult:
```

## Three kinds of forgiveness, in order

A streak that can't forgive a bad week is just a daily streak on a longer
timescale. The engine applies three things, always in this order:

1. **The week in progress never breaks anything.** Until it closes, it's
   `open`. You haven't failed Wednesday's week on Wednesday.
2. **A repair.** The user applies it by hand to one missed week, within the
   last two closed weeks, once a month.
3. **A freeze.** Earned automatically, one for every four kept weeks, holding at
   most two. A freeze is spent automatically on a missed week, but only if
   there's a run to protect.

That last condition matters more than it looks. Without it, a freeze would be
spent on any missed week, including one where the streak was already zero: a
freeze earned by months of work, spent protecting nothing. So the loop checks
`run > 0` before spending:

```python
elif w in repaired_weeks:
    status = "repaired"
elif freezes > 0 and run > 0:
    status = "frozen"
    freezes -= 1
else:
    status = "missed"
```

## Changing your target without rewriting history

People raise their target for a training block and drop it during a hard
month. If the current target judged every past week, lowering it would
suddenly "keep" weeks you missed, and raising it would break weeks you kept.

So targets are a history, `[{"from": "2026-06-02", "target": 4}, ...]`, and
`target_resolver` returns the target in force for any given week. Weeks before
the first entry use the first target, so a chain created today still judges
last month's imported sessions by something sensible.

## Recompute everything, store nothing

The most important decision here is what isn't in the engine: **there is no
job that closes a week.** No cron marks Sunday as kept or missed. The streak is
recomputed from the log every time it's read.

That sounds wasteful. It's linear in the user's history, a few thousand rows
after years of training, and it removes a whole category of bug. Stored streak
state drifts: an edit to last month's session, a timezone change, an import, a
deleted duplicate. Each one needs correction logic, and each correction is a
chance to be wrong. When the streak is a function of the log, editing the log
_is_ the correction.

The same principle runs through XP, records and achievements, which the
[next post](/posts/xp-that-a-heavier-bar-cannot-buy) covers.

## Knowing when you're at risk

The engine also returns what the app needs to be useful mid-week:

- `needed`: sessions still required this week.
- `days_left`: including today, unless you've already trained today.
- `at_risk`: true only when `needed >= days_left`. The maths says so, not a
  timer.
- `will_freeze`: whether a freeze would cover it if the week closes short.

The home screen reads these to say "two more sessions, four days left", and it
stays quiet on day two, when there's nothing useful to say.

## A consistency score that can't be inflated

Each closed week also gets a 0–100 score: days trained over target, **capped at
100**. The consistency figure is the mean of the last four. Training more than
your plan can't raise it, which is why it's safe to put on a leaderboard.

## Try it

The [streaks page](https://www.pacestreak.com/streaks) on the website has a
simulator running a TypeScript port of these rules. Toggle days, change the
target, and watch the freeze in week five arrive, or arrive too late.
